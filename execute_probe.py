"""Prove the Synthesizer's gated Notion write (main.py --synthesize) end to end, once.

Every live Evaluator run this session has landed Tier 3, so there's no naturally-occurring
Tier-1 document to exercise the write path with yet (see scratchpad: plausibly because every
specialist this phase discloses "no internal policy access," which legitimately suppresses
confidence below the auto-execute floor -- Phase 3 dependency, not a bug).

This uses a REAL document's metadata but a FABRICATED, clearly-labeled Tier-1-shaped decision
-- calling create_remediation_record with the exact same argument shape the Synthesizer's
execute path uses, so this proves the write mechanism and the call contract, not a real classification.
Every text field written to Notion says SYNTHETIC TEST DATA so it's unmistakable if anyone
looks at the record afterward. Requires RIA_EVALUATOR_APPROVED=1, same as any real write.

    RIA_EVALUATOR_APPROVED=1 python execute_probe.py
"""

from __future__ import annotations

from mcp_servers.federal_register.client import fetch_recent_documents
from mcp_servers.notion_tracker.writer import create_remediation_record
from ria.logging_setup import setup_logging
from ria.settings import get_settings

_SYNTHETIC_DECISION = {
    "autonomy_tier": 1,
    "execute": True,
    "escalate": False,
    "scores": {
        "materiality_quality": 0.9,
        "process_impact_quality": 0.9,
        "gap_analysis_quality": 0.9,
        "overall_confidence": 0.95,
    },
    "flags": [],
    "enforcement_detected": False,
    "reasoning": "SYNTHETIC TEST DATA -- fabricated to prove main.py's --execute write path "
                 "end to end (execute_probe.py). Not a real Evaluator decision. Safe to delete.",
    "human_review_notes": None,
}

_SYNTHETIC_SPECIALISTS = {
    "materiality": {"result": {
        "risk_level": "low",
        "impact_score": 20,
        "compliance_deadline": None,
        "reasoning": "SYNTHETIC TEST DATA -- not a real materiality assessment.",
    }},
    "gap_analyzer": {"result": {
        "gaps": [{"remediation_action": "SYNTHETIC TEST DATA -- no real gap identified; this "
                                         "row exists only to prove the --execute write path."}],
    }},
    "process_impact": {"result": {
        "affected_processes": [{"owner_suggested": "N/A (synthetic test record)"}],
    }},
}


def main() -> int:
    settings = get_settings()
    logger = setup_logging(settings)
    doc = fetch_recent_documents(settings, logger=logger)[0]

    print(f"Using real document metadata: {doc.document_number} -- {doc.title[:70]}")
    print("Decision and specialist data below are FABRICATED (Tier-1-shaped) to exercise the "
          "write path -- not a real classification.\n")

    page_id = create_remediation_record(doc, _SYNTHETIC_DECISION, _SYNTHETIC_SPECIALISTS, settings=settings)
    print(f"Wrote Notion page: {page_id}")
    print("Every text field in this record says SYNTHETIC TEST DATA -- safe to delete from the tracker.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
