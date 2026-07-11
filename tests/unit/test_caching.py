"""Offline unit tests for the shared caching layer (no API calls)."""

from datetime import date

from ria import caching
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
    assert "cache_control" not in blocks[1]
    assert "FULL DOCUMENT TEXT" in blocks[1]["text"]
    assert "2026-00099" in blocks[0]["text"]


def test_falls_back_to_abstract_when_no_full_text():
    blocks = cached_document_prefix(_doc(abstract="only the abstract"), "")
    assert "only the abstract" in blocks[1]["text"]


def test_drive_context_present_states_it_plainly():
    blocks = cached_document_prefix(_doc(), "FULL TEXT", drive_context="POLICY DOC CONTENT")
    assert "POLICY DOC CONTENT" in blocks[-1]["text"]
    assert "Internal policy documents found" in blocks[-1]["text"]


def test_drive_context_absent_says_so_honestly():
    blocks = cached_document_prefix(_doc(), "FULL TEXT", drive_context="")
    assert "No matching internal policy documents were found" in blocks[-1]["text"]


def test_fetch_drive_context_returns_empty_when_not_configured(monkeypatch):
    monkeypatch.setattr(caching, "google_configured", lambda settings: False)

    class _Logger:
        def info(self, msg):
            pass

    assert caching.fetch_drive_context(_doc(), settings=object(), logger=_Logger()) == ""


def test_fetch_drive_context_returns_empty_when_search_finds_nothing(monkeypatch):
    monkeypatch.setattr(caching, "google_configured", lambda settings: True)
    monkeypatch.setattr(caching, "search_policy_documents", lambda query, settings, limit: [])

    class _Logger:
        def info(self, msg):
            pass

    assert caching.fetch_drive_context(_doc(), settings=object(), logger=_Logger()) == ""
