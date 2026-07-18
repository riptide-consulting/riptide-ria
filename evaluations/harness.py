"""Pass-rate harness for the live eval suite.

Model output is stochastic, so a single-shot assertion proves little and flakes: one lucky
sample passes a broken prompt, one unlucky sample fails a good one. Every quick eval runs
its case ``repeats`` times and asserts at least ``required`` passes, which turns "it worked
once" into a measured rate.

Cost control: repeats defaults to 3 (override with the RIA_EVAL_REPEATS environment
variable; set it to 1 to reproduce the old single-shot behavior). Expensive cases -- the
Opus-backed Evaluator evals -- pass repeats=1 explicitly and say why at the call site.
"""

from __future__ import annotations

import math
import os
from collections.abc import Callable


def default_repeats() -> int:
    return max(1, int(os.getenv("RIA_EVAL_REPEATS", "3")))


def assert_pass_rate(
    case: Callable[[], None],
    label: str,
    repeats: int | None = None,
    required: int | None = None,
) -> None:
    """Run ``case`` (a callable that raises AssertionError on failure) ``repeats`` times
    and require at least ``required`` passes (default: two-thirds, rounded up).

    Failures are collected, not raised immediately, so the final assertion message shows
    the full picture: how many attempts passed and what the failing ones said.
    """
    repeats = repeats or default_repeats()
    required = required if required is not None else max(1, math.ceil(repeats * 2 / 3))

    failures: list[str] = []
    passes = 0
    for attempt in range(1, repeats + 1):
        try:
            case()
            passes += 1
        except AssertionError as exc:
            failures.append(f"attempt {attempt}: {exc}")

    assert passes >= required, (
        f"{label}: {passes}/{repeats} passed, needed {required}.\n" + "\n".join(failures)
    )
