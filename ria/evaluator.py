"""Evaluator: the trust-boundary gate (Phase 2 step 4).

agents/evaluator/CLAUDE.md is explicit: "This agent CANNOT be bypassed under any
circumstances." That guarantee has to be mechanical, not a prompt instruction an LLM
might drift from -- so Opus supplies judgment (per-specialist quality scores, an overall
confidence, flags including enforcement language) and ``compute_tier`` is the ONLY thing
allowed to turn that judgment into an autonomy_tier / execute / escalate decision. This is
the same proposes-then-code-disposes pattern as the classifier's confidence floor
(ria/classifier.py), just made more visible here since this IS the trust boundary. The
structured-output schema this agent is asked to fill in (_DECISION_SCHEMA) deliberately
does NOT include autonomy_tier/execute/escalate -- Opus is never even asked to propose a
tier it has no real authority over.

Built on the Claude Agent SDK rather than the plain ``anthropic`` client everything else in
this codebase uses -- the deliberate, one-time exercise of the SDK CCAF surface (see
Architecture Direction in scratchpad/scratchpad.md). It earns that choice with a genuine
agentic loop: the Evaluator has ONE live tool (read-only Notion precedent lookup) it can
choose to call before answering, unlike the classifier/specialists' single forced-tool-call
pattern. It has zero built-in tools (``tools=[]`` in ClaudeAgentOptions) -- no filesystem,
no shell, nothing beyond that one read-only lookup.

"This agent does not retry - it decides on what it receives" (its CLAUDE.md) is read here as
"no self-revision" -- it doesn't get a second look to second-guess its own judgment. That's
different from a technical retry on a malformed SDK response, which root CLAUDE.md's general
retry rule (max 3 attempts) still covers -- see ``evaluate()``.
"""

from __future__ import annotations

import asyncio
import json

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    ToolUseBlock,
    create_sdk_mcp_server,
    query,
    tool,
)
from notion_client import Client

from ria.logging_setup import log_event, setup_logging
from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings

_ENFORCEMENT_KEYWORDS = (
    "enforcement action", "penalty", "civil monetary", "prohibited act", "misbranded",
)


def _detect_enforcement(specialist_results: dict, flags: list[str]) -> bool:
    """True if the Evaluator's own flags or the materiality reasoning name enforcement
    exposure. Backstops the model's judgment with a plain keyword check (same pattern as
    the PHI/patient-safety check in ria/specialists.py's gap analyzer post-processing)."""
    if any("enforcement" in f.lower() for f in flags):
        return True
    materiality = (specialist_results or {}).get("materiality", {}).get("result", {})
    reasoning = (materiality.get("reasoning") or "").lower()
    return any(kw in reasoning for kw in _ENFORCEMENT_KEYWORDS)


def compute_tier(
    overall_confidence: float,
    risk_level: str | None,
    enforcement_detected: bool,
    autonomy_config: dict,
) -> tuple[int, bool, bool]:
    """Deterministic autonomy-tier decision. Returns (tier, execute, escalate).

    Root CLAUDE.md: TIER 1 auto-execute needs confidence >= tier1_threshold AND risk in
    (low, medium); TIER 2 human review is the default otherwise; TIER 3 escalate is a hard
    override for low confidence, critical risk, or enforcement language -- checked first so
    nothing can out-rank an escalation trigger.
    """
    tier1 = autonomy_config.get("tier1_threshold", 0.90)
    tier2 = autonomy_config.get("tier2_threshold", 0.75)
    critical_escalates = autonomy_config.get("critical_risk_always_escalates", True)
    enforcement_escalates = autonomy_config.get("enforcement_language_always_escalates", True)

    if risk_level is None:
        # Materiality didn't run, so there's no risk signal to trust a tier-1/2 call on.
        return 3, False, True
    risk_level = risk_level.lower()

    if overall_confidence < tier2:
        return 3, False, True
    if critical_escalates and risk_level == "critical":
        return 3, False, True
    if enforcement_escalates and enforcement_detected:
        return 3, False, True
    if overall_confidence >= tier1 and risk_level in ("low", "medium"):
        return 1, True, False
    return 2, False, False


def _title(prop: dict | None) -> str:
    parts = (prop or {}).get("title") or []
    return "".join(p.get("plain_text", "") for p in parts).strip() or "(untitled)"


def _select(prop: dict | None) -> str:
    sel = (prop or {}).get("select")
    return sel.get("name") if sel else "unknown"


