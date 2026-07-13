"""Live prompt-quality evals for the Classifier (Haiku). Real API calls, real cost -- not
part of the offline tests/unit/ suite. Run manually with `pytest evaluations -q`; CI only
runs these automatically once the ANTHROPIC_API_KEY secret is configured.

Each case runs through evaluations/harness.py's pass-rate check (default 3 repeats, 2/3
required; RIA_EVAL_REPEATS=1 reproduces single-shot). Model output is stochastic; a rate
is a measurement, one sample is an anecdote.

Root CLAUDE.md: "Prompt changes must pass eval suite before merge." These assert the
classifier's actual live judgment discriminates between an urgent, enforcement-heavy
document and a routine administrative one -- not just that the code parses a response.
"""

from evaluations.conftest import record_usage
from evaluations.fixtures.documents import routine_renewal_document, urgent_enforcement_document
from evaluations.harness import assert_pass_rate
from ria.classifier import classify
from ria.settings import get_settings


def test_urgent_enforcement_document_gets_high_priority():
    def case():
        decision, usage = classify(urgent_enforcement_document())
        record_usage("classifier:urgent", get_settings().models["classifier"], usage)
        assert decision["priority"] in ("high", "critical"), decision["priority"]

    assert_pass_rate(case, label="classifier urgent-vs-routine (urgent)")


def test_routine_renewal_document_gets_low_priority():
    def case():
        decision, usage = classify(routine_renewal_document())
        record_usage("classifier:routine", get_settings().models["classifier"], usage)
        assert decision["priority"] in ("low", "medium"), decision["priority"]

    assert_pass_rate(case, label="classifier urgent-vs-routine (routine)")
