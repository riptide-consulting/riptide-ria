"""Federal Register MCP server -- real MCP protocol over stdio, not a plain API wrapper.

Wraps the functions in client.py as MCP tools so any MCP client (Claude Code itself,
another agent, a different project) can query recent CMS/FDA filings the same way this
pipeline does internally, instead of the only access path being a Python import. Read-only:
no external side effects, no Evaluator approval needed.

Run standalone:
    python -m mcp_servers.federal_register.server

Register in an MCP client's config (e.g. this project's .mcp.json) with:
    {"command": ".venv/Scripts/python.exe", "args": ["-m", "mcp_servers.federal_register.server"]}
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from mcp_servers.federal_register.client import fetch_document, fetch_full_text, fetch_recent_documents
from ria.settings import get_settings

mcp = FastMCP("federal-register")


@mcp.tool()
def list_recent_documents(limit: int = 20) -> list[dict]:
    """List recent CMS/FDA Federal Register documents within the configured lookback window."""
    settings = get_settings()
    docs = fetch_recent_documents(settings)[:limit]
    return [
        {
            "document_number": d.document_number,
            "title": d.title,
            "document_type": d.document_type,
            "agency": d.primary_agency,
            "publication_date": str(d.publication_date),
            "html_url": d.html_url,
        }
        for d in docs
    ]


@mcp.tool()
def get_document_full_text(document_number: str, max_chars: int = 60000) -> str:
    """Fetch one Federal Register document's full text (XML/HTML) by its document number."""
    settings = get_settings()
    doc = fetch_document(document_number, settings=settings)
    if doc is None:
        return f"Document {document_number} not found."
    text = fetch_full_text(doc, settings=settings, max_chars=max_chars)
    return text or "(no full text available for this document)"


if __name__ == "__main__":
    mcp.run()
