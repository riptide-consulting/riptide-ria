"""Live prompt-quality evals for the Evaluator (Opus, Agent SDK). Real API cost.

compute_tier() itself is a pure function, fully covered by offline unit tests -- what's never
been tested live is Opus's own judgment feeding it: does overall_confidence actually reflect
the specialists' analysis, and does agents/evaluator/CLAUDE.md's "conflicting specialist
outputs should pull overall_confidence DOWN, not average out" instruction hold in practice.
"""

from evaluations.conftest import record_usage
from evaluations.fixtures.documents import urgent_enforcement_document, urgent_enforcement_full_text
from ria.caching import cached_document_prefix
from ria.evaluator import evaluate
from ria.settings import get_settings
from ria.specialists import run_specialist

_CLASSIFIER_DECISION = {"priority": "critical", "confidence": 0.9, "reasoning": "Enforcement action."}

# Deliberately contradictory: materiality says routine/low-risk, gap_analyzer says severe --
# the same document cannot honestly be both. Tests whether the Evaluator's own confidence
# score reflects that conflict, not just an average of two "quality" scores.
_CONFLICTING_SPECIALIST_RESULTS = {
    "materiality": {"result": {
        "impact_score": 8, "risk_level": "low",
        "reasoning": "Routine administrative matter with minimal operational impact.",
        "affected_operations": [], "compliance_deadline": None, "confidence": 0.9,
    }},
    "gap_analyzer": {"result": {
        "gaps": [
            {"gap_type": "control", "severity": "critical",
             "description": "No sterility assurance controls documented.",
             "remediation_action": "Escalate to outside counsel immediately.", "estimated_effort_days": 5},
            {"gap_type": "documentation", "severity": "critical",
             "description": "No corrective action plan on file for prior violations.",
             "remediation_action": "Draft and file corrective action plan within 15 days.",
             "estimated_effort_days": 10},
        ],
        "total_gaps": 2, "critical_gaps": 2, "confidence": 0.9,
    }},
}


def test_enforcement_chain_end_to_end_forces_tier_3():
    """Real specialists over a real enforcement document, then the real Evaluator -- not
    compute_tier() fed hand-crafted inputs, the whole live chain.

    Deliberately single-shot: this is the expensive Opus + Agent SDK path (see
    docs/COST-BREAKDOWN.md), and the hard tier-3 overrides it exercises are deterministic
    in compute_tier once enforcement is detected. The stochastic pieces (does the model
    discriminate, does injected text move it) get their pass-rate treatment in the cheap
    classifier/specialist evals and test_injection_evals.py instead."""
    doc = urgent_enforcement_document()
    settings = get_settings()
    prefix = cached_document_prefix(doc, urgent_enforcement_full_text())

    materiality_result, materiality_usage = run_specialist("materiality", prefix, doc, settings=settings)
    record_usage("evaluator_chain:materiality", settings.models["specialist"], materiality_usage)
    gap_result, gap_usage = run_specialist("gap_analyzer", prefix, doc, settings=settings)
    record_usage("evaluator_chain:gap_analyzer", settings.models["specialist"], gap_usage)
    specialist_results = {
        "materiality": {"result": materiality_result, "usage": materiality_usage},
        "gap_analyzer": {"result": gap_result, "usage": gap_usage},
    }

    decision, usage = evaluate(doc, _CLASSIFIER_DECISION, specialist_results, settings=settings)
    record_usage("evaluator:enforcement_chain", settings.models["evaluator"], usage)

    assert decision["enforcement_detected"] is True, f"missed enforcement language: {decision}"
    assert decision["autonomy_tier"] == 3, f"enforcement detected but tier != 3: {decision}"
    assert decision["escalate"] is True


def test_conflicting_specialists_pull_confidence_down_not_average():
    doc = urgent_enforcement_document()
    settings = get_settings()

    decision, usage = evaluate(doc, _CLASSIFIER_DECISION, _CONFLICTING_SPECIALIST_RESULTS, settings=settings)
    record_usage("evaluator:conflict_reconciliation", settings.models["evaluator"], usage)

    tier1_threshold = settings.autonomy.get("tier1_threshold", 0.90)
    confidence = decision["scores"]["overall_confidence"]
    assert confidence < tier1_threshold, (
        f"materiality said low-risk/routine, gap_analyzer said 2 critical gaps -- overall_confidence "
        f"={confidence} still reached auto-execute territory (>= {tier1_threshold}) despite the conflict: {decision}"
    )
