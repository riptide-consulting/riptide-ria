"""Notion remediation-tracker queries (read-only).

Plain functions, no MCP/SDK dependency -- reused directly by ria/evaluator.py's in-process
Evaluator tool AND wrapped as a real MCP tool in server.py. One implementation, two ways to
call it: a fast in-process import for the pipeline's own agents, and a real MCP server
(stdio) for any external MCP client.

Read-only: never creates, updates, or deletes anything, so it carries no external side
effects and needs no Evaluator approval per root CLAUDE.md.
"""

from __future__ import annotations

from notion_client import Client

from ria.settings import Settings, get_settings


def _title(prop: dict | None) -> str:
    parts = (prop or {}).get("title") or []
    return "".join(p.get("plain_text", "") for p in parts).strip() or "(untitled)"


def _select(prop: dict | None) -> str:
    sel = (prop or {}).get("select")
    return sel.get("name") if sel else "unknown"


def _status(prop: dict | None) -> str:
    """Notion's `status` property type is a distinct type from `select` -- same {"name": ...}
    shape, but nested under a different key. Reading it with _select() silently returns
    "unknown" instead of raising, which is exactly what let this go unnoticed until now."""
    status = (prop or {}).get("status")
    return status.get("name") if status else "unknown"


def _checkbox(prop: dict | None) -> bool:
    return bool((prop or {}).get("checkbox"))


def _row_to_record(row: dict) -> dict:
    """Map one raw Notion row to the shape search_remediation_tracker returns. Pure and
    testable on its own -- separated out specifically so a wrong-helper-for-the-property-type
    mistake (like _select() used on the Status property, which is actually type `status`, not
    `select`) shows up in a unit test instead of only in a live workspace with real data."""
    props = row.get("properties", {})
    return {
        "name": _title(props.get("Regulation Name")),
        "risk": _select(props.get("Risk Level")),
        "status": _status(props.get("Status")),
        "escalated": _checkbox(props.get("Escalated")),
    }


def search_remediation_tracker(
    settings: Settings | None = None,
    search_term: str = "",
    limit: int = 5,
) -> list[dict]:
    """Search the RIA Remediation Tracker in Notion. Empty search_term returns the most
    recent `limit` records instead of filtering. Raises RuntimeError if no Notion data
    source is configured -- that's a real misconfiguration, not an empty-results case."""
    settings = settings or get_settings()
    if not settings.notion_data_source_id:
        raise RuntimeError("NOTION_DATA_SOURCE_ID is not configured")

    client = Client(auth=settings.notion_api_key)
    kwargs: dict = {"data_source_id": settings.notion_data_source_id, "page_size": limit}
    if search_term:
        kwargs["filter"] = {"property": "Regulation Name", "title": {"contains": search_term}}
    result = client.data_sources.query(**kwargs)
    return [_row_to_record(row) for row in result.get("results", [])]
