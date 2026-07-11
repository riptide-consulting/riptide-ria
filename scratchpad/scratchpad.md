# RIA Project Scratchpad
# Riptide Consulting - CCAF Showcase Build
# Started: 2026-07-10

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

### Step 2 -- specialists (next)
- materiality / process_impact / gap_analyzer as sequential reads over the shared cached prefix (chaining surface)
- then an analysis skill + the Evaluator on the Agent SDK

## Phase 3: MCP Tool Layer
*Pending*

## Phase 4: Evaluator + Execution Gate
*Pending*

## Phase 5: Synthesizer + Output Layer
*Pending*

## Phase 6: Optimization + Polish
*Pending*
