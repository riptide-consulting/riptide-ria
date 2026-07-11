"""Offline unit tests for the shared caching layer (no API calls)."""

from datetime import date

from ria.caching import cached_document_prefix
from ria.models import RegulatoryDocument


def _doc(abstract="fallback abstract"):
    return RegulatoryDocument(
        document_number="2026-00099",
        title="Cache Test Rule",
        document_type="Rule",
        agencies=["Centers for Medicare & Medicaid Services"],
        publication_date=date(2026, 7, 1),
        html_url="https://example.gov/doc",
        abstract=abstract,
    )


def test_cache_breakpoint_on_last_block_only():
    blocks = cached_document_prefix(_doc(), "FULL DOCUMENT TEXT")
    assert blocks[-1]["cache_control"] == {"type": "ephemeral"}
    assert "cache_control" not in blocks[0]
    assert "FULL DOCUMENT TEXT" in blocks[-1]["text"]
    assert "2026-00099" in blocks[0]["text"]


def test_falls_back_to_abstract_when_no_full_text():
    blocks = cached_document_prefix(_doc(abstract="only the abstract"), "")
    assert "only the abstract" in blocks[-1]["text"]
