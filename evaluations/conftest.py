"""Session-wide cost tracking + committed results for the live eval suite.

Every test in evaluations/ makes a real, billed API call -- this prints token usage and an
estimated dollar cost at the end of the run (`pytest_terminal_summary` fires regardless of
-q), so the cost is visible right in the CI log instead of requiring a separate trip to the
Anthropic console. Pricing itself lives in ria/cost.py, shared with main.py's spend circuit
breaker so there's one place to update when prices change.

It also writes a dated results file to evaluations/results/ after every run: test-by-test
outcomes, the per-call cost breakdown, and the repeat setting. Committing that file after a
green run means a reviewer sees eval EVIDENCE in the repo -- dates, rates, dollar cost --
without needing keys or spend of their own. See evaluations/results/README.md.
"""

import datetime
import json
import os
from pathlib import Path

from ria.cost import estimate_cost, usage_tokens

_calls: list[tuple[str, str, object]] = []
_outcomes: list[dict] = []
_RESULTS_DIR = Path(__file__).resolve().parent / "results"


def record_usage(label: str, model: str, usage) -> None:
    """Called by eval tests after a live API call to log it for the end-of-run cost summary."""
    _calls.append((label, model, usage))


def pytest_runtest_logreport(report):
    """Collect eval-test outcomes for the committed results file (call phase only)."""
    if report.when == "call" and "evaluations/" in report.nodeid.replace("\\", "/"):
        _outcomes.append({
            "test": report.nodeid,
            "outcome": report.outcome,
            "duration_seconds": round(report.duration, 2),
        })


def pytest_terminal_summary(terminalreporter):
    if not _calls and not _outcomes:
        return
    terminalreporter.write_sep("-", "Riptide RIA eval suite: real API cost")
    total = 0.0
    call_records = []
    for label, model, usage in _calls:
        cost = estimate_cost(usage, model)
        total += cost
        input_tok, output_tok = usage_tokens(usage)
        call_records.append({"label": label, "model": model, "input_tokens": input_tok,
                             "output_tokens": output_tok, "cost_usd": round(cost, 4)})
        terminalreporter.write_line(f"  {label}: {model} -- {input_tok} in / {output_tok} out -- ${cost:.4f}")
    terminalreporter.write_line(f"  TOTAL (estimated): ${total:.4f}")

    # Committed evidence: never let this writer fail a run.
    try:
        _RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        stamp = datetime.datetime.now().strftime("%Y-%m-%d-%H%M")
        results = {
            "run_at": datetime.datetime.now().isoformat(timespec="seconds"),
            "repeats_per_case": int(os.getenv("RIA_EVAL_REPEATS", "3")),
            "tests": _outcomes,
            "passed": sum(1 for o in _outcomes if o["outcome"] == "passed"),
            "failed": sum(1 for o in _outcomes if o["outcome"] == "failed"),
            "api_calls": call_records,
            "estimated_total_cost_usd": round(total, 4),
        }
        out = _RESULTS_DIR / f"{stamp}-eval-results.json"
        out.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
        terminalreporter.write_line(f"  results written: {out} (commit it as evidence)")
    except Exception as exc:  # noqa: BLE001 -- evidence is a bonus, never a blocker
        terminalreporter.write_line(f"  (results file not written: {exc})")
