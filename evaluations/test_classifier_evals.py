"""Live prompt-quality evals for the Classifier (Haiku). Real API calls, real cost -- not
part of the offline tests/unit/ suite. Run manually with `pytest evaluations -q`; CI only
runs these automatically once the ANTHROPIC_API_KEY secret is configured.

Root CLAUDE.md: "Prompt changes must pass eval suite before merge." These assert the
classifier's actual live judgment discriminates between an urgent, enforcement-heavy
document and a routine administrative one -- not just that the code parses a response.
"""

from evaluations.conftest import record_usage
from evaluations.fixtures.documents import routine_renewal_document, urgent_enforcement_document
from ria.classifier import classify
from ria.settings import get_settings


def test_urgent_enforcement_document_gets_high_priority():
    decision, usage = classify(urgent_enforcement_document())
    record_usage("classifier:urgent", get_settings().models["classifier"], usage)
    assert decision["priority"] in ("high", "critical")


def test_routine_renewal_document_gets_low_priority():
    decision, usage = classify(routine_renewal_document())
    record_usage("classifier:routine", get_settings().models["classifier"], usage)
    assert decision["priority"] in ("low", "medium")
