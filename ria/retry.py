"""Shared retryable-vs-fatal classification for Anthropic API failures.

Root CLAUDE.md's targeted-retry rule (max 3 attempts) is for transient failures. Before
this helper existed, every retry loop treated ALL exceptions as transient -- so a 401
(bad key) or a 400 (invalid request) burned three attempts with backoff before failing,
which slows the run down and muddies the log with retries that could never succeed.

Rule: HTTP 4xx is a fatal request problem and fails fast, EXCEPT 408 (request timeout)
and 429 (rate limited), which are transient by definition. Everything else -- 5xx,
overloads, network/transport errors, unexpected local exceptions -- stays retryable,
matching the previous behavior for genuinely transient cases.

Used by ria/classifier.py, ria/specialists.py, and ria/synthesizer.py. The Evaluator's
retry loop is deliberately not routed through this: it runs on the Claude Agent SDK's
subprocess transport, whose failures don't map onto HTTP status codes the same way.
"""

from __future__ import annotations

import anthropic

_RETRYABLE_4XX = {408, 429}


def is_retryable(exc: Exception) -> bool:
    """True if the failure is worth another attempt with backoff."""
    if isinstance(exc, anthropic.APIStatusError):
        status = exc.status_code
        return status >= 500 or status in _RETRYABLE_4XX
    return True
