---
name: regulatory-report
description: Generate a readable regulatory intelligence report for recent CMS/FDA documents by running the Riptide RIA pipeline (classifier + specialists) and formatting the output as markdown. Use when the user asks for a regulatory report, wants to review recent CMS/FDA filings, or asks what the pipeline found this week.
---

# Regulatory Report

Runs the Riptide RIA pipeline and turns its structured JSON output into a readable
markdown report for a human to review. This is a session-level tool for Andrew (the
operator) to use on demand -- distinct from the Phase 5 Synthesizer, which will generate
DOCX/PPTX automatically as part of the unattended pipeline.

No new code is needed for this: the pipeline already emits complete structured JSON via
`main.py -p`. Your job when this skill runs is to execute it and render the report
yourself, directly -- do not write a Python templating script for this.

## Steps

1. **Determine scope.** If the skill args contain a positive integer, use it as the
   document limit. Otherwise default to **3**. Keep this modest by default: each document
   costs one Haiku classify call plus up to three Sonnet specialist calls (plus one Opus
   Evaluator call if `--evaluate` is used), so a large limit is real spend, not a free
   preview. Only add `--evaluate` if the args explicitly ask for tier/escalation decisions,
   not by default -- it's the most expensive step (Opus, Agent SDK, a Notion lookup call).

2. **Run the pipeline** from the repo root using the project's virtualenv interpreter:
   ```
   .venv/Scripts/python.exe main.py -p --analyze --limit <N>
   .venv/Scripts/python.exe main.py -p --analyze --evaluate --limit <N>   # if tier decisions were requested
   ```
   This is read-only against the Federal Register API and calls the Anthropic API to
   analyze -- it has no external side effects (no writes to Notion/Drive/git), so it does
   not require Evaluator approval. Output is one JSON object per line (see
   `main.py`/`ria/specialists.py`/`ria/evaluator.py` for the exact shape: classifier fields
   plus an optional `specialists` dict keyed by `materiality` / `process_impact` /
   `gap_analyzer`, plus an optional `evaluation` dict when `--evaluate` was used).

3. **Render one markdown section per document**, in the order the pipeline returned them:
   - Header: document number, title, agency, publication date, source URL.
   - Classifier line: priority and confidence.
   - If `specialists.materiality` is present: impact score /100, risk level, affected
     operations, compliance deadline (or "none stated"), reasoning.
   - If `specialists.process_impact` is present: a table of affected processes (process
     name, current state, required change, effort estimate, suggested owner).
   - If `specialists.gap_analyzer` is present: total gaps and critical-gap count, then a
     table of gaps (type, description, severity, remediation action, estimated days).
   - If a document has no `specialists` key at all (classifier routed to nothing), say so
     in one line instead of leaving a blank section -- never let an empty result look like
     a missing one.
   - If `evaluation` is present: autonomy tier, execute/escalate booleans, overall
     confidence, enforcement_detected, flags, and human_review_notes. State plainly that
     `execute=True` is a recommendation only -- no auto-write capability exists yet, so
     nothing was actually done about this document.

4. **Never include full document body text** in the report -- only the structured
   summaries and reasoning the specialists already produced (root CLAUDE.md: summaries
   only, never full regulatory text logged/output verbatim).

5. **Add a run-summary footer**: model routing actually used (read `MODEL_CLASSIFIER` /
   `MODEL_SPECIALIST` from `.env`, plus `MODEL_EVALUATOR` if `--evaluate` ran -- do not
   hardcode model names in the report), and total prompt-cache tokens written/read summed
   across the JSON lines (`cache_write` / `cache_read` fields) -- a quick, honest signal of
   how much the run actually cost versus reused.

6. **Save the report** to `outputs/reports/<YYYY-MM-DD>-regulatory-report.md` (create the
   directory if it doesn't exist; use the date from the run, not a placeholder), then print
   a concise version to the terminal so the user doesn't have to open the file to see the
   headline results.

## Example section

```markdown
## 2026-14073 -- Drug Establishment Registration and Drug Listing Requirements
**Agency:** Food and Drug Administration | **Type:** Rule | **Published:** 2026-07-08
**Classifier:** priority=high, confidence=0.92 | **Source:** https://www.federalregister.gov/documents/...

### Materiality
- Impact score: 42/100 -- Risk: medium
- Affected operations: establishment registration, drug listing submissions
- Compliance deadline: none stated
- Reasoning: ...

### Process Impact
| Process | Current State | Required Change | Effort | Owner |
|---|---|---|---|---|
| ... | ... | ... | medium | ... |

### Gap Analysis
Total gaps: 9 (2 critical)
| Type | Description | Severity | Remediation | Est. Days |
|---|---|---|---|---|
| ... | ... | critical | ... | ... |
```
