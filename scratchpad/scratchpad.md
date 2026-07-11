# RIA Project Scratchpad
# Riptide Consulting - CCAF Showcase Build
# Started: 2026-07-10

---

## >> CURRENT STATE (2026-07-11) -- read this first after any compaction
**Where we are:** Phase 2 is DONE, including the Evaluator (the one deliberate Claude Agent SDK component).
All four steps -- full-document cache reuse, three chained specialists, the regulatory-report skill, and the
SDK-backed Evaluator -- are built and proven live end to end (ingest -> classify -> specialists -> evaluate).
**Next action:** commit + push this step (evaluator.py + evaluator_probe.py + main.py --evaluate + skill
update + requirements.txt), then decide the next phase: Phase 3 (Google OAuth, MCP tool layer) / Phase 4
(wire execute=True to a real Notion write -- the actual execution gate) / Phase 5 (Synthesizer + DOCX/PPTX).
Nothing currently WRITES to Notion or acts on an Evaluator decision -- execute=True is report-only until
Phase 4 exists. That's a deliberate, not-yet-closed gap.
**Repo state:** as of this entry, evaluator work is committed locally but ask Andrew before pushing (he's
been choosing when). Last GitHub-synced commit: 1d97308. CI (ruff + pytest) runs on push via GitHub Actions.
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

## Phase 3: MCP Tool Layer
*Pending*

## Phase 4: Evaluator + Execution Gate
*Pending*

## Phase 5: Synthesizer + Output Layer
*Pending*

## Phase 6: Optimization + Polish
*Pending*
