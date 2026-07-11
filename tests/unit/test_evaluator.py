"""Offline unit tests for the Evaluator's deterministic tier logic (no API/SDK calls)."""

from ria import evaluator

_CONFIG = {
    "tier1_threshold": 0.90,
    "tier2_threshold": 0.75,
    "critical_risk_always_escalates": True,
    "enforcement_language_always_escalates": True,
}


def test_high_confidence_low_risk_is_tier1_auto_execute():
    tier, execute, escalate = evaluator.compute_tier(0.95, "low", False, _CONFIG)
    assert (tier, execute, escalate) == (1, True, False)


def test_high_confidence_medium_risk_is_tier1():
    tier, execute, escalate = evaluator.compute_tier(0.95, "medium", False, _CONFIG)
    assert (tier, execute, escalate) == (1, True, False)


def test_high_confidence_high_risk_is_tier2_human_review():
    tier, execute, escalate = evaluator.compute_tier(0.95, "high", False, _CONFIG)
    assert (tier, execute, escalate) == (2, False, False)


def test_moderate_confidence_is_tier2():
    tier, execute, escalate = evaluator.compute_tier(0.80, "low", False, _CONFIG)
    assert (tier, execute, escalate) == (2, False, False)


def test_critical_risk_always_escalates_even_at_high_confidence():
    tier, execute, escalate = evaluator.compute_tier(0.99, "critical", False, _CONFIG)
    assert (tier, execute, escalate) == (3, False, True)


def test_enforcement_detected_always_escalates_even_at_high_confidence():
    tier, execute, escalate = evaluator.compute_tier(0.99, "low", True, _CONFIG)
    assert (tier, execute, escalate) == (3, False, True)


def test_low_confidence_escalates_regardless_of_risk():
    tier, execute, escalate = evaluator.compute_tier(0.50, "low", False, _CONFIG)
    assert (tier, execute, escalate) == (3, False, True)


def test_missing_risk_level_escalates_rather_than_guessing():
    tier, execute, escalate = evaluator.compute_tier(0.99, None, False, _CONFIG)
    assert (tier, execute, escalate) == (3, False, True)


def test_tier1_boundary_is_inclusive():
    tier, execute, escalate = evaluator.compute_tier(0.90, "medium", False, _CONFIG)
    assert (tier, execute, escalate) == (1, True, False)


def test_tier2_boundary_is_inclusive_not_tier3():
    tier, execute, escalate = evaluator.compute_tier(0.75, "high", False, _CONFIG)
    assert (tier, execute, escalate) == (2, False, False)


def test_custom_thresholds_are_respected():
    config = {**_CONFIG, "tier1_threshold": 0.99}
    tier, execute, escalate = evaluator.compute_tier(0.95, "low", False, config)
    assert (tier, execute, escalate) == (2, False, False)


def test_critical_escalation_can_be_disabled_via_config():
    config = {**_CONFIG, "critical_risk_always_escalates": False}
    tier, execute, escalate = evaluator.compute_tier(0.95, "critical", False, config)
    assert (tier, execute, escalate) == (2, False, False)


def test_detect_enforcement_from_evaluator_flag():
    assert evaluator._detect_enforcement({}, ["possible enforcement exposure"]) is True


def test_detect_enforcement_from_materiality_reasoning():
    results = {"materiality": {"result": {"reasoning": "cites a civil monetary penalty provision"}}}
    assert evaluator._detect_enforcement(results, []) is True


def test_detect_enforcement_false_when_absent():
    results = {"materiality": {"result": {"reasoning": "routine administrative update"}}}
    assert evaluator._detect_enforcement(results, ["informational"]) is False


def test_detect_enforcement_handles_missing_materiality():
    assert evaluator._detect_enforcement({}, []) is False
