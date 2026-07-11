"""Offline unit tests for the specialists' pure logic (no API calls)."""

from ria import specialists


class _FakeLogger:
    def __init__(self):
        self.messages = []

    def info(self, msg):
        self.messages.append(msg)


def test_specialist_run_order_is_fixed():
    # Chaining CCAF surface depends on this order: materiality writes the cache,
    # process_impact and gap_analyzer read it.
    assert list(specialists._SPECIALISTS) == ["materiality", "process_impact", "gap_analyzer"]


def test_parse_json_plain():
    assert specialists._parse_json('{"a": 1}') == {"a": 1}


def test_parse_json_fenced():
    text = '```json\n{"a": 1}\n```'
    assert specialists._parse_json(text) == {"a": 1}


def test_parse_json_invalid_returns_none():
    assert specialists._parse_json("not json") is None


def test_materiality_forces_critical_above_80():
    result = specialists._postprocess_materiality(
        {"impact_score": 95, "risk_level": "medium"}, _FakeLogger(), "2026-00001"
    )
    assert result["risk_level"] == "critical"


def test_materiality_leaves_risk_level_alone_at_or_below_80():
    result = specialists._postprocess_materiality(
        {"impact_score": 80, "risk_level": "medium"}, _FakeLogger(), "2026-00001"
    )
    assert result["risk_level"] == "medium"


def test_materiality_clamps_score_range():
    result = specialists._postprocess_materiality(
        {"impact_score": 500, "risk_level": "low"}, _FakeLogger(), "2026-00001"
    )
    assert result["impact_score"] == 100
    assert result["risk_level"] == "critical"


def test_process_impact_truncates_to_ten():
    processes = [{"process_name": f"p{i}"} for i in range(15)]
    result = specialists._postprocess_process_impact(
        {"affected_processes": processes}, _FakeLogger(), "2026-00001"
    )
    assert len(result["affected_processes"]) == 10


def test_process_impact_leaves_short_list_alone():
    processes = [{"process_name": "p1"}, {"process_name": "p2"}]
    result = specialists._postprocess_process_impact(
        {"affected_processes": processes}, _FakeLogger(), "2026-00001"
    )
    assert len(result["affected_processes"]) == 2


def test_gap_analyzer_derives_totals_from_list():
    gaps = [
        {"gap_type": "policy", "description": "x", "severity": "critical", "remediation_action": "fix it"},
        {"gap_type": "control", "description": "y", "severity": "medium", "remediation_action": "fix it too"},
    ]
    result = specialists._postprocess_gap_analyzer(
        {"gaps": gaps, "total_gaps": 999, "critical_gaps": 999}, _FakeLogger(), "2026-00001"
    )
    assert result["total_gaps"] == 2
    assert result["critical_gaps"] == 1


def test_gap_analyzer_fills_missing_remediation_for_critical():
    gaps = [{"gap_type": "policy", "description": "x", "severity": "critical", "remediation_action": ""}]
    result = specialists._postprocess_gap_analyzer({"gaps": gaps}, _FakeLogger(), "2026-00001")
    assert result["gaps"][0]["remediation_action"]


def test_gap_analyzer_escalates_phi_low_severity():
    gaps = [{"gap_type": "control", "description": "missing PHI access log", "severity": "low",
              "remediation_action": "add logging"}]
    result = specialists._postprocess_gap_analyzer({"gaps": gaps}, _FakeLogger(), "2026-00001")
    assert result["gaps"][0]["severity"] == "high"


def test_gap_analyzer_leaves_unrelated_low_severity_alone():
    gaps = [{"gap_type": "documentation", "description": "outdated formatting guide", "severity": "low",
              "remediation_action": "update doc"}]
    result = specialists._postprocess_gap_analyzer({"gaps": gaps}, _FakeLogger(), "2026-00001")
    assert result["gaps"][0]["severity"] == "low"
