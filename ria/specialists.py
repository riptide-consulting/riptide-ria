"""Specialist sub-agents: materiality, process_impact, gap_analyzer (Phase 2 step 2).

Each specialist reads the SAME cached document prefix (ria.caching.ask_over_document) and
answers with a free-form JSON object matching its output schema (agents/<name>/CLAUDE.md).
Calls carry no system prompt and no tools -- keeping that (plus the model) identical across
all three reads is what lets cache_read light up on the 2nd and 3rd call, because prompt-cache
matching requires the whole prefix (tools + system + messages up to the breakpoint) to be
byte-identical, not just the cached block itself (see ria/caching.py). The specialist's role
and schema instructions live in the per-call question text instead, appended after the cached
document.

Phase 3 folds Google Drive content into the shared cached prefix (ria/caching.py) rather
than giving each specialist its own live tool -- a per-specialist tool would vary the
tools/system portion of the prefix per specialist, which would break the cache-sharing this
whole module depends on (see ria/caching.py's docstring). The cached context always states
plainly whether Drive found anything relevant, so specialists never have to guess.
"""

from __future__ import annotations

import json
import time

from ria.caching import ask_over_document, cached_document_prefix, fetch_drive_context
from ria.logging_setup import log_event, setup_logging
from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings

_DRIVE_NOTE = (
    "The cached context above states whether any internal policy documents were found in "
    "Google Drive for this agency/topic. If none were found, say so plainly in `reasoning` "
    "wherever the rubric below asks you to compare against existing internal documentation "
    "-- don't fabricate a comparison that didn't happen."
)

_MATERIALITY_PROMPT = f"""You are the Materiality Assessor. Score how materially this
regulation impacts healthcare operations. {_DRIVE_NOTE}

Flag any enforcement action or penalty language immediately in `reasoning`.

Respond with ONLY a single JSON object (no markdown fences, no commentary) with exactly
these keys:
{{
  "impact_score": <integer 0-100>,
  "risk_level": "critical" | "high" | "medium" | "low",
  "affected_operations": [<string>, ...],
  "compliance_deadline": <"YYYY-MM-DD" or null>,
  "reasoning": <string>,
  "confidence": <float 0-1>
}}"""

_PROCESS_IMPACT_PROMPT = f"""You are the Process Impact Mapper. Map this regulation's
requirements to specific internal processes and workflows that require modification or
review. {_DRIVE_NOTE}

Never suggest a process change without citing the specific regulatory text driving it
(cite it inline in `required_change`). Always suggest a process owner. List at most 10
affected processes -- the most consequential ones if more apply.

Respond with ONLY a single JSON object (no markdown fences, no commentary) with exactly
these keys:
{{
  "affected_processes": [
    {{
      "process_name": <string>,
      "current_state": <string>,
      "required_change": <string>,
      "effort_estimate": "low" | "medium" | "high",
      "owner_suggested": <string>
    }}, ...
  ],
  "reasoning": <string>,
  "confidence": <float 0-1>
}}"""

_GAP_ANALYZER_PROMPT = f"""You are the Gap Analyzer. Identify gaps between current
organizational documentation/controls and what this regulation requires. {_DRIVE_NOTE}

Every critical gap must include a specific remediation_action. Never mark a gap involving
PHI or patient safety as low severity. If a gap requires external legal or compliance
counsel, say so explicitly inside remediation_action.

Respond with ONLY a single JSON object (no markdown fences, no commentary) with exactly
these keys:
{{
  "gaps": [
    {{
      "gap_type": "policy" | "control" | "documentation" | "training",
      "description": <string>,
      "severity": "critical" | "high" | "medium" | "low",
      "remediation_action": <string>,
      "estimated_effort_days": <integer>
    }}, ...
  ],
  "reasoning": <string>,
  "confidence": <float 0-1>
}}"""

# Dict order is the fixed run order (materiality -> process_impact -> gap_analyzer): the
# CCAF "chaining" surface. run_all_specialists only calls the ones the classifier routed to.
_SPECIALISTS = {
    "materiality": _MATERIALITY_PROMPT,
    "process_impact": _PROCESS_IMPACT_PROMPT,
    "gap_analyzer": _GAP_ANALYZER_PROMPT,
}

_PHI_KEYWORDS = ("phi", "patient safety", "protected health information")


