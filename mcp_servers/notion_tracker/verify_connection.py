"""verify_connection.py -- Riptide RIA Notion connectivity check (read-only).

Confirms the Notion integration token can reach the target database and read its
property schema under Notion API version ``2025-09-03``.

Why this script exists
----------------------
As of API version ``2025-09-03`` (the default baked into notion-client 3.1.0), a
Notion database is a *container* for one or more **data sources**. The property
schema that used to live on the database object now lives on each data source:

    databases.retrieve(database_id)   -> object="database", NO "properties",
                                         instead a "data_sources": [{id, name}] list
    data_sources.retrieve(ds_id)      -> object="data_source", HAS "properties"

That is why a plain ``databases.retrieve`` looked like it was "missing" the
``properties`` key. This script walks the correct path
(database -> data_sources[] -> properties) and then performs a single-row,
read-only query to confirm row-level read access.

Read-only by design
-------------------
This script never creates, updates, or deletes anything in Notion. It therefore
carries no external side effects and does not require Evaluator approval per the
operator trust boundaries in the root CLAUDE.md. Secrets are never printed.

Usage
-----
    python mcp_servers/notion_tracker/verify_connection.py

Exit codes: 0 = connection verified, 1 = configuration error, 2 = API/connection error.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from notion_client import APIErrorCode, APIResponseError, Client, RequestTimeoutError

# Project root is two levels up from this file: mcp_servers/notion_tracker/ -> repo root.
PROJECT_ROOT = Path(__file__).resolve().parents[2]


# --- small output helpers (ASCII only, for Windows console safety) ------------

def ok(msg: str) -> None:
    print(f"[ OK ] {msg}")


def info(msg: str) -> None:
    print(f"[INFO] {msg}")


def warn(msg: str) -> None:
    print(f"[WARN] {msg}")


def fail(msg: str) -> None:
    print(f"[FAIL] {msg}")


def section(title: str) -> None:
    print()
    print(title)
    print("-" * len(title))


def plain_title(obj: dict[str, Any]) -> str:
    """Flatten a Notion rich-text ``title`` array into plain text."""
    parts = obj.get("title") or []
    text = "".join(p.get("plain_text", "") for p in parts).strip()
    return text or "(untitled)"


# --- verification steps -------------------------------------------------------

def load_config() -> tuple[str, str]:
    """Load and validate required environment. Never prints secret values."""
    env_path = PROJECT_ROOT / ".env"
    load_dotenv(env_path)

    section("Configuration")
    if env_path.exists():
        ok(f".env found at {env_path}")
    else:
        warn(f"no .env at {env_path} (relying on ambient environment)")

    token = os.getenv("NOTION_API_KEY", "").strip()
    database_id = os.getenv("NOTION_DATABASE_ID", "").strip()

    missing = [n for n, v in (("NOTION_API_KEY", token), ("NOTION_DATABASE_ID", database_id)) if not v]
    if missing:
        fail(f"missing required variable(s): {', '.join(missing)}")
        sys.exit(1)

    # Report presence only -- do not expose the token itself.
    ok(f"NOTION_API_KEY loaded ({len(token)} chars)")
    ok(f"NOTION_DATABASE_ID = {database_id}")
    return token, database_id


def verify(token: str, database_id: str) -> int:
    client = Client(auth=token)
    info(f"Notion-Version: {client.options.notion_version}")

    # --- Step 1: retrieve the database (proves token + sharing + reachability)
    section("Step 1/3  Retrieve database")
    database = client.databases.retrieve(database_id=database_id)
    ok(f"connected: object={database.get('object')!r}, id={database.get('id')}")
    ok(f"title: {plain_title(database)}")

    data_sources = database.get("data_sources")
    if data_sources is None:
        # Older API shape (pre 2025-09-03): schema is on the database itself.
        props = database.get("properties", {})
        warn("no 'data_sources' key -- this looks like a pre-2025-09-03 response")
        ok(f"schema read directly from database: {len(props)} propert(y/ies)")
        _print_schema(props)
        info("Connection verified (legacy database shape).")
        return 0

    ok(f"database exposes {len(data_sources)} data source(s)")
    for i, ds in enumerate(data_sources):
        info(f"  [{i}] name={ds.get('name')!r} id={ds.get('id')}")

    if not data_sources:
        fail("database has zero data sources -- nothing to read")
        return 2

    # --- Step 2: retrieve each data source (this is where 'properties' lives now)
    section("Step 2/3  Retrieve data source schema")
    primary_ds_id = data_sources[0]["id"]
    for i, ds in enumerate(data_sources):
        ds_id = ds["id"]
        source = client.data_sources.retrieve(data_source_id=ds_id)
        props = source.get("properties", {})
        marker = "  (primary)" if ds_id == primary_ds_id else ""
        ok(f"data source [{i}] object={source.get('object')!r} title={plain_title(source)!r}{marker}")
        ok(f"     schema: {len(props)} propert(y/ies)")
        _print_schema(props, indent="       - ")

    # --- Step 3: read-only single-row query (confirms row-level read access)
    section("Step 3/3  Read-only query (page_size=1)")
    try:
        result = client.data_sources.query(data_source_id=primary_ds_id, page_size=1)
        rows = result.get("results", [])
        ok(f"query succeeded on primary data source: {len(rows)} row(s) in first page, "
           f"has_more={result.get('has_more')}")
    except APIResponseError as e:
        if e.code == APIErrorCode.Unauthorized:
            raise  # a real auth failure should fail the whole run
        warn(f"query returned {e.code.value}: {e}")
        warn("schema is readable but row query was rejected -- check integration read capabilities")

    section("Result")
    ok("Notion connection verified.")
    info(f"Primary data source id (use this for Phase 1 queries + page writes): {primary_ds_id}")
    return 0


def _print_schema(props: dict[str, Any], indent: str = "  - ") -> None:
    for name, spec in sorted(props.items()):
        print(f"{indent}{name} ({spec.get('type', '?')})")


def _explain_api_error(e: APIResponseError) -> None:
    code = e.code
    fail(f"Notion API error: {code.value} -- {e}")
    if code == APIErrorCode.Unauthorized:
        info("The integration token is invalid or expired. Regenerate it in Notion "
             "(Settings -> Connections -> your integration) and update NOTION_API_KEY in .env.")
    elif code == APIErrorCode.ObjectNotFound:
        info("The database exists check failed. Most often this means the integration "
             "has not been shared with the database: open the database in Notion -> '...' "
             "menu -> Connections -> add your integration. Also confirm NOTION_DATABASE_ID is correct.")
    elif code == APIErrorCode.RestrictedResource:
        info("The token lacks permission for this operation. Check the integration's "
             "capabilities (read content) in the Notion integration settings.")
    elif code == APIErrorCode.ValidationError:
        info("The request was malformed -- most likely NOTION_DATABASE_ID is not a valid "
             "Notion ID. Copy it again from the database URL.")


def main() -> int:
    token, database_id = load_config()
    try:
        return verify(token, database_id)
    except APIResponseError as e:
        section("Result")
        _explain_api_error(e)
        return 2
    except RequestTimeoutError as e:
        section("Result")
        fail(f"request timed out talking to the Notion API: {e}")
        info("Check network connectivity / proxy and retry.")
        return 2
    except Exception as e:  # noqa: BLE001 -- surface anything unexpected clearly
        section("Result")
        fail(f"unexpected error: {type(e).__name__}: {e}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
