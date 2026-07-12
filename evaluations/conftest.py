"""Session-wide cost tracking for the live eval suite.

Every test in evaluations/ makes a real, billed API call -- this prints token usage and an
estimated dollar cost at the end of the run (`pytest_terminal_summary` fires regardless of
-q), so the cost is visible right in the CI log instead of requiring a separate trip to the
Anthropic console.
"""

# $ per 1M (input, output) tokens. Matched by prefix so a dated snapshot id (e.g.
# claude-haiku-4-5-20251001) still resolves. Sonnet 5 is intro pricing, active through
# 2026-08-31 -- after that it reverts to $3/$15 and this estimate will run a bit low.
_PRICING = {
    "claude-haiku-4-5": (1.00, 5.00),
    "claude-sonnet-5": (2.00, 10.00),
}

_calls: list[tuple[str, str, object]] = []


def _price_for(model: str) -> tuple[float, float] | None:
    for prefix, price in _PRICING.items():
        if model.startswith(prefix):
            return price
    return None


def record_usage(label: str, model: str, usage) -> None:
    """Called by eval tests after a live API call to log it for the end-of-run cost summary."""
    _calls.append((label, model, usage))


def pytest_terminal_summary(terminalreporter):
    if not _calls:
        return
    terminalreporter.write_sep("-", "Riptide RIA eval suite: real API cost")
    total = 0.0
    for label, model, usage in _calls:
        input_tok = usage.input_tokens + usage.cache_creation_input_tokens
        output_tok = usage.output_tokens
        price = _price_for(model)
        if price is None:
            terminalreporter.write_line(f"  {label}: {model} -- unknown pricing, {input_tok} in / {output_tok} out")
            continue
        cost = (input_tok * price[0] + output_tok * price[1]) / 1_000_000
        total += cost
        terminalreporter.write_line(f"  {label}: {model} -- {input_tok} in / {output_tok} out -- ${cost:.4f}")
    terminalreporter.write_line(f"  TOTAL (estimated): ${total:.4f}")
