"""Offline unit tests for ria/settings.py's loading rules (no API calls).

get_settings() is lru_cached for the process, so every test clears the cache on the way
in AND out -- otherwise one test's environment leaks into another's Settings object.
"""

import pytest

from ria.settings import get_settings


@pytest.fixture()
def clean_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_loads_with_only_anthropic_key(monkeypatch, clean_settings_cache):
    """The clone-and-run path: one key, no Notion, no Google -- settings must load."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    for var in ("NOTION_API_KEY", "NOTION_DATABASE_ID", "NOTION_DATA_SOURCE_ID"):
        monkeypatch.delenv(var, raising=False)

    settings = get_settings()
    assert settings.anthropic_api_key == "sk-ant-test-key"
    assert settings.notion_api_key == ""
    assert settings.notion_database_id == ""
    assert settings.notion_data_source_id is None


def test_anthropic_key_is_still_required(monkeypatch, clean_settings_cache):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        get_settings()


def test_repr_never_contains_secret_values(monkeypatch, clean_settings_cache):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-supersecret-value")
    settings = get_settings()
    assert "sk-ant-supersecret-value" not in repr(settings)


def test_notion_search_enforces_configuration_at_point_of_use(monkeypatch, clean_settings_cache):
    """Notion is optional at load; the client names the missing variable when actually used."""
    from mcp_servers.notion_tracker.client import search_remediation_tracker

    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    for var in ("NOTION_API_KEY", "NOTION_DATABASE_ID", "NOTION_DATA_SOURCE_ID"):
        monkeypatch.delenv(var, raising=False)

    with pytest.raises(RuntimeError, match="NOTION_API_KEY"):
        search_remediation_tracker(get_settings(), "anything")


def test_notion_writer_enforces_configuration_at_point_of_use(monkeypatch, clean_settings_cache):
    from mcp_servers.notion_tracker.writer import create_remediation_record

    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("RIA_EVALUATOR_APPROVED", "1")  # approval gate passes; config gate must still hold
    for var in ("NOTION_API_KEY", "NOTION_DATABASE_ID", "NOTION_DATA_SOURCE_ID"):
        monkeypatch.delenv(var, raising=False)

    with pytest.raises(RuntimeError, match="Notion is not configured"):
        create_remediation_record(None, {}, {}, settings=get_settings())
