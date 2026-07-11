"""Shared Google OAuth credential loading for the Gmail and Drive clients.

One consent flow can request a UNION of scopes, but a cached token is only valid for the
exact scopes it was originally granted -- requesting a different scope set needs its own
token file. token_name distinguishes them (e.g. "gmail_token.json" vs "drive_token.json") so
Gmail's send-only grant and Drive's read-only grant stay independent: authorizing one never
silently grants the other.
"""

from __future__ import annotations

from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from ria.settings import PROJECT_ROOT, Settings


def credentials_path(settings: Settings) -> Path:
    return PROJECT_ROOT / settings.google_credentials_path


def is_configured(settings: Settings) -> bool:
    """True once the operator has downloaded OAuth client credentials (Phase 3 setup)."""
    return bool(settings.google_credentials_path) and credentials_path(settings).exists()


def get_credentials(settings: Settings, scopes: list[str], token_name: str) -> Credentials:
    """Load the cached token for these exact scopes, refreshing it or running the one-time
    interactive consent flow (opens a browser) as needed. An Internal Workspace app's refresh
    token doesn't expire, so this should only ever prompt interactively once per scope set."""
    token_path = credentials_path(settings).with_name(token_name)
    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), scopes)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path(settings)), scopes)
            creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json(), encoding="utf-8")
    return creds
