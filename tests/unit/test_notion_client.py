"""Offline unit tests for mcp_servers/notion_tracker/client.py's pure helpers (no API calls)."""

import pytest

from mcp_servers.notion_tracker import client


def test_title_extracts_plain_text():
    prop = {"title": [{"plain_text": "Drug "}, {"plain_text": "Listing Rule"}]}
    assert client._title(prop) == "Drug Listing Rule"


def test_title_defaults_when_empty():
    assert client._title({"title": []}) == "(untitled)"
    assert client._title(None) == "(untitled)"


def test_select_reads_name():
    assert client._select({"select": {"name": "High"}}) == "High"


def test_select_defaults_when_unset():
    assert client._select({"select": None}) == "unknown"
    assert client._select(None) == "unknown"


def test_status_reads_name():
    # Notion's `status` type is distinct from `select` -- {"status": {"name": ...}}, not
    # {"select": {"name": ...}}. Using _select() here would silently return "unknown".
    assert client._status({"status": {"name": "In progress"}}) == "In progress"


def test_status_defaults_when_unset():
    assert client._status({"status": None}) == "unknown"
    assert client._status(None) == "unknown"


def test_checkbox_reads_value():
    assert client._checkbox({"checkbox": True}) is True
    assert client._checkbox({"checkbox": False}) is False


def test_checkbox_defaults_false_when_missing():
    assert client._checkbox(None) is False


def test_row_to_record_maps_a_realistic_notion_row():
    # Shaped like a real API response -- this is the test that would have caught the
    # Status/_select mixup, since it exercises the whole row -> record mapping at once.
    row = {
        "properties": {
            "Regulation Name": {"title": [{"plain_text": "Test Rule"}]},
            "Risk Level": {"select": {"name": "High"}},
            "Status": {"status": {"name": "In progress"}},
            "Escalated": {"checkbox": True},
        }
    }
    assert client._row_to_record(row) == {
        "name": "Test Rule", "risk": "High", "status": "In progress", "escalated": True,
    }


def test_search_remediation_tracker_raises_without_data_source():
    class _Settings:
        notion_data_source_id = None
        notion_api_key = "unused"

    with pytest.raises(RuntimeError, match="NOTION_DATA_SOURCE_ID"):
        client.search_remediation_tracker(_Settings())
