"""Classifier: route a RegulatoryDocument to specialist agents (Phase 1).

A single, cached Haiku call -- no agent loop. Uses forced tool use for a schema-validated
routing decision, and caches the rubric + document prefix so Phase 2 specialists reading
the same document reuse it. Behavior mirrors agents/classifier/CLAUDE.md.

Model routing is operator policy (settings.models['classifier']) and must not be upgraded
here (root CLAUDE.md). Schema-validation failures trigger a targeted retry, up to 3 attempts.

``classify_batch`` is the real "batching" CCAF surface (root CLAUDE.md: "Batch jobs: haiku
preferred"): every document's classification is independent of every other, so a whole
ingest window can go through the Anthropic Batches API in one submission instead of N
synchronous calls -- async, ~50% cheaper. Specialists/Evaluator stay per-document: each
depends on THIS document's own prior-stage output, which isn't a batch-shaped problem.
"""

from __future__ import annotations

import time

import anthropic

from ria.logging_setup import log_event, setup_logging
from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings

_SYSTEM = """You are the Classifier for a healthcare regulatory intelligence pipeline.
Route each CMS/FDA document to the specialist agents that should analyze it. Make routing
decisions ONLY -- do not perform analysis. Always route to at least one specialist.
Priority reflects regulatory urgency (enforcement language, deadlines, scope of impact).
Report confidence in [0,1]; when unsure, lower it.

Specialists:
- materiality: how significant / high-impact the change is
- process_impact: operational or workflow changes it forces
- gap_analyzer: compliance gaps versus current state
"""

_ROUTE_TOOL = {
    "name": "route",
    "description": "Record the routing decision for this regulatory document.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "routing": {
                "type": "object",
                "properties": {
                    "materiality": {"type": "boolean"},
                    "process_impact": {"type": "boolean"},
                    "gap_analyzer": {"type": "boolean"},
                },
                "required": ["materiality", "process_impact", "gap_analyzer"],
                "additionalProperties": False,
            },
            "priority": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
            "reasoning": {"type": "string"},
            "confidence": {"type": "number"},
        },
        "required": ["routing", "priority", "reasoning", "confidence"],
        "additionalProperties": False,
    },
}

# agents/classifier/CLAUDE.md: confidence below 0.60 defaults to routing all three specialists.
# Deliberately its own constant, not read from config/pipeline_config.json's autonomy section --
# this is the classifier's own routing rule, a different concept from the Evaluator's tier
# framework (ria/evaluator.py's compute_tier), even though they happen to share this value.
_CONFIDENCE_FLOOR = 0.60


def _document_prompt(doc: RegulatoryDocument) -> str:
    return (
        f"Document number: {doc.document_number}\n"
        f"Type: {doc.document_type}\n"
        f"Agency: {doc.primary_agency}\n"
        f"Published: {doc.publication_date}\n"
        f"Title: {doc.title}\n\n"
        f"Summary:\n{doc.summary(limit=4000) or '(no abstract provided)'}"
    )


def _request_params(doc: RegulatoryDocument, model: str, max_tokens: int) -> dict:
    """The Messages-API request shape shared by classify() and classify_batch(). Both the
    rubric and the document block carry cache_control, same as the original single-call
    design -- the rubric is identical across every document in a batch (request 2..N can
    reuse request 1's write); the document block is per-document so it won't be reread
    across requests, same as it already wasn't in the synchronous path."""
    return {
        "model": model,
        "max_tokens": max_tokens,
        "system": [{"type": "text", "text": _SYSTEM, "cache_control": {"type": "ephemeral"}}],
        "tools": [_ROUTE_TOOL],
        "tool_choice": {"type": "tool", "name": "route"},
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": _document_prompt(doc), "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": "Call the route tool with your decision."},
            ],
        }],
    }


def _extract(resp) -> dict | None:
    """Pull the forced `route` tool_use input from the response, or None."""
    for block in resp.content:
        if block.type == "tool_use" and block.name == "route":
            return dict(block.input)
    return None


def _postprocess(decision: dict, doc: RegulatoryDocument) -> dict:
    """Clamp confidence, apply the low-confidence routing rule, attach document_id."""
    decision["confidence"] = max(0.0, min(1.0, float(decision.get("confidence", 0.0))))
    if decision["confidence"] < _CONFIDENCE_FLOOR:
        decision["routing"] = {"materiality": True, "process_impact": True, "gap_analyzer": True}
    decision["document_id"] = doc.document_number  # completes the classifier output schema
    return decision