def _parse_json(text: str) -> dict | None:
    """Best-effort JSON parse; tolerates a ```json ... ``` fence some models add anyway."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if "\n" in cleaned:
            first_line, rest = cleaned.split("\n", 1)
            cleaned = rest if first_line.strip().lower() in ("json", "") else cleaned
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return None


def _postprocess_materiality(result: dict, logger, doc_id: str) -> dict:
    """agents/materiality/CLAUDE.md: impact_score > 80 always forces risk_level=critical."""
    score = max(0, min(100, int(result.get("impact_score", 0))))
    result["impact_score"] = score
    if score > 80 and result.get("risk_level") != "critical":
        log_event(logger, "materiality", "risk_override", "ok", doc=doc_id,
                   reason=f"impact_score={score} > 80 forces risk_level=critical")
        result["risk_level"] = "critical"
    return result


def _postprocess_process_impact(result: dict, logger, doc_id: str) -> dict:
    """agents/process_impact/CLAUDE.md: at most 10 affected processes; log any drop."""
    processes = result.get("affected_processes") or []
    if len(processes) > 10:
        log_event(logger, "process_impact", "truncate", "warn", doc=doc_id,
                   returned=len(processes), kept=10)
        result["affected_processes"] = processes[:10]
    return result


def _postprocess_gap_analyzer(result: dict, logger, doc_id: str) -> dict:
    """agents/gap_analyzer/CLAUDE.md: critical gaps need a remediation action, PHI/patient
    safety gaps can never be low severity, and totals are derived rather than model-reported."""
    gaps = result.get("gaps") or []
    for gap in gaps:
        if gap.get("severity") == "critical" and not (gap.get("remediation_action") or "").strip():
            gap["remediation_action"] = "Remediation action required -- escalate to compliance for review."
            log_event(logger, "gap_analyzer", "remediation_fallback", "warn", doc=doc_id,
                       gap_type=gap.get("gap_type", "unknown"))
        description = (gap.get("description") or "").lower()
        if gap.get("severity") == "low" and any(k in description for k in _PHI_KEYWORDS):
            log_event(logger, "gap_analyzer", "severity_override", "ok", doc=doc_id,
                       reason="PHI/patient-safety keyword found in a gap marked low severity")
            gap["severity"] = "high"
    result["gaps"] = gaps
    result["total_gaps"] = len(gaps)
    result["critical_gaps"] = sum(1 for g in gaps if g.get("severity") == "critical")
    return result


_POSTPROCESS = {
    "materiality": _postprocess_materiality,
    "process_impact": _postprocess_process_impact,
    "gap_analyzer": _postprocess_gap_analyzer,
}


def run_specialist(
    key: str,
    prefix_blocks: list[dict],
    doc: RegulatoryDocument,
    settings: Settings | None = None,
    client=None,
    logger=None,
    max_attempts: int = 3,
):
    """Run one specialist over the shared cached document prefix. Returns (result, usage).

    Schema-validation failures (unparseable JSON) trigger a targeted retry, up to
    max_attempts, per root CLAUDE.md.
    """
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    question = _SPECIALISTS[key]

    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        prompt = question if attempt == 1 else (
            f"{question}\n\nYour previous reply was not valid JSON ({last_err}). "
            "Reply again with ONLY the JSON object, no other text."
        )
        try:
            text, usage = ask_over_document(
                prefix_blocks, prompt, settings=settings, client=client,
                max_tokens=settings.max_tokens["specialist"],
            )
        except Exception as exc:  # noqa: BLE001 -- transient API/network failure, retry with backoff
            last_err = exc
            log_event(logger, key, "analyze", "retry", doc=doc.document_number, attempt=attempt,
                      error_type=type(exc).__name__, error=str(exc)[:200])
            if attempt < max_attempts:
                time.sleep(2 ** (attempt - 1))
            continue
        result = _parse_json(text)
        if result is None:
            last_err = ValueError("response was not valid JSON")
            log_event(logger, key, "analyze", "retry", doc=doc.document_number, attempt=attempt)
            if attempt < max_attempts:
                time.sleep(2 ** (attempt - 1))
            continue

        result["document_id"] = doc.document_number
        result["confidence"] = max(0.0, min(1.0, float(result.get("confidence", 0.0))))
        result["tokens_used"] = usage.input_tokens + usage.output_tokens
        result["cache_hit"] = usage.cache_read_input_tokens > 0
        result = _POSTPROCESS[key](result, logger, doc.document_number)

        log_event(
            logger, key, "analyze", "ok", doc=doc.document_number,
            confidence=round(result["confidence"], 2),
            cache_write=usage.cache_creation_input_tokens,
            cache_read=usage.cache_read_input_tokens,
            attempt=attempt,
        )
        return result, usage

    log_event(logger, key, "analyze", "failed", doc=doc.document_number, error=str(last_err))
    raise RuntimeError(f"{key} failed for {doc.document_number} after {max_attempts} attempts: {last_err}")


def run_all_specialists(
    doc: RegulatoryDocument,
    full_text: str,
    routing: dict,
    settings: Settings | None = None,
    client=None,
    logger=None,
) -> dict:
    """Run the specialists the classifier routed to, in a fixed order, over ONE cached prefix.

    The first call writes the document into the cache; every specialist after it reads the
    same prefix (cache_read > 0) instead of re-paying for the full document -- the "chaining"
    and "caching" CCAF surfaces working together.

    One specialist exhausting its own retries doesn't stop the others -- each is independent
    over the same cached prefix, so there's no reason gap_analyzer shouldn't still run just
    because materiality failed. A missing key in the returned dict IS the failure signal
    (root CLAUDE.md: partial results pass downstream with confidence flagged, not a full
    re-run); every downstream reader already handles a routing-partial dict via .get()/
    dict comprehension, so a specialist-failure-partial dict needs no special-casing there.
    """
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    drive_context = fetch_drive_context(doc, settings=settings, logger=logger)
    prefix = cached_document_prefix(doc, full_text, drive_context)

    results = {}
    for key in _SPECIALISTS:
        if not routing.get(key):
            continue
        try:
            result, usage = run_specialist(key, prefix, doc, settings=settings, client=client, logger=logger)
        except Exception as exc:  # noqa: BLE001 -- one specialist's exhausted retries shouldn't block the rest
            log_event(logger, key, "analyze", "unrecoverable", doc=doc.document_number,
                      error_type=type(exc).__name__, error=str(exc)[:300])
            continue
        results[key] = {"result": result, "usage": usage}
    return results
