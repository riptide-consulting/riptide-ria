"""Notion remediation-tracker WRITES (Phase 4: the execution gate).

Kept in its own file, separate from client.py's read-only queries, so the safety property
is visible at a glance: anything with a real external side effect lives here, and every
function in this file checks approval before touching the network.

Root CLAUDE.md: "Never execute any action with external side effects without Evaluator
approval." The Evaluator's own execute=True decision is that approval at the PIPELINE level
-- but during development, a human (not just the pipeline's own judgment) needs to sign off
before code in this file actually runs, for the same reason .claude/hooks/guard_side_effects.py
gates Claude Code's own tool calls: a mistake while testing shouldn't be able to write real
data. RIA_EVALUATOR_APPROVED is the SAME env var and the SAME governance concept applied at
two different points -- the hook gates Claude Code's tool calls, ``_require_approval`` below
gates this code's own writes, regardless of what process ends up calling it.
"""

from __future__ import annotations

import os

from notion_client import Client

from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings

# The tracker's Agency select field originally only had SEC/FINRA/State/Other -- a leftover
# from a different Riptide template, never customized for this healthcare project.
_HEALTHCARE_AGENCIES = ["Centers for Medicare & Medicaid Services", "Food and Drug Administration"]


def _require_approval() -> None:
    if os.environ.get("RIA_EVALUATOR_APPROVED", "").strip().lower() not in ("1", "true"):
        raise PermissionError(
            "RIA_EVALUATOR_APPROVED is not set -- refusing to write to Notion. "
            "Set RIA_EVALUATOR_APPROVED=1 to explicitly approve this external side effect."
        )


def ensure_agency_options(settings: Settings | None = None) -> list[str]:
    """One-time schema fix: add the healthcare agency names to the Agency select field.
    Idempotent -- only adds names that aren't already present. Returns the names actually
    added (empty list if nothing needed to change)."""
    _require_approval()
    settings = settings or get_settings()
    client = Client(auth=settings.notion_api_key)
    source = client.data_sources.retrieve(data_source_id=settings.notion_data_source_id)
    existing = [o["name"] for o in source["properties"]["Agency"]["select"]["options"]]
    missing = [name for name in _HEALTHCARE_AGENCIES if name not in existing]
    if not missing:
        return []
    client.data_sources.update(
        data_source_id=settings.notion_data_source_id,
        properties={"Agency": {"select": {"options": [{"name": n} for n in existing + missing]}}},
    )
    return missing


def _build_properties(doc: RegulatoryDocument, decision: dict, specialist_results: dict) -> dict:
    """Map pipeline output onto the tracker's exact Notion property types (verified live
    against the data source schema: Agency/Risk Level=select, Status=status, Impact
    Score=number, Owner/Remediation Actions=rich_text, Due Date=date, Source URL=url,
    Escalated/Auto Executed/Created By Agent=checkbox, Regulation Name=title). Pure/testable
    -- does no I/O itself."""
    materiality = (specialist_results.get("materiality") or {}).get("result", {})
    gap_analyzer = (specialist_results.get("gap_analyzer") or {}).get("result", {})
    process_impact = (specialist_results.get("process_impact") or {}).get("result", {})

    remediation_summary = "; ".join(
        g.get("remediation_action", "") for g in (gap_analyzer.get("gaps") or [])[:5]
    ) or "No specific remediation actions identified."
    owners = {
        p.get("owner_suggested", "") for p in (process_impact.get("affected_processes") or [])[:3]
        if p.get("owner_suggested")
    }
    owner = "; ".join(sorted(owners)) or "Unassigned"

    properties = {
        "Regulation Name": {"title": [{"type": "text", "text": {"content": doc.title[:2000]}}]},
        "Agency": {"select": {"name": doc.primary_agency}},
        "Risk Level": {"select": {"name": (materiality.get("risk_level") or "medium").capitalize()}},
        "Impact Score": {"number": materiality.get("impact_score", 0)},
        "Status": {"status": {"name": "Not started"}},
        "Owner": {"rich_text": [{"type": "text", "text": {"content": owner[:2000]}}]},
        "Source URL": {"url": doc.html_url},
        "Remediation Actions": {"rich_text": [{"type": "text", "text": {"content": remediation_summary[:2000]}}]},
        "Escalated": {"checkbox": bool(decision.get("escalate", False))},
        "Auto Executed": {"checkbox": bool(decision.get("execute", False))},
        "Created By Agent": {"checkbox": True},
    }
    deadline = materiality.get("compliance_deadline")
    if deadline:
        properties["Due Date"] = {"date": {"start": deadline}}
    return properties


def create_remediation_record(
    doc: RegulatoryDocument,
    decision: dict,
    specialist_results: dict,
    settings: Settings | None = None,
) -> str:
    """Write one row to the RIA Remediation Tracker. REAL external side effect -- requires
    RIA_EVALUATOR_APPROVED=1 (see module docstring). Returns the created page's id.

    Callers are expected to only call this for documents the Evaluator scored execute=True;
    this function doesn't re-check that itself -- the caller's tier decision and this
    function's approval gate are two independent checks, not one standing in for the other.
    """
    _require_approval()
    settings = settings or get_settings()
    client = Client(auth=settings.notion_api_key)
    page = client.pages.create(
        parent={"type": "data_source_id", "data_source_id": settings.notion_data_source_id},
        properties=_build_properties(doc, decision, specialist_results),
    )
    return page["id"]