def classify(
    doc: RegulatoryDocument,
    settings: Settings | None = None,
    client: anthropic.Anthropic | None = None,
    logger=None,
    max_attempts: int = 3,
):
    """Classify one document. Returns (decision_dict, usage). Raises after max_attempts."""
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    client = client or anthropic.Anthropic(api_key=settings.anthropic_api_key)
    model = settings.models["classifier"]
    params = _request_params(doc, model, settings.max_tokens["classifier"])

    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            resp = client.messages.create(**params)
        except Exception as exc:  # noqa: BLE001 -- transient API/network failure, retry with backoff
            last_err = exc
            log_event(logger, "classifier", "route", "retry", doc=doc.document_number, attempt=attempt,
                      error_type=type(exc).__name__, error=str(exc)[:200])
            if attempt < max_attempts:
                time.sleep(2 ** (attempt - 1))
            continue
        raw = _extract(resp)
        if raw is None:  # schema/shape failure -> targeted retry (root CLAUDE.md)
            last_err = ValueError("no route tool_use block in response")
            log_event(logger, "classifier", "route", "retry",
                      doc=doc.document_number, attempt=attempt, error=str(last_err))
            if attempt < max_attempts:
                time.sleep(2 ** (attempt - 1))
            continue
        decision = _postprocess(raw, doc)
        usage = resp.usage
        log_event(
            logger, "classifier", "route", "ok",
            doc=doc.document_number, priority=decision["priority"],
            confidence=round(decision["confidence"], 2),
            specialists="+".join(k for k, v in decision["routing"].items() if v),
            cache_write=usage.cache_creation_input_tokens,
            cache_read=usage.cache_read_input_tokens,
            model=model, attempt=attempt,
        )
        return decision, usage

    log_event(logger, "classifier", "route", "failed", doc=doc.document_number, error=str(last_err))
    raise RuntimeError(f"classifier failed for {doc.document_number} after {max_attempts} attempts: {last_err}")


def classify_batch(
    docs: list[RegulatoryDocument],
    settings: Settings | None = None,
    client: anthropic.Anthropic | None = None,
    logger=None,
    poll_interval: float = 5.0,
    timeout: float = 600.0,
) -> dict[str, tuple[dict, anthropic.types.Usage]]:
    """Classify many documents in one Anthropic Batches API submission (~50% cheaper than
    the same N calls made synchronously). Blocks, polling every ``poll_interval`` seconds,
    until the batch ends or ``timeout`` is reached.

    Returns {document_number: (decision, usage)} -- only for documents whose sub-request
    succeeded and parsed. A batch failure for one document doesn't fail the whole call (root
    CLAUDE.md: partial results pass downstream with confidence flagged, not a full re-run);
    the caller is expected to notice a missing document_number and fall back to classify()
    for it if it wants every document classified regardless of batch outcome.
    """
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    client = client or anthropic.Anthropic(api_key=settings.anthropic_api_key)
    model = settings.models["classifier"]

    docs_by_id = {doc.document_number: doc for doc in docs}
    requests = [
        {"custom_id": doc.document_number, "params": _request_params(doc, model, settings.max_tokens["classifier"])}
        for doc in docs
    ]

    batch = client.messages.batches.create(requests=requests)
    log_event(logger, "classifier", "batch_submit", "ok", batch_id=batch.id, documents=len(docs), model=model)

    deadline = time.monotonic() + timeout
    while batch.processing_status != "ended":
        if time.monotonic() > deadline:
            log_event(logger, "classifier", "batch_poll", "timeout", batch_id=batch.id, timeout=timeout)
            raise TimeoutError(f"batch {batch.id} did not finish within {timeout}s")
        time.sleep(poll_interval)
        batch = client.messages.batches.retrieve(batch.id)
        counts = batch.request_counts
        log_event(logger, "classifier", "batch_poll", "ok", batch_id=batch.id, status=batch.processing_status,
                  succeeded=counts.succeeded, errored=counts.errored, processing=counts.processing)

    results: dict[str, tuple[dict, anthropic.types.Usage]] = {}
    for line in client.messages.batches.results(batch.id):
        doc = docs_by_id.get(line.custom_id)
        if doc is None:
            continue  # unrecognized custom_id -- shouldn't happen, but don't crash the batch over it
        if line.result.type != "succeeded":
            log_event(logger, "classifier", "batch_result", "failed",
                      doc=line.custom_id, result_type=line.result.type)
            continue
        resp = line.result.message
        raw = _extract(resp)
        if raw is None:
            log_event(logger, "classifier", "batch_result", "failed", doc=line.custom_id, error="no route tool_use")
            continue
        decision = _postprocess(raw, doc)
        results[doc.document_number] = (decision, resp.usage)
        log_event(logger, "classifier", "batch_result", "ok", doc=doc.document_number,
                  priority=decision["priority"], confidence=round(decision["confidence"], 2))

    log_event(logger, "classifier", "batch_complete", "ok", batch_id=batch.id,
              requested=len(docs), succeeded=len(results))
    return results
