"""Gmail escalation-notification sending (Phase 5: the Synthesizer's escalation path).

Real external side effect -- gated the same way as Notion writes
(mcp_servers/notion_tracker/writer.py): RIA_EVALUATOR_APPROVED must be set, checked at the
point of sending, not left to callers to remember.

Requires Google OAuth credentials at the path configured by GOOGLE_CREDENTIALS_PATH in .env
(Phase 3 setup, done by the operator in Google Cloud Console -- see scratchpad for the exact
steps). This module never assumes that's done: is_configured() lets callers check first, and
send_escalation_email raises a clear, specific error rather than a confusing stack trace if
it isn't ready yet.
"""

from __future__ import annotations

import base64
import os
import re
from email.mime.text import MIMEText

from googleapiclient.discovery import build

from mcp_servers.google_auth import credentials_path, get_credentials, is_configured
from ria.settings import Settings, get_settings

_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
_TOKEN_NAME = "gmail_token.json"

_HEADER_UNSAFE = re.compile(r"[\r\n\x00-\x1f\x7f]+")


def _sanitize_header(value: str) -> str:
    """Collapse CR/LF/control characters to a single space. Subjects are built from
    document titles, which are untrusted external text (same threat model as
    ria/classifier.py) -- Python's email library refuses embedded headers outright, so
    without this a hostile or malformed title makes the escalation send RAISE, which is
    the worst possible failure mode for the pipeline's highest-priority notification."""
    return _HEADER_UNSAFE.sub(" ", value).strip()


def _require_approval() -> None:
    if os.environ.get("RIA_EVALUATOR_APPROVED", "").strip().lower() not in ("1", "true"):
        raise PermissionError(
            "RIA_EVALUATOR_APPROVED is not set -- refusing to send email. "
            "Set RIA_EVALUATOR_APPROVED=1 to explicitly approve this external side effect."
        )


def send_escalation_email(subject: str, body: str, settings: Settings | None = None) -> str:
    """Send an escalation notification email. REAL external side effect -- requires
    RIA_EVALUATOR_APPROVED=1 and Phase 3's OAuth setup. Returns the sent message's id."""
    _require_approval()
    settings = settings or get_settings()
    if not is_configured(settings):
        raise RuntimeError(
            f"Google OAuth credentials not found at {credentials_path(settings)} -- Phase 3 "
            "setup isn't done yet (see scratchpad/scratchpad.md for the Google Cloud Console steps)."
        )
    creds = get_credentials(settings, _SCOPES, _TOKEN_NAME)
    service = build("gmail", "v1", credentials=creds)

    message = MIMEText(body)
    message["to"] = settings.gmail_escalation_address
    message["subject"] = _sanitize_header(subject)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    return sent["id"]