def _checkbox(prop: dict | None) -> bool:
    return bool((prop or {}).get("checkbox"))


def _search_notion_precedent(settings: Settings, search_term: str, limit: int = 5) -> list[dict]:
    """Read-only Notion query -- no writes, so it needs no Evaluator-approval gate itself.
    Runs synchronously; the tool handler wraps this in asyncio.to_thread."""
    client = Client(auth=settings.notion_api_key)
    kwargs: dict = {"data_source_id": settings.notion_data_source_id, "page_size": limit}
    if search_term:
        kwargs["filter"] = {"property": "Regulation Name", "title": {"contains": search_term}}
    result = client.data_sources.query(**kwargs)

    records = []
    for row in result.get("results", []):
        props = row.get("properties", {})
        records.append({
            "name": _title(props.get("Regulation Name")),
            "risk": _select(props.get("Risk Level")),
            "status": _select(props.get("Status")),
            "escalated": _checkbox(props.get("Escalated")),
        })
    return records


def _make_notion_precedent_tool(settings: Settings):
    """Build the Evaluator's one live tool, closing over settings for the Notion client."""

    @tool(
        "query_notion_precedent",
        "Search the RIA Remediation Tracker in Notion for prior regulatory documents with "
        "similar agency or subject matter, to check for precedent before scoring. Read-only; "
        "optional -- call it zero or more times before giving your final answer.",
        {"search_term": str},
    )
    async def query_notion_precedent(args: dict) -> dict:
        search_term = (args.get("search_term") or "").strip()
        if not settings.notion_data_source_id:
            return {"content": [{"type": "text", "text": "No Notion data source configured; skip precedent check."}]}
        try:
            records = await asyncio.to_thread(_search_notion_precedent, settings, search_term)
        except Exception as exc:  # noqa: BLE001 -- surface any Notion failure to the model, don't crash the run
            return {"content": [{"type": "text", "text": f"Notion query failed: {exc}"}], "is_error": True}
        if not records:
            return {"content": [{"type": "text", "text": f"No precedent found for '{search_term}'."}]}
        lines = [f"- {r['name']}: risk={r['risk']}, status={r['status']}, escalated={r['escalated']}"
                 for r in records]
        return {"content": [{"type": "text", "text": "\n".join(lines)}]}

    return query_notion_precedent


_DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {
            "type": "object",
            "properties": {
                "materiality_quality": {"type": "number"},
                "process_impact_quality": {"type": "number"},
                "gap_analysis_quality": {"type": "number"},
                "overall_confidence": {"type": "number"},
            },
            "required": ["materiality_quality", "process_impact_quality", "gap_analysis_quality",
                         "overall_confidence"],
            "additionalProperties": False,
        },
        "flags": {"type": "array", "items": {"type": "string"}},
        "reasoning": {"type": "string"},
        "human_review_notes": {"type": ["string", "null"]},
    },
    "required": ["scores", "flags", "reasoning", "human_review_notes"],
    "additionalProperties": False,
}


def _build_prompt(doc: RegulatoryDocument, classifier_decision: dict, specialist_results: dict) -> str:
    payload = {
        "document": {"id": doc.document_number, "title": doc.title, "agency": doc.primary_agency},
        "classifier": {
            "priority": classifier_decision.get("priority"),
            "confidence": classifier_decision.get("confidence"),
            "reasoning": classifier_decision.get("reasoning"),
        },
        "specialists": {key: v["result"] for key, v in specialist_results.items()},
    }
    return (
        "You are the Evaluator for a healthcare regulatory intelligence pipeline -- the trust-"
        "boundary gate. Score the quality of each specialist's analysis below (0-1 each), and give "
        "an overall_confidence (0-1) that reconciles all of them: conflicting specialist outputs "
        "should pull overall_confidence DOWN, not average out. List any flags, including explicitly "
        "adding the word 'enforcement' to a flag if any specialist's text describes enforcement "
        "action or penalty exposure. You may call query_notion_precedent to check for similar past "
        "documents before deciding -- it is optional and read-only. Always fill human_review_notes "
        "when you believe a human should look closely, otherwise leave it null. Do NOT decide an "
        "autonomy tier yourself -- that is computed deterministically from your scores afterward, "
        "not by you.\n\n"
        f"{json.dumps(payload, indent=2, default=str)}"
    )


