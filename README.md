# Riptide RIA — Regulatory Intelligence Agent

A healthcare regulatory intelligence pipeline that ingests CMS/FDA filings from the Federal
Register, classifies and analyzes them with a chain of Claude-based agents, scores the result
against an autonomy framework, and produces a briefing (DOCX/PPTX) plus, where authorized, a
Notion remediation record and an escalation email. Built as a Riptide Consulting showcase of
the Claude Code Anthropic Framework (CCAF) — every governance/architecture surface (routing,
chaining, caching, batching, hooks, CI, skills, the Agent SDK, MCP) is a real, live-proven
mechanism in this repo, not a description of one.

## Pipeline

```
ingest (Federal Register) -> classify (Haiku) -> analyze (3 Sonnet specialists, chained
over one cached document) -> evaluate (Opus, Agent SDK, autonomy tier) -> synthesize
(Sonnet briefing + DOCX/PPTX, and where authorized: a Notion record and/or an escalation email)
```

Each stage is a separate, composable flag on `main.py` — see [Usage](#usage). Nothing past
`classify` runs unless you ask for it, and nothing writes anywhere external unless the
Evaluator's decision *and* an explicit operator approval both say so (see
[Governance](#governance)).

## Setup

1. **Python 3.11+**, then:
   ```
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt      # Windows
   ```
2. **Copy `.env.example` to `.env`** and fill in real values:
   - `ANTHROPIC_API_KEY` — required for everything past ingestion.
   - `NOTION_API_KEY` / `NOTION_DATABASE_ID` / `NOTION_DATA_SOURCE_ID` — a Notion integration
     shared with a database matching the schema in `mcp_servers/notion_tracker/verify_connection.py`
     (run that script to confirm the connection and print the schema it found).
   - `GOOGLE_CREDENTIALS_PATH` / `GMAIL_ESCALATION_ADDRESS` / `GMAIL_SENDER_ADDRESS` — only
     needed for Drive-backed specialist context and escalation emails (Phase 3). Setup is a
     one-time Google Cloud Console walkthrough — see `scratchpad/scratchpad.md` for the exact
     steps (Internal Workspace app, Desktop app client, `drive.readonly` + `gmail.send` scopes).
     The pipeline runs fine without this configured; specialists just report honestly that no
     internal policy documents were checked.
3. **Federal Register** needs no key (free, public API).

## Usage

```
python main.py                                       # ingest + classify, print a table
python main.py -p                                     # headless: JSONL to stdout (cron-friendly)
python main.py --limit 5                              # cap how many documents run
python main.py --batch                                # classify via the Anthropic Batches API
python main.py --analyze                              # + the 3 specialists (Sonnet -- costs more)
python main.py --evaluate                              # + the Evaluator (Opus; implies --analyze)
python main.py --synthesize                            # + briefing/DOCX/PPTX (implies --evaluate)
```

`--batch`, `--analyze`, `--evaluate`, and `--synthesize` all compose freely, e.g.:
```
python main.py --batch --analyze --evaluate --synthesize --limit 5
```

**Cost note:** each flag layers on real API cost (`--analyze` is up to 3 Sonnet calls/doc,
`--evaluate` is one Opus call/doc). Nothing past plain `classify` is free. Start with `--limit 1`
on anything new.

**For a quick demo**, double-click `run_demo.bat` (or run `run_demo.bat 5` to change the
document count from the default of 2) — it runs the full chain above with sensible,
cost-bounded defaults. No scheduling/automation exists deliberately: every run here is a
manual, human-initiated action, consistent with the governance model below.

**`--synthesize`'s Notion write and escalation email are separately gated**: they only fire
when the Evaluator's tier decision authorizes them (`execute`/`escalate`) *and*
`RIA_EVALUATOR_APPROVED=1` is set in the environment. Without that env var, `--synthesize`
still generates the briefing and DOCX/PPTX (that's a local file write, not an external side
effect) but prints exactly what it *would* have executed instead of doing it. This is the
project's core trust boundary — see [Governance](#governance).

## Governance

Root `CLAUDE.md` defines operator-level constraints (model routing, autonomy tiers, the
Evaluator-approval requirement) that agent-level instructions cannot override. These aren't
just prose:

- **`.claude/hooks/`** mechanically enforce them for anything running through Claude Code
  itself: `guard_side_effects.py` blocks git pushes and mutating tool calls without
  `RIA_EVALUATOR_APPROVED=1`; `guard_secrets.py` blocks writing real `.env` secret values
  anywhere else; `audit_log.py` logs every tool call.
- **The pipeline's own write functions** (`mcp_servers/notion_tracker/writer.py`,
  `mcp_servers/gmail/client.py`) check the *same* `RIA_EVALUATOR_APPROVED` env var themselves,
  at the point of the actual write/send — so the guarantee holds even when the pipeline runs
  outside Claude Code entirely (e.g. a cron job), not only when a hook happens to be watching.
- **`ria/evaluator.py`'s tier decision is computed in code**, not trusted from the model: Opus
  supplies judgment (quality scores, confidence, flags), and a pure function turns that into
  the tier — agents/evaluator/CLAUDE.md is explicit that this agent "cannot be bypassed under
  any circumstances," so the number that matters is never something the model gets to assert
  on its own.

## Project structure

```
main.py                    headless pipeline entrypoint (see Usage)
*_probe.py                 live proof scripts for each major mechanism (cache reuse, the
                            specialist chain, the Evaluator, MCP protocol, the execution gate,
                            Gmail sending) -- run any of these to see that piece work standalone
ria/                        core pipeline: settings, models, classifier, specialists, caching,
                            evaluator, synthesizer, logging
mcp_servers/                one subpackage per integration (federal_register, notion_tracker,
                            gmail, google_drive), each a plain client.py + a real FastMCP
                            server.py -- see .mcp.json for how they're registered
agents/<name>/CLAUDE.md     each agent's scoped role, model, output schema, and constraints
.claude/hooks/              governance enforcement (see Governance)
.claude/skills/             regulatory-report: human-invoked report generation (/regulatory-report)
config/                     pipeline_config.json (non-secret settings), logging.conf, branded templates
tests/unit/                 offline tests, no live API calls -- what CI runs
docs/ARCHITECTURE.md        distilled architecture decisions -- read this before scratchpad.md
scratchpad/scratchpad.md    running build log: decisions, what's proven live, what's still open
```

## Testing

```
pytest -q          # offline unit tests, no API calls -- what CI runs on every push
ruff check .        # lint
```

Live proofs (`*_probe.py` at the repo root, plus `main.py` itself) hit real APIs and cost real
money — they're not part of the test suite by design.

## What's real vs. not yet

Every phase below has been exercised against real APIs, not just unit-tested:

- Ingestion, classification (with real Batches API support), and prompt-cache reuse across
  the specialist chain.
- The Evaluator's Agent SDK integration, including its one live tool (Notion precedent lookup).
- The Notion write and Gmail escalation-email paths, both gated and both fired for real at
  least once.
- Google Drive search, wired into the specialists' shared context (currently reports
  "nothing found" honestly, since no real policy content has been staged in Drive yet).

Not yet done: a real Riptide-branded DOCX/PPTX template (falls back to a clean, generic
document); a naturally-occurring Tier-1 (auto-execute) result from a real document (only
proven via a clearly-labeled synthetic test so far); and Phase 6 (polish) is entirely unscoped.
