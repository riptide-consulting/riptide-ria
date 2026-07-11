"""Classifier: route a RegulatoryDocument to specialist agents (Phase 1).

A single, cached Haiku call -- no agent loop. Uses forced tool use for a schema-validated
routing decision, and caches the rubric + document prefix so Phase 2 specialists reading
the same document reuse it. Behavior mirrors agents/classifier/CLAUDE.md.

Model routing is operator policy (settings.models['classifier']) and must not be upgraded
here (root CLAUDE.md). Schema-validation failures trigger a targeted retry, up to 3 attempts.
"""

from __future__ import annotations

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

    # Cache the stable rubric and the document. cache_read stays 0 until something rereads
    # this prefix (the Phase 2 specialists) -- Phase 1 only exercises the cache write.
    system = [{"type": "text", "text": _SYSTEM, "cache_control": {"type": "ephemeral"}}]
    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": _document_prompt(doc), "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": "Call the route tool with your decision."},
        ],
    }]

    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        resp = client.messages.create(
            model=model,
            max_tokens=settings.max_tokens["classifier"],
            system=system,
            tools=[_ROUTE_TOOL],
            tool_choice={"type": "tool", "name": "route"},
            messages=messages,
        )
        raw = _extract(resp)
        if raw is None:  # schema/shape failure -> targeted retry (root CLAUDE.md)
            last_err = ValueError("no route tool_use block in response")
            log_event(logger, "classifier", "route", "retry",
                      doc=doc.document_number, attempt=attempt, error=str(last_err))
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