async def _evaluate_async(
    doc: RegulatoryDocument, classifier_decision: dict, specialist_results: dict, settings: Settings, logger,
):
    notion_tool = _make_notion_precedent_tool(settings)
    server = create_sdk_mcp_server(name="notion", version="1.0.0", tools=[notion_tool])

    options = ClaudeAgentOptions(
        model=settings.models["evaluator"],
        tools=[],  # no built-in tools at all -- no filesystem/shell access of any kind
        allowed_tools=["mcp__notion__query_notion_precedent"],
        mcp_servers={"notion": server},
        strict_mcp_config=True,  # ignore any ambient .mcp.json / global MCP config
        # Safe specifically because tools=[] leaves nothing else this could bypass.
        permission_mode="bypassPermissions",
        output_format={"type": "json_schema", "schema": _DECISION_SCHEMA},
        max_turns=4,  # one optional precedent lookup + the final structured answer
        # The SDK's subprocess transport otherwise inherits whatever auth is ambient in the
        # shell (e.g. a developer's own Claude Code login) -- pin it to the project's own key,
        # same as every other agent in this codebase (ria/classifier.py, ria/caching.py).
        env={"ANTHROPIC_API_KEY": settings.anthropic_api_key},
    )

    # Let the generator run to its own natural end instead of returning/breaking as soon as
    # ResultMessage arrives -- query() is one-shot, so it finishes right after anyway, and an
    # early return here forces an abrupt cancellation that races the SDK's own internal
    # cleanup (surfaces as "aclose(): asynchronous generator is already running").
    result: tuple[dict, dict, float] | None = None
    prompt = _build_prompt(doc, classifier_decision, specialist_results)
    async for message in query(prompt=prompt, options=options):
        # Root CLAUDE.md: log every tool invocation, not just the final decision.
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, ToolUseBlock):
                    log_event(logger, "evaluator", "tool_use", "ok",
                              doc=doc.document_number, tool=block.name, input=json.dumps(block.input)[:160])
        if isinstance(message, ResultMessage):
            if message.is_error or message.structured_output is None:
                raise RuntimeError(f"evaluator SDK query failed: subtype={message.subtype}")
            result = (message.structured_output, message.usage or {}, message.total_cost_usd or 0.0)
    if result is None:
        raise RuntimeError("evaluator SDK query produced no ResultMessage")
    return result


def evaluate(
    doc: RegulatoryDocument,
    classifier_decision: dict,
    specialist_results: dict,
    settings: Settings | None = None,
    logger=None,
    max_attempts: int = 3,
):
    """Score a document's specialist analysis and return (decision_dict, usage).

    Technical/schema failures get a targeted retry (root CLAUDE.md, max 3 attempts) -- this
    is distinct from the "no self-revision" rule, which governs the model's judgment once a
    call succeeds, not whether a broken call gets retried at all.
    """
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)

    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            structured, usage, cost_usd = asyncio.run(
                _evaluate_async(doc, classifier_decision, specialist_results, settings, logger)
            )
        except Exception as exc:  # noqa: BLE001 -- any SDK/transport failure is a targeted-retry case
            last_err = exc
            log_event(logger, "evaluator", "evaluate", "retry",
                      doc=doc.document_number, attempt=attempt, error=str(exc)[:160])
            continue

        scores = structured.get("scores") or {}
        overall_confidence = max(0.0, min(1.0, float(scores.get("overall_confidence", 0.0))))
        risk_level = (specialist_results.get("materiality") or {}).get("result", {}).get("risk_level")
        flags = structured.get("flags") or []
        enforcement = _detect_enforcement(specialist_results, flags)
        tier, execute, escalate = compute_tier(overall_confidence, risk_level, enforcement, settings.autonomy)

        decision = {
            "document_id": doc.document_number,
            "autonomy_tier": tier,
            "execute": execute,
            "escalate": escalate,
            "scores": scores,
            "flags": flags,
            "enforcement_detected": enforcement,
            "reasoning": structured.get("reasoning", ""),
            "human_review_notes": structured.get("human_review_notes"),
        }

        log_event(
            logger, "evaluator", "evaluate", "ok", doc=doc.document_number,
            tier=tier, execute=execute, escalate=escalate,
            overall_confidence=round(overall_confidence, 2), risk_level=risk_level or "unknown",
            enforcement_detected=enforcement, cost_usd=round(cost_usd, 4), attempt=attempt,
        )
        return decision, usage

    log_event(logger, "evaluator", "evaluate", "failed", doc=doc.document_number, error=str(last_err))
    raise RuntimeError(f"evaluator failed for {doc.document_number} after {max_attempts} attempts: {last_err}")
