# Riptide RIA — Operator Runbook

For whoever is about to *run* this (a demo, a new engagement), not extend the code. If
you're modifying the pipeline itself, read `docs/ARCHITECTURE.md` and the README instead.
This is written to be followed start to finish, in order, the first time and every time after.

## 0. First time on this machine? Set up once.

Skip to section 1 if this machine already has a working `.venv` and a filled-in `.env`.

1. **Python 3.11+**, then from the repo root:
   ```
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```
2. **Copy `.env.example` to `.env`**, fill in `ANTHROPIC_API_KEY` / `NOTION_API_KEY` /
   `NOTION_DATABASE_ID` at minimum. Google credentials (Drive/Gmail) are optional — the
   pipeline runs fine without them, specialists just honestly report Drive wasn't checked.
3. **Google OAuth, only if you want Drive/Gmail**: one-time interactive consent per scope
   (Drive read, Gmail send) — running the pipeline the first time with those configured will
   open a browser and walk you through it. `docs/ARCHITECTURE.md` has the scope details if
   something goes wrong.

This is genuinely one-time per machine. Once `.venv` exists and `.env` is filled in, every
future run starts at section 1 below.

## 1. Before every run: a 2-minute pre-flight check

1. **Credentials present?** `.env` needs `ANTHROPIC_API_KEY`, `NOTION_API_KEY`,
   `NOTION_DATABASE_ID` at minimum. Confirm with:
   ```
   .venv\Scripts\python.exe -c "from ria.settings import get_settings; get_settings(); print('settings OK')"
   ```
   This fails loudly and names the missing variable if anything required is absent.
2. **Notion connection actually works?** Run `mcp_servers/notion_tracker/verify_connection.py`
   — confirms the API key and database ID are valid and prints the schema it found, rather
   than discovering a bad key mid-run.
3. **Google OAuth tokens (if using Drive/Gmail) not expired?** The two token files under
   `config/` are separate tokens with separate scopes (see `docs/ARCHITECTURE.md`). If either
   is missing or a run fails with an auth error, the fix is re-running the flow that touches
   that scope once — it'll open a browser for consent.
4. **Know your spend ceiling.** `config/pipeline_config.json`'s `pipeline.max_spend_usd`
   (default $10) is a hard stop for the run, not per-document. Raise it deliberately if you
   know a run needs to cost more than that; don't discover it mid-demo.
5. **`RIA_EVALUATOR_APPROVED` should be unset**, unless you specifically intend this run to
   write to Notion or send a real email. Unset (the default) still generates the full briefing
   and DOCX/PPTX — it just prints what it *would* have sent instead of sending it. See
   `docs/ARCHITECTURE.md`'s Governance section before ever setting this to `1`.

## 2. Run it

```
run_demo.bat            # 2 documents, full pipeline, sensible defaults
run_demo.bat 5           # 5 documents instead
```

Or directly:
```
.venv\Scripts\python.exe main.py --analyze --evaluate --synthesize --limit 1
```
Start with `--limit 1` for anything you haven't personally watched succeed recently. A full
run takes about 4-5 minutes and costs about $0.59 (real, measured — see
`docs/COST-BREAKDOWN.md` for the per-stage numbers).

## 3. What you'll have when it finishes

- A printed summary table: what got classified, at what priority, routed to which specialists.
- A real branded briefing, two forms, same content: `outputs\docx\<document-number>.docx` and
  `outputs\pptx\<document-number>.pptx` — executive summary, materiality, a due-dated
  remediation plan, and the "AI-assisted, human review required" disclaimer on both.
- A tier decision (1/2/3) and, only if the Evaluator's decision authorized it *and*
  `RIA_EVALUATOR_APPROVED=1` was set: a Notion tracker record and/or an escalation email.
  Neither fires by default — see pre-flight step 5.
- `logs/ria.log` now has the full run recorded, one line per decision — see section 4 below.

That's the finish line. If you got a populated docx/pptx and a tier decision, it worked.

## 4. What to configure for a different demo scenario or a new engagement

| What | Where | Notes |
|---|---|---|
| Which agencies/regulations to monitor | `config/pipeline_config.json` → `federal_register.agencies` | Currently CMS + FDA. Federal Register's agency slugs — check their API docs for others. |
| Model routing | `.env` → `MODEL_CLASSIFIER`/`MODEL_SPECIALIST`/`MODEL_EVALUATOR`/`MODEL_SYNTHESIZER` | Operator policy per root `CLAUDE.md` — changing these is a deliberate decision, not a tuning knob. |
| Autonomy thresholds | `config/pipeline_config.json` → `autonomy` | `tier1_threshold`/`tier2_threshold` control how confident the Evaluator must be before auto-execute/human-review vs. escalate. |
| Spend ceiling | `config/pipeline_config.json` → `pipeline.max_spend_usd` | See pre-flight step 4. |
| Branded output templates | `config/riptide_template.docx` / `.pptx` | Currently Riptide's own branding. A white-labeled deliverable for a specific client would need separate template files and a way to select between them — not built yet, since this demo only needs Riptide's own brand. |
| Internal policy documents (Drive gap-analysis context) | Whatever's in the Drive account behind the configured Drive token | See `docs/ARCHITECTURE.md`'s single-tenant note — this is one shared Drive today, not scoped per client. |

## 5. If something fails mid-run

As of the failure-hardening pass: one document failing doesn't crash the batch (it's logged
with the error type/message and the run continues), and one specialist failing doesn't block
the other two for the same document. Check `logs/ria.log` for the specific
`agent=... action=... outcome=error` line — it names exactly what failed and why. A failed
document shows up in its own "Failed" section in the printed summary table, not silently
missing from it.

## 6. What NOT to do

- Don't set `RIA_EVALUATOR_APPROVED=1` to "see what happens" — it authorizes real Notion
  writes and real emails. Only set it when you specifically mean to.
- Don't raise `max_spend_usd` casually mid-demo to push past a stop — if the breaker tripped,
  understand why before deciding to spend more.
- Don't commit any of the local credential/token files under `config/`, or `.env` itself —
  all gitignored on purpose; the project's own secrets-guard hook will also block writing a
  real secret value anywhere else if you're working through Claude Code.
