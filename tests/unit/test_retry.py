"""Offline unit tests for ria/retry.py's failure classification (no API calls)."""

import anthropic
import httpx

from ria.retry import is_retryable


def _status_error(code: int) -> anthropic.APIStatusError:
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    response = httpx.Response(status_code=code, request=request)
    return anthropic.APIStatusError("boom", response=response, body=None)


def test_auth_and_bad_request_fail_fast():
    assert is_retryable(_status_error(401)) is False
    assert is_retryable(_status_error(400)) is False
    assert is_retryable(_status_error(403)) is False


def test_rate_limit_and_timeout_are_transient():
    assert is_retryable(_status_error(429)) is True
    assert is_retryable(_status_error(408)) is True


def test_server_errors_are_transient():
    assert is_retryable(_status_error(500)) is True
    assert is_retryable(_status_error(529)) is True  # anthropic overloaded_error


def test_non_api_exceptions_stay_retryable():
    # Network blips, transport resets, anything local: keep the old behavior.
    assert is_retryable(ConnectionError("reset")) is True
    assert is_retryable(TimeoutError("slow")) is True
