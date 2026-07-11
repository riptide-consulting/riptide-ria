"""Unit tests for ria.models.RegulatoryDocument."""

from datetime import date

from ria.models import RegulatoryDocument


def _doc(**overrides):
    base = dict(
        document_number="2026-00001",
        title="Test Rule",
        document_type="Rule",
        agencies=["Centers for Medicare & Medicaid Services"],
        publication_date=date(2026, 7, 1),
        html_url="https://example.gov/doc",
    )
    base.update(overrides)
    return RegulatoryDocument(**base)


def test_to_classifier_input_matches_schema():
    ci = _doc(abstract="A long abstract").to_classifier_input()
    assert set(ci) == {"document_id", "document_type", "agency", "title", "summary", "full_text_cached"}
    assert ci["document_id"] == "2026-00001"
    assert ci["agency"] == "Centers for Medicare & Medicaid Services"
    assert ci["full_text_cached"] is False


def test_primary_agency_defaults_to_unknown():
    assert _doc(agencies=[]).primary_agency == "Unknown"


def test_primary_agency_prefers_subagency_over_department():
    doc = _doc(agencies=["Health and Human Services Department", "Food and Drug Administration"])
    assert doc.primary_agency == "Food and Drug Administration"


def test_summary_truncates():
    assert len(_doc(abstract="x" * 1000).summary(limit=100)) == 100
