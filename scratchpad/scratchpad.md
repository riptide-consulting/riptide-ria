# RIA Project Scratchpad
# Riptide Consulting - CCAF Showcase Build
# Started: 2026-07-10

---

## >> CURRENT STATE (2026-07-11) -- read this first after any compaction
**Where we are:** Phase 2 done + hardened (real MCP, real batching, varied-batch proof -- all pushed,
commit a6bbb48). Phase 4 (execution gate) is IN PROGRESS: the write capability is built, tested, and the
approval gate is live-proven (via the Agency schema fix, same gate mechanism) -- what's NOT yet proven is a
full live run where a real document naturally hits Tier 1 and a real remediation record gets written.
**Next action:** decide how to prove the --execute write path live, given every Evaluator run all session has
landed Tier 3 (see "Phase 4" section for the working theory why, and the options given to Andrew). Then
either continue Phase 4 or move to Phase 3 (Google Drive -- Andrew is waiting on a go-ahead, not blocked) /
Phase 5 (Synthesizer + DOCX/PPTX).
**Runtime fact worth remembering:** the Notion tracker's Agency select field originally only had
SEC/FINRA/State/Other (a leftover from a different, financial-services Riptide template) -- fixed live via
mcp_servers/notion_tracker/writer.ensure_agency_options(), now includes the two healthcare agency names,
confirmed idempotent.
**Repo state:** as of this entry, the hardening-pass files are about to be committed locally; ask Andrew
before pushing (he's been choosing when). Last GitHub-synced commit: 8d5fb4a. CI (ruff + pytest) runs on push.
**Runtime facts:** model routing operator-pinned in .env (haiku classify / sonnet specialists / opus evaluator /
sonnet synth); Notion data_source_id lives in .env; governance hooks in .claude/settings.json (review via /hooks).
Claude Code driver model switched to Sonnet 5 this session (`/model sonnet`) to save cost during the Phase 2
build; the app's own operator-pinned routing in .env is untouched by that switch. claude-agent-sdk==0.2.116
added to requirements.txt/.venv -- its default transport shells out to a BUNDLED claude.exe CLI binary, not
a plain API call; ria/evaluator.py explicitly pins `env={"ANTHROPIC_API_KEY": ...}` in ClaudeAgentOptions so
that subprocess always uses the project's own key rather than whatever auth is ambient in the shell.
**Fast re-orient:** read this scratchpad top-to-bottom -- the Architecture Direction, Phase 1, and Phase 2
sections hold the details. Working style: config-over-code, harness-first (see memory + Architecture Direction).

---

## Phase 0: Foundation
**Date:** 2026-07-10
**Status:** Complete

### What We Built
- Full repo scaffold: agents, mcp_servers, prompts, evaluations, outputs, logs, config, tests, docs, scratchpad
- Root CLAUDE.md with operator trust boundaries and model routing constraints
- Six agent-scoped CLAUDE.md files: classifier, materiality, process_impact, gap_analyzer, evaluator, synthesizer
- Python virtual environment with all dependencies
- .env template with model routing, API placeholders, and pipeline thresholds
- requirements.txt locked to installed versions

### Architectural Decisions Made
1. Model routing locked at operator level in root CLAUDE.md - agents cannot self-upgrade
2. Haiku for classification (speed, cost), Sonnet for specialist reasoning, Opus exclusively for Evaluator trust gate, Sonnet for synthesis
3. Three autonomy tiers defined: auto-execute (>=0.90), human review (>=0.75), escalate (<0.75 or critical)
4. Schema validation failures trigger targeted retry not full re-run (max 3 attempts)
5. Prompt caching applied at document ingest - all sub-agents work from cached prefix
6. .env scoped to project only - never committed to GitHub

### CCAF Domains Exercised
- CLAUDE.md scoping: root operator level vs agent user level established
- User vs operator trust: constraints defined that sub-agents cannot override
- Model routing: deliberate capability-to-cost matching encoded as operator policy

### Environment
- OS: Windows 11, PowerShell 5.1
- Python 3.11.9, Node 24.18, Git 2.54
- Repo: https://github.com/riptide-consulting/riptide-ria
- Key dependencies: anthropic 0.116.0, fastapi 0.139.0, notion-client 3.1.0

### Integrations Configured (keys pending)
- Anthropic API: project-scoped key
- Notion: database ID 399e776b2a2280bea2e3ff9c53172cdb
- Federal Register API: free, no auth required
- Google Drive: andrew@riptideconsulting.com
- Gmail: andrew@riptideconsulting.com (sender), riptide.ria.alerts@riptideconsulting.com (escalation)

### Open Items Carried to Phase 1
- Add Anthropic API key to .env
- Add Notion API key to .env
- Set up Google OAuth credentials
- Notion integration token needed for MCP server

### Presentation Notes
- Phase 0 establishes the governance layer before a line of functional code is written
- This is intentional and demonstrates responsible agentic system design
- The CLAUDE.md hierarchy is a live artifact of operator vs user trust separation
- Model routing as operator policy (not developer convenience) is a key talking point

### Notion Connectivity Resolved (2026-07-10)
- Symptom: databases.retrieve returned object="database" with no `properties` key
- Root cause: notion-client 3.1.0 defaults to Notion-Version 2025-09-03, which splits a
  database into data sources; the property schema now lives on the data_source object,
  not the database object
- Fix: verification walks database -> data_sources[] -> data_sources.retrieve (schema);
  row reads go through data_sources.query (databases.query no longer exists in this SDK)
- Verified live: DB "RIA Remediation Tracker" -> 1 data source, 12 properties, read-only query OK
- Database id (container):    399e776b-2a22-8061-9de4-f18735bf9653
- Data source id (schema/rows): 399e776b-2a22-804a-ae6f-000b44c7bf92
  -> stored as NOTION_DATA_SOURCE_ID in .env; use for Phase 1 queries + page writes
- Script: mcp_servers/notion_tracker/verify_connection.py (read-only, no external side effects)
- Schema present: Regulation Name (title), Agency, Risk Level, Impact Score, Status,
  Owner, Due Date, Source URL, Remediation Actions, Escalated, Auto Executed, Created By Agent

---

## Architecture Direction (locked 2026-07-10)
Config-over-code, harness-first. Andrew is early in his dev journey and wants to avoid
hand-rolling low-level code, so we lean on the Claude Code harness (agents as markdown,
skills, hooks, headless -p) plus thin, legible Python that I write and he reviews.

- SDK: use the Claude Agent SDK for ONE self-contained component (the Evaluator gate) to
  genuinely exercise the SDK CCAF surface; everything else stays config-first. Key reframe:
  the Agent SDK is the *higher-level* path -- "raw coding" = hand-rolled anthropic Messages
  loops, which we avoid.
- Google OAuth (Drive/Gmail) deferred to Phase 3, when those integrations are actually needed.
- Model routing stays operator-pinned in .env (Haiku classify / Sonnet specialists / Opus
  evaluator / Sonnet synth); never upgraded in code.
- CCAF surfaces still open: Skills + SDK (Phase 2), chaining (specialist sequence),
  Evaluator gate (Phase 4), full-document cache reuse (Phase 2).

---

## Phase 1: Core Ingestion + Caching
**Date:** 2026-07-10
**Status:** Complete -- working ingest -> classify pipeline

### Ingestion foundation (done)
- ria/ core package: settings (typed, secret-redacting), models (RegulatoryDocument), logging_setup (operator audit line)
- mcp_servers/federal_register/client.py: read-only CMS/FDA ingestion; verified live (18 docs, 12-property schema parse)
- Known refinement: primary_agency shows parent dept (HHS); prefer specific sub-agency (CMS/FDA)

### Governance + CI/CD layer (done) - config-over-code, harness-first
- .claude/hooks/ (stdlib-only, unit-tested): audit_log (PostToolUse), guard_secrets + guard_side_effects (PreToolUse)
- .claude/settings.json wires all three; ACTIVATE via /hooks or restart (settings watcher was not active at session start)
- Enforces operator rules mechanically: log every tool call; block external side effects unless RIA_EVALUATOR_APPROVED=1; block leaking .env secret values
- CI: .github/workflows/ci.yml (ruff + pytest + settings.json validation + eval-suite gate stub); 13 tests pass, ruff clean
- pyproject.toml added (ruff + pytest config); ruff added to requirements.txt

### CCAF surfaces added this session
- Hooks (governance enforcement) + CI/CD (GitHub Actions). Root CLAUDE.md coverage map updated to include Hooks, CI/CD, Skills, SDK.

### Classifier + headless entrypoint (done)
- ria/classifier.py: single cached Haiku call, forced tool use (strict schema), confidence-floor rule (<0.60 routes all three)
- Prompt caching wired (cache_control on rubric + document); verified live -- writes 0 tokens because abstracts sit under Haiku's 4096-token minimum, reported honestly. Full-doc reuse is Phase 2.
- main.py: headless -p entrypoint (ingest -> classify -> routing table / JSONL). Verified live: 3 docs routed with sensible priority/confidence
- primary_agency heuristic fixed (prefers CMS/FDA over the parent HHS department)
- 18 tests pass, ruff clean; classifier logic covered offline (no live API in CI)

### Carried to Phase 2
- Full-document caching + cross-agent reuse (the real cache-READ demonstration)
- Specialist sub-agents (materiality / process_impact / gap_analyzer) + an analysis skill + the Agent SDK Evaluator

## Phase 2: Specialist Sub-Agents
**Date:** 2026-07-10
**Status:** In progress

### Step 1 -- full-document cache reuse (done)
- mcp_servers/federal_register/client.py: fetch_full_text (read-only, capped at 60k chars)
- ria/caching.py: cached_document_prefix + ask_over_document -- the shared cached-doc read the specialists reuse
- cache_probe.py: live proof on doc 2026-13918 (CMS notice, 10509 chars -> 3714 tokens):
    call 1 write=3714 read=0 ; call 2 write=0 read=3714 ; call 3 write=0 read=3714
  -> cache_read confirmed non-zero. The classifier's 0/0 was a Haiku 4096-token threshold artifact, not a bug.
- 20 tests pass, ruff clean.

### Step 2 -- specialists (done)
- ria/specialists.py: materiality / process_impact / gap_analyzer, each a free-form JSON read over the
  SAME cached prefix via ria.caching.ask_over_document (no tools/system on any of the three calls -- that's
  what keeps the prefix match intact across agents; see the module docstring for why tools/system would break it)
- Each specialist's output schema + constraints come straight from agents/<name>/CLAUDE.md; objective
  constraints are enforced in code (materiality: impact_score>80 forces risk_level=critical; process_impact:
  hard cap of 10 affected_processes, truncation logged; gap_analyzer: total_gaps/critical_gaps always derived
  from the actual list rather than trusting the model's self-report, critical gaps get a fallback
  remediation_action if the model omits one, PHI/patient-safety gaps can never stay "low" severity)
- Specialists run WITHOUT Google Drive in this phase (Phase 3); prompts say so explicitly instead of
  pretending a policy cross-reference happened -- same honesty standard as the Phase 1 cache reporting
- specialist_probe.py: live proof, forces all three specialists regardless of classifier routing, on a real
  FDA document (2026-14073, Drug Establishment Registration and Drug Listing Requirements):
    call 1 [materiality]     write=19120  read=0
    call 2 [process_impact]  write=0      read=19120
    call 3 [gap_analyzer]    write=0      read=19120
  -> cache reuse confirmed across three DIFFERENT agents (not just repeated questions like step 1's probe)
- main.py: added `--analyze` flag (off by default -- keeps a plain run cheap/Haiku-only like Phase 1).
  `python main.py --analyze --limit N` runs ingest -> classify -> routed specialists and prints a compact
  summary. Live run on the same FDA doc: impact=42/medium, 10 affected processes, 9 gaps (2 critical) --
  and cache_write was 0 / cache_read was 19120 on ALL THREE calls, because the Anthropic server-side cache
  from specialist_probe.py's run (minutes earlier, separate process) was still warm. Cache reuse persists
  ACROSS process runs, not just within one -- a stronger result than we set out to prove.
- 33 tests pass (13 new), ruff clean

### Step 3 -- regulatory-report skill (done)
- .claude/skills/regulatory-report/SKILL.md: human-invoked (/regulatory-report [N]), instructs Claude to run
  `main.py -p --analyze --limit N` (default N=3, cost-conscious) and render the JSON as markdown DIRECTLY --
  deliberately NOT a Python templating script, per the config-over-code/harness-first direction. Distinct
  from the future Synthesizer agent (Phase 5), which will auto-generate DOCX/PPTX unattended.
- Building the report against real output caught a real gap: main.py's JSON entries had no agency /
  publication_date / html_url, so a report couldn't cite its source. Fixed in main.py (three fields added
  to the entry dict, sourced from the RegulatoryDocument already in hand -- no new fetch).
- Live-rendered outputs/reports/2026-07-11-regulatory-report.md by hand-executing the skill's own
  instructions once (proof the instructions are followed): doc 2026-14073 (FDA proposed rule on distributed
  drug manufacturing establishments), materiality 42/100 medium, 10 processes, 9 gaps (2 critical) -- same
  document as the specialist_probe/main.py --analyze runs, so this run's cache_write=0, cache_read=57360
  (still warm from those earlier calls). outputs/ added to .gitignore -- reports are regenerable runtime
  artifacts, same treatment as logs/*.jsonl.
- 33 tests still pass, ruff clean (no new Python logic to test -- the skill is markdown, not code)

### Step 4 -- Evaluator on the Claude Agent SDK (done)
- ria/evaluator.py: the trust-boundary gate, and the ONE deliberate Agent SDK component (everything else in
  the codebase uses the plain `anthropic` client). agents/evaluator/CLAUDE.md says this agent "CANNOT be
  bypassed under any circumstances" -- so `compute_tier()` is a pure, deterministic function (confidence
  thresholds + risk level + enforcement detection -> tier/execute/escalate) and Opus is never even asked to
  propose a tier in its own structured-output schema. Same proposes-then-code-disposes pattern as the
  classifier's confidence floor, just made airtight at the schema level here.
- Gives the Evaluator ONE live tool -- read-only Notion precedent lookup (mcp_servers notion query wrapped
  via @tool/create_sdk_mcp_server) -- so it's a genuine agentic loop (decide it needs context, fetch it, then
  answer), not just a heavier way to do forced structured output. Zero built-in tools (`tools=[]`): no
  filesystem, no shell, nothing but that one read-only lookup. `strict_mcp_config=True` so it ignores any
  ambient .mcp.json too.
- Before writing any code: verified the SDK's ACTUAL installed API (0.2.116) against its real source
  (dataclass fields, tool()/create_sdk_mcp_server() signatures, ResultMessage/AssistantMessage fields,
  output_format's {"type":"json_schema","schema":...} shape) rather than trusting a research subagent's
  example blind. It checked out -- but that check caught a real, separate issue: the SDK's default transport
  shells out to a BUNDLED claude.exe CLI and inherits ambient shell env/auth by default. Fixed by pinning
  `env={"ANTHROPIC_API_KEY": settings.anthropic_api_key}` in ClaudeAgentOptions, same explicit-credential
  pattern every other agent in this codebase already uses. Confirmed live: the CLI's own banner said
  "claude.ai connectors are disabled because ANTHROPIC_API_KEY... takes precedence" -- proof it used the
  project's key, not a personal login.
- evaluator_probe.py: live proof, full chain (classify -> all 3 specialists -> evaluate) on the same FDA
  doc (2026-14073). Two independent live runs, both high quality: Opus called query_notion_precedent three
  times unprompted (tracker is still empty -- Phase 4 hasn't written anything yet -- so it honestly reported
  "no precedent found" both times), caught a genuine tension between materiality's risk=medium and
  gap_analyzer's 2 critical gaps, correctly distinguished restated existing statutory penalty language from a
  NEW penalty, and on the second run independently surfaced a sharper point: whether the foreign-establishment
  registration duty is already in force via the PREVENT Pandemics Act regardless of this proposed rule's
  status. Both runs landed tier=3/escalate=True (confidence ~0.6, below the 0.75 floor, AND enforcement
  language detected -- two independent hard triggers). Cost ~$0.42-0.44/call -- a deliberate governance gate,
  not meant for high-frequency use.
- Found and fixed a real bug from the first live run: returning early from inside `async for message in
  query(...)` once ResultMessage arrived forced an abrupt cancellation that raced the SDK's internal cleanup
  ("aclose(): asynchronous generator is already running" on teardown -- didn't corrupt the result, but noisy
  and worth fixing properly). Fixed by letting the loop reach its own natural end (query() is one-shot, so it
  finishes right after ResultMessage anyway) and returning after. Re-ran live to confirm: clean, no error.
- main.py: added `--evaluate` flag (implies --analyze; Opus is the priciest call in the pipeline so it's
  strictly opt-in). Table output gets an "Evaluator decisions" section, explicit about execute=True being a
  recommendation only -- nothing auto-writes anywhere yet (that's Phase 4, the actual execution gate).
  regulatory-report skill updated to describe --evaluate as an optional extra layer.
- requirements.txt: added claude-agent-sdk==0.2.116.
- 49 tests pass (16 new -- compute_tier boundaries/overrides + _detect_enforcement), ruff clean.

### Hardening pass (done) -- Andrew's review of Phase 2, before moving on
Andrew reviewed the "how's it going" status honestly and called out real gaps rather than letting them ride:
"batching" and "MCP" were both claimed in the CCAF coverage map but not actually built, and every live proof
had reused the same one document. All three fixed before touching Phase 3/4:

**Real MCP servers** (previously: mcp_servers/ was just a folder of plain httpx/notion_client functions with
a suggestive name -- zero actual MCP protocol anywhere except the Evaluator's own in-process tool):
- mcp_servers/federal_register/server.py + mcp_servers/notion_tracker/server.py: real FastMCP servers
  (stdio transport), wrapping the existing plain-function clients as MCP tools. FastMCP's @mcp.tool() is a
  DIFFERENT convention from claude_agent_sdk's @tool -- plain typed return values, auto-generated schema from
  type hints, not the {"content":[...]} wrapper -- verified against installed source before coding, same
  discipline as the Evaluator SDK check (would have gotten this wrong by assuming they matched).
- mcp_servers/notion_tracker/client.py: the Notion-query logic (_title/_select/_checkbox/
  search_remediation_tracker) MOVED here from its previous home inside ria/evaluator.py -- one implementation,
  two callers: the Evaluator's in-process SDK tool AND the new standalone MCP server both call it now.
- mcp_servers/federal_register/client.py: added fetch_document(document_number) (single-doc lookup by
  document_number) -- a genuine small addition needed so get_document_full_text doesn't have to re-list all
  recent documents just to resolve one ID.
- .mcp.json added at repo root, registering both servers so they're connectable from any real MCP client
  (Claude Code included), not just importable Python.
- mcp_probe.py: live proof -- spawns each server as an actual subprocess, connects a REAL MCP ClientSession
  over stdio, calls list_tools() + call_tool(). Both answered over real protocol: federal-register exposed
  [list_recent_documents, get_document_full_text], notion-tracker exposed [search_tracker], both returned
  real data. Not an import check -- an actual protocol round-trip.
- 7 new offline tests (mcp_servers/notion_tracker/client.py's pure helpers + the missing-data-source error).

**Real batching** (previously: only trace of "batching" anywhere was a docstring phrase; main.py was a plain
for-loop):
- ria/classifier.py: classify_batch() -- submits every document's classification as ONE Anthropic Batches
  API call (client.messages.batches.create/retrieve/results) instead of N synchronous calls. Scoped to the
  classifier ONLY (root CLAUDE.md: "Batch jobs: haiku preferred") -- specialists/Evaluator stay per-document
  since each depends on THIS document's own prior-stage output, not a batch-shaped problem. Verified the real
  Batches API shape (Request/MessageBatch/MessageBatchResult types) against installed anthropic==0.116.0
  source before coding. Factored classify()'s request-building into a shared _request_params() so both the
  single-call and batch paths stay identical (same cache_control placement, no behavior drift).
- Falls back to synchronous classify() for any document missing from the batch's results (a batch sub-request
  failure doesn't drop a document silently -- "no silent caps," same principle as the FR pagination cap).
- main.py: added `--batch` flag (composes with --analyze/--evaluate).
- 3 new offline tests for _request_params (tool_choice forcing, cache placement, cross-document identity of
  the cacheable system block).

**Live proof -- both together, real Batches API + real diversity, not the same document again:**
`main.py --batch --analyze --limit 6` against 6 REAL, DIFFERENT documents (not 2026-14073 again):
- Batch classify: submitted, polled 4x every 5s, done in 16 seconds for all 6 (succeeded=6 errored=0).
- Real diversity confirmed: 3 FDA + 3 CMS; Proposed Rule + Notice; priority high/medium/low all appeared;
  confidence ranged 0.72-0.92; full-text sizes ranged 2,812-19,120 cache tokens.
- Classifier routing is genuinely SELECTIVE, not "always all three": one document got gap_analyzer only, two
  got two-of-three in different combinations. Only 2 of 6 documents triggered all three specialists.
- ZERO retries, ZERO failures, ZERO warnings across the whole run (checked precisely, not a loose grep) --
  the free-form JSON parsing in specialists held up across genuinely different document content/lengths.
- 47,293 tokens written / 59,770 read in cache across the batch.
- Still-open gap (honestly not closed by this run): none of the 6 documents lacked full_text_url, so the
  cached_document_prefix abstract-fallback path still hasn't fired live (it IS covered by an offline unit
  test). Also still haven't seen a live Tier 1/2 Evaluator result -- only ran --analyze here, not --evaluate,
  to control cost; every --evaluate run all session (different documents now, still just the one from
  specialist_probe/evaluator_probe) has landed Tier 3. Plausible explanation: real CMS/FDA text commonly
  carries background statutory penalty language, and every specialist this phase discloses "no internal
  policy access" per its prompt, which legitimately suppresses confidence -- not confirmed to be a bug, just
  not yet observed otherwise. compute_tier() itself is exhaustively unit-tested for every branch.
- 59 tests total pass (10 new this pass), ruff clean.

## Phase 3: MCP Tool Layer
*Pending -- the mcp_servers/ real-MCP work above is now the foundation this phase builds on (Google Drive
would follow the same client.py + server.py + real MCP tool pattern)*

## Phase 4: Evaluator + Execution Gate
**Status: in progress (2026-07-11)**

### Schema discovery + fix (done)
Before writing any create logic, queried the Notion data source's real property types (never assume --
verify). Found: Agency is a `select` field with options `['SEC', 'FINRA', 'State', 'Other']` -- a leftover
from a different, financial-services Riptide Consulting template, never customized when this project's
Notion tracker was set up in Phase 0. None of those fit CMS/FDA. Asked Andrew rather than guessing (three
options: add real options via API / use "Other" as a workaround / pause and check if the DB is shared with
other projects) -- he chose to add the real options via API, gated behind approval like any other write.
Fixed live: `mcp_servers/notion_tracker/writer.ensure_agency_options()` added "Centers for Medicare &
Medicaid Services" and "Food and Drug Administration" while preserving the four original options; confirmed
idempotent by re-running it (second call added nothing). Status property's options (Not started/In
progress/Blocked/Done) were already fine, no fix needed there.

### Write capability (done)
- mcp_servers/notion_tracker/writer.py -- deliberately a SEPARATE file from client.py (which stays read-only)
  so the safety property is visible at a glance: anything with a real external side effect lives in writer.py.
- `_require_approval()`: checks RIA_EVALUATOR_APPROVED, same env var and same concept as
  .claude/hooks/guard_side_effects.py, but applied at the point of the write itself rather than only at the
  Claude-Code-tool-call level. Important distinction realized while designing this: guard_side_effects.py only
  pattern-matches Bash command STRINGS (git push, curl -X POST, mcp__ tool names) -- a plain `python
  main.py --execute` invocation wouldn't trip that hook at all even though it can trigger a real Notion write
  internally. Building the gate INTO the write function itself (not just relying on the outer hook) is what
  actually closes that gap -- fail-safe by construction, not by trusting every caller to check first.
- `_build_properties()`: pure function mapping doc + decision + specialist_results onto the Notion schema's
  EXACT verified types (select for Agency/Risk Level, status for Status, rich_text for Owner/Remediation
  Actions, number/date/url/checkbox for the rest). Risk Level values get `.capitalize()`'d since specialists
  produce lowercase ("critical") but the Notion select options are capitalized ("Critical").
- `create_remediation_record()`: the actual `pages.create` call, gated by `_require_approval()`.
- main.py: `--execute` flag (implies --evaluate implies --analyze). Prints a clear message and logs
  `execute_gate blocked` when RIA_EVALUATOR_APPROVED isn't set, rather than silently doing nothing or
  crashing. Per-document: notion_page_id on success, would_execute=True when blocked-but-would-have-fired,
  execute_error if the Notion call itself fails (doesn't crash the whole run over one document).
- 12 new offline tests (approval gate on/off, full property-mapping coverage including the due-date-present
  vs absent branches). 71 tests total pass, ruff clean.

### Still open: no live end-to-end write proof yet
The write MECHANISM is live-proven (the Agency schema fix used the exact same `_require_approval()` gate and
successfully wrote a real change to Notion). What's NOT yet proven: main.py's full --execute wiring firing
for a real document that naturally lands Tier 1 -- because no live Evaluator run all session has landed
anywhere but Tier 3. Working theory, not yet confirmed either way: Tier 1 may be STRUCTURALLY rare right now
because every specialist prompt this phase discloses "no internal policy access" (Phase 3 dependency), which
legitimately drags the Evaluator's overall_confidence down below the 0.90 auto-execute floor -- arguably a
GOOD conservative property of the system (it shouldn't feel confident enough to auto-execute when it knows
it's missing real internal context), not a flaw. Options given to Andrew: keep trying real documents and
hope one clears the bar naturally, or do one clearly-labeled SYNTHETIC proof (real Notion write, fabricated
Tier-1-shaped decision data) to at least prove main.py's wiring end to end. Awaiting his call -- a real Notion
write is a new, separate action from the schema fix he already approved, so it gets asked for separately.

## Phase 5: Synthesizer + Output Layer
*Pending*

## Phase 6: Optimization + Polish
*Pending*
