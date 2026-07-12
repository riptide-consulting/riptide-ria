"""Session-wide cost tracking for the live eval suite.

Every test in evaluations/ makes a real, billed API call -- this prints token usage and an
estimated dollar cost at the end of the run (`pytest_terminal_summary` fires regardless of
-q), so the cost is visible right in the CI log instead of requiring a separate trip to the
Anthropic console. Pricing itself lives in ria/cost.py, shared with main.py's spend circuit
breaker so there's one place to update when prices change.
"""

from ria.cost import estimate_cost, usage_tokens

_calls: list[tuple[str, str, object]] = []


def record_usage(label: str, model: str, usage) -> None:
    """Called by eval tests after a live API call to log it for the end-of-run cost summary."""
    _calls.append((label, model, usage))


def pytest_terminal_summary(terminalreporter):
    if not _calls:
        return
    terminalreporter.write_sep("-", "Riptide RIA eval suite: real API cost")
    total = 0.0
    for label, model, usage in _calls:
        cost = estimate_cost(usage, model)
        total += cost
        input_tok, output_tok = usage_tokens(usage)
        terminalreporter.write_line(f"  {label}: {model} -- {input_tok} in / {output_tok} out -- ${cost:.4f}")
    terminalreporter.write_line(f"  TOTAL (estimated): ${total:.4f}")
