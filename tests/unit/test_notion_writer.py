"""Offline unit tests for mcp_servers/notion_tracker/writer.py's pure logic (no API calls).

Approval-gating is tested directly against os.environ (monkeypatch) rather than mocking
Notion, since _require_approval's whole job is to run before any network call happens.
"""

from datetime import date

import pytest

from mcp_servers.notion_tracker import writer
from ria.models import RegulatoryDocument


def _doc(**overrides):
    base = dict(
        document_number="2026-00001",
        title="Test Rule",
        document_type="Rule",
        agencies=["Food and Drug Administration"],
        publication_date=date(2026, 7, 1),
        html_url="https://example.gov/doc",
    )
    base.update(overrides)
    return RegulatoryDocument(**base)


def _specialist_results(**overrides):
    base = {
        "materiality": {"result": {"risk_level": "high", "impact_score": 75, "compliance_deadline": "2026-09-01"}},
        "gap_analyzer": {"result": {"gaps": [
            {"remediation_action": "File the required form."},
            {"remediation_action": "Update the policy manual."},
        ]}},
        "process_impact": {"result": {"affected_processes": [
            {"owner_suggested": "Compliance Team"},
            {"owner_suggested": "Legal"},
        ]}},
    }
    base.update(overrides)
    return base


def test_require_approval_blocks_when_unset(monkeypatch):
    monkeypatch.delenv("RIA_EVALUATOR_APPROVED", raising=False)
    with pytest.raises(PermissionError, match="RIA_EVALUATOR_APPROVED"):
        writer._require_approval()


def test_require_approval_blocks_on_falsy_value(monkeypatch):
    monkeypatch.setenv("RIA_EVALUATOR_APPROVED", "0")
    with pytest.raises(PermissionError):
        writer._require_approval()


def test_require_approval_passes_when_set(monkeypatch):
    monkeypatch.setenv("RIA_EVALUATOR_APPROVED", "1")
    writer._require_approval()  # should not raise


def test_build_properties_maps_title_and_agency():
    props = writer._build_properties(_doc(), {"execute": True, "escalate": False}, _specialist_results())
    assert props["Regulation Name"]["title"][0]["text"]["content"] == "Test Rule"
    assert props["Agency"]["select"]["name"] == "Food and Drug Administration"


def test_build_properties_capitalizes_risk_level_for_select():
    props = writer._build_properties(_doc(), {}, _specialist_results())
    assert props["Risk Level"]["select"]["name"] == "High"


def test_build_properties_sets_status_not_started():
    props = writer._build_properties(_doc(), {}, _specialist_results())
    assert props["Status"]["status"]["name"] == "Not started"


def test_build_properties_reflects_execute_and_escalate_flags():
    props = writer._build_properties(_doc(), {"execute": True, "escalate": True}, _specialist_results())
    assert props["Auto Executed"]["checkbox"] is True
    assert props["Escalated"]["checkbox"] is True
    assert props["Created By Agent"]["checkbox"] is True


def test_build_properties_joins_remediation_actions():
    props = writer._build_properties(_doc(), {}, _specialist_results())
    text = props["Remediation Actions"]["rich_text"][0]["text"]["content"]
    assert "File the required form." in text
    assert "Update the policy manual." in text


def test_build_properties_defaults_remediation_when_no_gaps():
    results = _specialist_results(gap_analyzer={"result": {"gaps": []}})
    props = writer._build_properties(_doc(), {}, results)
    assert "No specific remediation actions" in props["Remediation Actions"]["rich_text"][0]["text"]["content"]


def test_build_properties_defaults_owner_when_unassigned():
    results = _specialist_results(process_impact={"result": {"affected_processes": []}})
    props = writer._build_properties(_doc(), {}, results)
    assert props["Owner"]["rich_text"][0]["text"]["content"] == "Unassigned"


def test_build_properties_includes_due_date_when_present():
    props = writer._build_properties(_doc(), {}, _specialist_results())
    assert props["Due Date"]["date"]["start"] == "2026-09-01"


def test_build_properties_omits_due_date_when_absent():
    results = _specialist_results(materiality={"result": {"risk_level": "low", "impact_score": 10,
                                                            "compliance_deadline": None}})
    props = writer._build_properties(_doc(), {}, results)
    assert "Due Date" not in props
