"""Google Drive queries (read-only): internal policy documents for specialist comparison.

Plain functions, no MCP/SDK dependency -- reused directly by ria/caching.py (folded into the
specialists' shared cached document prefix) AND wrapped as real MCP tools in server.py, same
one-implementation-two-callers pattern as mcp_servers/notion_tracker.

This is User data access (real files a human organized in their own Drive), not the hidden
App Data folder -- drive.readonly is the correct, minimal scope for that. Read-only: no
writes, so no Evaluator-approval gate needed. Requires Phase 3's Google OAuth setup
(mcp_servers/google_auth.py); callers should check is_configured() first.
"""

from __future__ import annotations

import io

from docx import Document
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from mcp_servers.google_auth import get_credentials
from ria.settings import Settings, get_settings

_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
_TOKEN_NAME = "drive_token.json"

# Google-native formats (Docs/Sheets/Slides) have no raw bytes to download -- they must be
# exported to a plain format instead. Anything not listed here is downloaded as-is.
_EXPORT_MIME_TYPES = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}

# Uploaded (non-Google-native) formats that are real binary containers, not plain text --
# decoding these as UTF-8 produces garbage (the zip/xml bytes rendered as mojibake), not an
# error, so this was silently corrupting specialist context until caught against a real file.
_BINARY_PARSERS = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        lambda raw: "\n".join(p.text for p in Document(io.BytesIO(raw)).paragraphs if p.text.strip()),
}


def search_policy_documents(query: str, settings: Settings | None = None, limit: int = 5) -> list[dict]:
    """Search the operator's Drive for files whose name or content matches `query`."""
    settings = settings or get_settings()
    creds = get_credentials(settings, _SCOPES, _TOKEN_NAME)
    service = build("drive", "v3", credentials=creds)
    safe_query = query.replace("'", "\\'")
    result = service.files().list(
        q=f"fullText contains '{safe_query}' and trashed = false",
        pageSize=limit,
        fields="files(id, name, mimeType, modifiedTime)",
    ).execute()
    return result.get("files", [])


def fetch_document_text(
    file_id: str, mime_type: str, settings: Settings | None = None, max_chars: int = 20000,
) -> str:
    """Fetch a Drive file's text content, exporting Google-native formats to plain text."""
    settings = settings or get_settings()
    creds = get_credentials(settings, _SCOPES, _TOKEN_NAME)
    service = build("drive", "v3", credentials=creds)

    export_type = _EXPORT_MIME_TYPES.get(mime_type)
    request = (
        service.files().export_media(fileId=file_id, mimeType=export_type)
        if export_type else service.files().get_media(fileId=file_id)
    )

    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    raw = buffer.getvalue()

    parser = _BINARY_PARSERS.get(mime_type)
    text = parser(raw) if parser else raw.decode("utf-8", errors="ignore")
    return text[:max_chars]
