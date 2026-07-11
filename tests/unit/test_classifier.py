"""Offline unit tests for the Classifier's pure logic (no API calls)."""

from datetime import date

from ria import classifier
from ria.models import RegulatoryDocument


def _doc():
    return RegulatoryDocument(
        document_number="2026-00042",
        title="Test Rule",
        document_type="Rule",
        agencies=["Centers for Medicare & Medicaid Services"],
        publication_date=date(2026, 7, 1),
        html_url="https://example.gov/doc",
    )


def test_low_confidence_routes_all_specialists():
    decision = classifier._postprocess(
        {
            "routing": {"materiality": True, "process_impact": False, "gap_analyzer": False},
            "priority": "low",
            "reasoning": "unsure",
            "confidence": 0.4,
        },
        _doc(),
    )
    assert decision["routing"] == {"materiality": True, "process_impact": True, "gap_analyzer": True}
    assert decision["document_id"] == "2026-00042"


def test_confidence_is_clamped():
    decision = classifier._postprocess(
        {
            "routing": {"materiality": True, "process_impact": True, "gap_analyzer": True},
            "priority": "high",
            "reasoning": "clear",
            "confidence": 1.5,
        },
        _doc(),
    )
    assert decision["confidence"] == 1.0


def test_extract_finds_route_tool_input():
    class Block:
        type = "tool_use"
        name = "route"
        input = {"priority": "high"}

    class Resp:
        content = [Block()]

    assert classifier._extract(Resp()) == {"priority": "high"}


def test_extract_returns_none_without_tool():
    class Block:
        type = "text"
        text = "hi"

    class Resp:
        content = [Block()]

    assert classifier._extract(Resp()) is None


def test_request_params_forces_route_tool_choice():
    params = classifier._request_params(_doc(), "claude-haiku-4-5-20251001", 1024)
    assert params["tool_choice"] == {"type": "tool", "name": "route"}
    assert params["model"] == "claude-haiku-4-5-20251001"
    assert params["max_tokens"] == 1024


def test_request_params_caches_system_and_document_blocks():
    params = classifier._request_params(_doc(), "claude-haiku-4-5-20251001", 1024)
    assert params["system"][0]["cache_control"] == {"type": "ephemeral"}
    assert params["messages"][0]["content"][0]["cache_control"] == {"type": "ephemeral"}


def test_request_params_is_identical_across_documents_except_content():
    # Same system rubric text -> the block a batch's request 2..N can cache-read from
    # request 1's write, since the API matches on exact prefix content, not identity.
    a = classifier._request_params(_doc(), "claude-haiku-4-5-20251001", 1024)
    b = classifier._request_params(_doc(), "claude-haiku-4-5-20251001", 1024)
    assert a["system"] == b["system"]
