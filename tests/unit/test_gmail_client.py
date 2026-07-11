"""Offline unit tests for mcp_servers/gmail/client.py's pure logic (no API/OAuth calls)."""

import pytest

from mcp_servers.gmail import client


class _Settings:
    google_credentials_path = "config/this_file_does_not_exist.json"


def test_is_configured_false_when_credentials_file_missing():
    assert client.is_configured(_Settings()) is False


def test_is_configured_false_when_path_unset():
    class _Unset:
        google_credentials_path = ""

    assert client.is_configured(_Unset()) is False


def test_require_approval_blocks_when_unset(monkeypatch):
    monkeypatch.delenv("RIA_EVALUATOR_APPROVED", raising=False)
    with pytest.raises(PermissionError, match="RIA_EVALUATOR_APPROVED"):
        client._require_approval()


def test_require_approval_passes_when_set(monkeypatch):
    monkeypatch.setenv("RIA_EVALUATOR_APPROVED", "1")
    client._require_approval()  # should not raise


def test_send_escalation_email_reports_not_configured(monkeypatch):
    monkeypatch.setenv("RIA_EVALUATOR_APPROVED", "1")
    with pytest.raises(RuntimeError, match="Phase 3"):
        client.send_escalation_email("subject", "body", settings=_Settings())
