"""Offline unit tests for ria/cost.py (pure math, no API calls)."""

from ria.cost import estimate_cost, price_for, usage_tokens


class _Usage:
    """Attribute-shaped usage, like the anthropic SDK's Usage object."""

    def __init__(self, **kw):
        self.input_tokens = kw.get("input_tokens", 0)
        self.output_tokens = kw.get("output_tokens", 0)
        self.cache_creation_input_tokens = kw.get("cache_creation_input_tokens", 0)
        self.cache_read_input_tokens = kw.get("cache_read_input_tokens", 0)


def test_price_for_matches_dated_snapshot_by_prefix():
    assert price_for("claude-haiku-4-5-20251001") == (1.00, 5.00)


def test_estimate_cost_unknown_model_degrades_to_zero_not_crash():
    assert estimate_cost(_Usage(input_tokens=1_000_000), "some-future-model") == 0.0


def test_estimate_cost_prices_cache_write_premium_and_read_discount():
    # sonnet-5 intro pricing: $2 input / $10 output per MTok.
    # 1M plain input ($2) + 1M cache write at 1.25x ($2.50) + 1M cache read at 0.1x ($0.20)
    # + 1M output ($10) = $14.70.
    usage = _Usage(
        input_tokens=1_000_000,
        cache_creation_input_tokens=1_000_000,
        cache_read_input_tokens=1_000_000,
        output_tokens=1_000_000,
    )
    assert abs(estimate_cost(usage, "claude-sonnet-5") - 14.70) < 1e-9


def test_estimate_cost_accepts_dict_shaped_usage():
    # The Claude Agent SDK's ResultMessage.usage is a plain dict; evaluate() returns that.
    usage = {"input_tokens": 500_000, "output_tokens": 100_000, "cache_read_input_tokens": 1_000_000}
    expected = (500_000 * 5.00 + 1_000_000 * 5.00 * 0.10 + 100_000 * 25.00) / 1_000_000
    assert abs(estimate_cost(usage, "claude-opus-4-8") - expected) < 1e-9


def test_usage_tokens_counts_input_plus_cache_writes():
    assert usage_tokens(_Usage(input_tokens=100, cache_creation_input_tokens=50, output_tokens=7)) == (150, 7)
