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


def test_sanitize_header_strips_newlines_and_control_chars():
    hostile = "Legit title\r\nBcc: attacker@evil.com\x00\x1f end"
    cleaned = client._sanitize_header(hostile)
    assert cleaned == "Legit title Bcc: attacker@evil.com  end"
    assert not any(ord(c) < 0x20 or ord(c) == 0x7F for c in cleaned)


def test_sanitize_header_leaves_normal_subjects_alone():
    subject = "[RIA] Escalation: Immediate Suspension of Manufacturing Authorization"
    assert client._sanitize_header(subject) == subject
