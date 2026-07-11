"""Notion remediation-tracker MCP server -- real MCP protocol over stdio.

Wraps client.py's search_remediation_tracker as an MCP tool so any MCP client can query
the RIA Remediation Tracker directly, the same function the Evaluator's own in-process
tool calls internally. Read-only: no external side effects, no Evaluator approval needed.

Run standalone:
    python -m mcp_servers.notion_tracker.server
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from mcp_servers.notion_tracker.client import search_remediation_tracker
from ria.settings import get_settings

mcp = FastMCP("notion-tracker")


@mcp.tool()
def search_tracker(search_term: str = "", limit: int = 5) -> list[dict]:
    """Search the RIA Remediation Tracker in Notion for prior regulatory documents. Empty
    search_term returns the most recent records instead of filtering."""
    settings = get_settings()
    try:
        return search_remediation_tracker(settings, search_term, limit)
    except RuntimeError as exc:
        return [{"error": str(exc)}]


if __name__ == "__main__":
    mcp.run()
