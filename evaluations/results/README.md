# Eval results (committed evidence)

Every `pytest evaluations` run writes a dated JSON file here: test-by-test outcomes,
the per-call cost breakdown from `conftest.py`, and the repeat setting used. Commit the
file after a green run.

Why commit it: the live eval suite costs real money and needs real keys, so most people
reading this repo will never run it. A committed, dated results file is the difference
between "the README claims the injection evals pass" and "here is the run, the rate, and
what it cost." Latest file wins; keep a handful of history, prune the rest.

Nothing in these files is secret: test names, pass/fail, token counts, and dollar
estimates only.
