"""Prove the Evaluator end to end: real specialist output in, a tier decision out.

Runs the full chain -- classify, all three specialists, then the Agent-SDK-backed
Evaluator -- on one real document. Confirms the SDK integration works live (structured
output, the optional Notion precedent tool, cost/usage reporting) and that the tier
computed from Opus's scores matches root CLAUDE.md's autonomy framework.

    python evaluator_probe.py
"""

from __future__ import annotations

from mcp_servers.federal_register.client import fetch_full_text, fetch_recent_documents
from ria.classifier import classify
from ria.evaluator import evaluate
from ria.logging_setup import log_event, setup_logging
from ria.settings import get_settings
from ria.specialists import run_all_specialists

_FORCE_ALL = {"materiality": True, "process_impact": True, "gap_analyzer": True}


def main() -> int:
    settings = get_settings()
    logger = setup_logging(settings)
    docs = fetch_recent_documents(settings, logger=logger)

    doc, full_text = None, ""
    for candidate in docs:
        text = fetch_full_text(candidate, settings, logger=logger)
        if len(text) > 8000:
            doc, full_text = candidate, text
            break
    if doc is None:
        print("No document with sufficient full text found; widen the lookback window and retry.")
        return 1

    print(f"\n{doc.document_number}: {doc.title[:70]}")
    classifier_decision, _ = classify(doc, settings=settings, logger=logger)
    print(f"Classifier: priority={classifier_decision['priority']} confidence={classifier_decision['confidence']:.2f}")

    specialist_results = run_all_specialists(doc, full_text, _FORCE_ALL, settings=settings, logger=logger)
    for key, entry in specialist_results.items():
        print(f"  {key}: confidence={entry['result']['confidence']:.2f}")

    print("-" * 96)
    decision, usage = evaluate(doc, classifier_decision, specialist_results, settings=settings, logger=logger)
    log_event(logger, "evaluator_probe", "run", "ok", doc=doc.document_number, tier=decision["autonomy_tier"])

    print(f"Autonomy tier: {decision['autonomy_tier']}  execute={decision['execute']}  "
          f"escalate={decision['escalate']}")
    print(f"Scores: {decision['scores']}")
    print(f"Enforcement detected: {decision['enforcement_detected']}")
    print(f"Flags: {decision['flags']}")
    print(f"Human review notes: {decision['human_review_notes']}")
    print(f"Reasoning: {decision['reasoning'][:400]}")
    print(f"\nUsage: {usage}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
