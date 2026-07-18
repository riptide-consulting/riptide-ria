"""Live prompt-quality evals for the specialists (Sonnet). Real API calls, real cost.

Asserts the actual live prompt+model behavior meets its rubric (agents/materiality/CLAUDE.md,
agents/gap_analyzer/CLAUDE.md). The PHI-severity rule is ALSO enforced deterministically in
code (ria/specialists.py's _postprocess_gap_analyzer), so this exercises the whole path end
to end -- both "did the model even raise a PHI-shaped gap" and "does severity end up right."
"""

from evaluations.conftest import record_usage
from evaluations.fixtures.documents import (
    phi_adjacent_gap_document,
    phi_adjacent_gap_full_text,
    urgent_enforcement_document,
    urgent_enforcement_full_text,
)
from evaluations.harness import assert_pass_rate
from ria.caching import cached_document_prefix
from ria.settings import get_settings
from ria.specialists import run_specialist


def test_materiality_flags_enforcement_language():
    def case():
        doc = urgent_enforcement_document()
        prefix = cached_document_prefix(doc, urgent_enforcement_full_text())
        result, usage = run_specialist("materiality", prefix, doc)
        record_usage("materiality", get_settings().models["specialist"], usage)
        reasoning = result["reasoning"].lower()
        assert "enforcement" in reasoning or "penalt" in reasoning, reasoning[:200]

    assert_pass_rate(case, label="materiality flags enforcement")


def test_gap_analyzer_never_leaves_a_phi_gap_at_low_severity():
    def case():
        doc = phi_adjacent_gap_document()
        prefix = cached_document_prefix(doc, phi_adjacent_gap_full_text())
        result, usage = run_specialist("gap_analyzer", prefix, doc)
        record_usage("gap_analyzer", get_settings().models["specialist"], usage)
        phi_gaps = [
            g for g in result["gaps"]
            if "phi" in g["description"].lower() or "protected health information" in g["description"].lower()
        ]
        assert phi_gaps, "expected at least one PHI-related gap to be identified from this fixture"
        assert all(g["severity"] != "low" for g in phi_gaps)

    assert_pass_rate(case, label="gap_analyzer PHI severity floor")
