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
from email.mime.text import MIMEText
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from ria.settings import PROJECT_ROOT, Settings, get_settings

_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _credentials_path(settings: Settings) -> Path:
    return PROJECT_ROOT / settings.google_credentials_path


def _token_path(settings: Settings) -> Path:
    return _credentials_path(settings).with_name("google_token.json")


def is_configured(settings: Settings | None = None) -> bool:
    """True once the operator has downloaded OAuth credentials (Phase 3 setup)."""
    settings = settings or get_settings()
    return bool(settings.google_credentials_path) and _credentials_path(settings).exists()


def _require_approval() -> None:
    if os.environ.get("RIA_EVALUATOR_APPROVED", "").strip().lower() not in ("1", "true"):
        raise PermissionError(
            "RIA_EVALUATOR_APPROVED is not set -- refusing to send email. "
            "Set RIA_EVALUATOR_APPROVED=1 to explicitly approve this external side effect."
        )


def _get_credentials(settings: Settings) -> Credentials:
    """Load the cached token, refreshing it or running the one-time interactive consent flow
    (opens a browser) as needed. An Internal Workspace app's refresh token doesn't expire, so
    this should only ever prompt interactively once."""
    token_path = _token_path(settings)
    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), _SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(_credentials_path(settings)), _SCOPES)
            creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json(), encoding="utf-8")
    return creds


def send_escalation_email(subject: str, body: str, settings: Settings | None = None) -> str:
    """Send an escalation notification email. REAL external side effect -- requires
    RIA_EVALUATOR_APPROVED=1 and Phase 3's OAuth setup. Returns the sent message's id."""
    _require_approval()
    settings = settings or get_settings()
    if not is_configured(settings):
        raise RuntimeError(
            f"Google OAuth credentials not found at {_credentials_path(settings)} -- Phase 3 "
            "setup isn't done yet (see scratchpad/scratchpad.md for the Google Cloud Console steps)."
        )
    creds = _get_credentials(settings)
    service = build("gmail", "v1", credentials=creds)

    message = MIMEText(body)
    message["to"] = settings.gmail_escalation_address
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    return sent["id"]
