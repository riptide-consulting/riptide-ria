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

---

## Phase 1: Core Ingestion + Caching
*Pending*

## Phase 2: Specialist Sub-Agents
*Pending*

## Phase 3: MCP Tool Layer
*Pending*

## Phase 4: Evaluator + Execution Gate
*Pending*

## Phase 5: Synthesizer + Output Layer
*Pending*

## Phase 6: Optimization + Polish
*Pending*
