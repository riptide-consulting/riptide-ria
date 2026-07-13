"""Shared pricing/cost estimation.

Single source of pricing data for both main.py's spend circuit breaker and
evaluations/conftest.py's eval-suite cost summary, so a price change or new model
only needs updating in one place.
"""

from __future__ import annotations

# $ per 1M (input, output) tokens. Matched by prefix so a dated snapshot id (e.g.
# claude-haiku-4-5-20251001) still resolves. Sonnet 5 is intro pricing, active through
# 2026-08-31 -- after that it reverts to $3/$15 and this estimate will run a bit low.
PRICING: dict[str, tuple[float, float]] = {
    "claude-haiku-4-5": (1.00, 5.00),
    "claude-sonnet-5": (2.00, 10.00),
    "claude-opus-4-8": (5.00, 25.00),
}


def price_for(model: str) -> tuple[float, float] | None:
    for prefix, price in PRICING.items():
        if model.startswith(prefix):
            return price
    return None


def usage_tokens(usage) -> tuple[int, int]:
    """(input_tokens + cache_creation_input_tokens, output_tokens) from a usage object.
    Accepts either an anthropic Usage object (attributes) or a plain dict with the same
    keys (the shape the Claude Agent SDK's ResultMessage.usage uses) -- classify()/
    run_specialist() return the former, evaluate() the latter, and callers that display or
    price a usage value regardless of which stage produced it need both to work.
    """
    def get(key: str) -> int:
        if isinstance(usage, dict):
            return usage.get(key) or 0
        return getattr(usage, key, None) or 0

    return get("input_tokens") + get("cache_creation_input_tokens"), get("output_tokens")


# Prompt-cache billing multipliers relative to base input price (this pipeline uses the
# default 5-minute TTL everywhere; 1-hour cache writes bill at 2.0x and would need their
# own entry here if ever adopted).
_CACHE_WRITE_MULTIPLIER = 1.25
_CACHE_READ_MULTIPLIER = 0.10


def estimate_cost(usage, model: str) -> float:
    """Estimate $ cost from a usage object (see usage_tokens for the accepted shapes).
    Unpriced models return 0.0 rather than raising, so a missing price entry degrades
    the circuit breaker to a no-op for that call instead of crashing the run.

    Cache-aware: cache writes bill at 1.25x base input and cache reads at 0.1x. The
    previous version priced writes at 1.0x and reads at 0.0x, so estimates ran low in
    both directions -- small per call, but the circuit breaker deserves real numbers.
    """
    price = price_for(model)
    if price is None:
        return 0.0

    def get(key: str) -> int:
        if isinstance(usage, dict):
            return usage.get(key) or 0
        return getattr(usage, key, None) or 0

    input_price, output_price = price
    dollars = (
        get("input_tokens") * input_price
        + get("cache_creation_input_tokens") * input_price * _CACHE_WRITE_MULTIPLIER
        + get("cache_read_input_tokens") * input_price * _CACHE_READ_MULTIPLIER
        + get("output_tokens") * output_price
    )
    return dollars / 1_000_000
