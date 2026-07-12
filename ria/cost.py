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


def estimate_cost(usage, model: str) -> float:
    """Estimate $ cost from a usage object. Accepts either an anthropic Usage object
    (input_tokens/output_tokens/cache_creation_input_tokens as attributes) or a plain
    dict with the same keys (the shape the Claude Agent SDK's ResultMessage.usage uses).
    Unpriced models return 0.0 rather than raising, so a missing price entry degrades
    the circuit breaker to a no-op for that call instead of crashing the run.
    """
    def get(key: str) -> int:
        if isinstance(usage, dict):
            return usage.get(key) or 0
        return getattr(usage, key, None) or 0

    price = price_for(model)
    if price is None:
        return 0.0
    input_tok = get("input_tokens") + get("cache_creation_input_tokens")
    output_tok = get("output_tokens")
    return (input_tok * price[0] + output_tok * price[1]) / 1_000_000
