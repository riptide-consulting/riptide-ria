"""Google Drive MCP server -- real MCP protocol over stdio, not a plain API wrapper.

Wraps client.py's functions as MCP tools so any MCP client can search/read the operator's
Drive the same way the pipeline does internally. Read-only (drive.readonly scope, User data):
no external side effects, no Evaluator approval needed.

Run standalone:
    python -m mcp_servers.google_drive.server
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from mcp_servers.google_drive.client import fetch_document_text, search_policy_documents

mcp = FastMCP("google-drive")


@mcp.tool()
def search_drive_documents(query: str, limit: int = 5) -> list[dict]:
    """Search the operator's Google Drive for files whose name or content matches query."""
    return search_policy_documents(query, limit=limit)


@mcp.tool()
def get_drive_document_text(file_id: str, mime_type: str, max_chars: int = 20000) -> str:
    """Fetch a Drive file's text content by its file id (exports Google Docs/Sheets/Slides
    to plain text automatically)."""
    return fetch_document_text(file_id, mime_type, max_chars=max_chars)


if __name__ == "__main__":
    mcp.run()
