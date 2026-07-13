"""Live prompt-quality evals for the Synthesizer (Sonnet). Real API cost.

agents/synthesizer/CLAUDE.md's own stated constraint: the executive_summary must be "plain
language, no jargon, no citations to CFR sections" for a non-technical compliance officer.
Phase 6's eval suite never tested this -- these do, using specialist input that's
deliberately dense with citations and legal jargon so a pass genuinely proves the synthesizer
translates rather than just happening to receive clean input.
"""

import re

import anthropic

from evaluations.conftest import record_usage
from evaluations.fixtures.documents import urgent_enforcement_document
from evaluations.harness import assert_pass_rate
from ria.logging_setup import setup_logging
from ria.settings import get_settings
from ria.synthesizer import _generate_briefing

_CITATION_PATTERN = re.compile(r"\b\d+\s*(C\.?F\.?R\.?|U\.?S\.?C\.?)\b", re.IGNORECASE)
_JARGON_TERMS = (
    "notwithstanding", "pursuant to", "de novo", "promulgated", "misbranded",
    "adjudicatory", "aforementioned", "herein", "heretofore",
)

# Deliberately citation- and jargon-heavy specialist input -- the real test is whether the
# synthesizer strips this out, not whether it passes through already-clean text.
_DENSE_SPECIALIST_RESULTS = {
    "materiality": {"result": {
        "impact_score": 92, "risk_level": "critical",
        "reasoning": (
            "Enforcement action pursuant to 21 U.S.C. 333(f) and 21 CFR Part 207. Firm is "
            "misbranded under Section 502 notwithstanding prior corrective action; the "
            "adjudicatory record herein supports de novo review of the establishment's "
            "registration status."
        ),
        "affected_operations": ["Manufacturing", "Quality Assurance"],
        "compliance_deadline": "2026-07-27", "confidence": 0.9,
    }},
    "gap_analyzer": {"result": {
        "gaps": [{
            "gap_type": "control", "severity": "critical",
            "description": "No documented sterility assurance controls, as promulgated under 21 CFR 211.113.",
            "remediation_action": "Engage outside regulatory counsel per 21 U.S.C. 333(f) exposure.",
            "estimated_effort_days": 10,
        }],
        "total_gaps": 1, "critical_gaps": 1, "confidence": 0.85,
    }},
}
_CLASSIFIER_DECISION = {"priority": "critical", "confidence": 0.9, "reasoning": "Enforcement action."}
_EVALUATOR_DECISION = {"autonomy_tier": 3, "execute": False, "escalate": True,
                        "scores": {"overall_confidence": 0.6}}


def test_executive_summary_has_no_cfr_citations_or_jargon():
    def case():
        doc = urgent_enforcement_document()
        settings = get_settings()
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        logger = setup_logging(settings)
        briefing, usage = _generate_briefing(
            doc, _CLASSIFIER_DECISION, _DENSE_SPECIALIST_RESULTS, _EVALUATOR_DECISION, settings, client, logger,
        )
        record_usage("synthesizer:plain_language", settings.models["synthesizer"], usage)
        summary = briefing["executive_summary"]

        citations = _CITATION_PATTERN.findall(summary)
        assert not citations, f"executive_summary cited a CFR/USC section despite being told not to: {summary!r}"

        found_jargon = [term for term in _JARGON_TERMS if term in summary.lower()]
        assert not found_jargon, f"executive_summary used legal jargon: {found_jargon} in {summary!r}"

        sentences = [s for s in re.split(r"[.!?]+", summary) if s.strip()]
        avg_words_per_sentence = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        assert avg_words_per_sentence < 30, (
            f"executive_summary averages {avg_words_per_sentence:.1f} words/sentence -- "
            f"too dense for a non-technical reader: {summary!r}"
        )

    assert_pass_rate(case, label="synthesizer plain-language constraint")
