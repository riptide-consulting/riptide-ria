# Riptide RIA - Regulatory Intelligence Agent
# Root CLAUDE.md - Operator Level Configuration

## Project Overview
Healthcare regulatory intelligence agent that monitors, analyzes, and implements
responses to CMS and FDA regulatory changes. Built on the Anthropic stack as a
Riptide Consulting CCAF showcase project.

## Operator Trust Boundaries
This file defines operator-level constraints. These cannot be overridden by
user-level instructions or sub-agent requests.

### Absolute Constraints
- Never execute any action with external side effects without Evaluator approval
- Never upgrade model selection beyond what is defined in .env
- Never expose API keys, credentials, or PII in logs or outputs
- Never auto-execute any action scored below AUTO_EXECUTE_THRESHOLD (0.90)
- Never skip the Evaluator gate under any circumstances
- Always log every agent call, tool invocation, and execution decision

### Model Routing (Operator Defined - Not Overridable)
- Classifier: claude-haiku-4-5-20251001 (routing decisions only)
- Specialist agents: claude-sonnet-5 (analytical reasoning)
- Evaluator: claude-opus-4-8 (trust boundary decisions)
- Synthesizer: claude-sonnet-5 (output generation)
- Batch jobs: claude-haiku-4-5-20251001 preferred, claude-sonnet-5 where depth required

### Autonomy Tiers
- TIER 1 AUTO-EXECUTE: confidence >= 0.90, risk = Low or Medium
- TIER 2 HUMAN REVIEW: confidence >= 0.75, risk = High
- TIER 3 ESCALATE: confidence < 0.75 OR risk = Critical OR enforcement action detected

### Data Handling
- Regulatory documents are cached on first ingest within session
- No regulatory document content is logged in full - summaries only
- PII must never appear in agent outputs or Notion records
- All tool calls are logged with timestamp, agent, action, and outcome

## Agent Behavior Standards
- Every agent returns structured JSON against its defined schema
- Schema validation failures trigger targeted retry, not full re-run
- Maximum retry attempts: 3 per agent per document
- Partial results are passed downstream with confidence flag set accordingly
- Every agent scratchpad entry must include: reasoning, confidence score, CCAF domain exercised

## CCAF Domain Coverage Map
- User vs operator trust: this file and Evaluator gate
- Headless vs interactive: -p flag pipeline in main.py
- CLAUDE.md scoping: root + per-agent scoped files
- Routing pattern: Classifier agent
- Chaining pattern: Specialist agent sequence
- Evaluator/optimizer pattern: Evaluator agent gate
- Caching: prompt cache on document ingest
- Batching: batch processor in pipeline
- Tool use: all MCP server integrations
- Hooks: .claude/settings.json governance hooks (audit log, secrets guard, evaluator-gate side-effect guard)
- CI/CD: GitHub Actions in .github/workflows/ci.yml (ruff + pytest + settings validation + eval-suite gate)
- Skills: .claude/skills for report generation and analysis rubrics (Phase 2/5)
- SDK: Claude Agent SDK for a self-contained Evaluator component (Phase 2+)

## Governance Enforcement (Hooks)
Operator constraints above are enforced mechanically by Claude Code hooks in
.claude/settings.json - not just prose:
- Audit logging -> PostToolUse hook records every tool call to logs/audit.jsonl
- No external side effects without approval -> PreToolUse guard blocks them unless RIA_EVALUATOR_APPROVED=1
- No credential exposure -> PreToolUse guard blocks writing .env secret values outside .env
Hook logic is unit-tested; CI gates lint + tests on every push/PR.

## File Scoping
- Root CLAUDE.md: operator constraints (this file)
- agents/*/CLAUDE.md: agent-specific behavior and output schema
- config/: environment and integration configuration
- .env: secrets and model routing (never committed)

## Version Control
- All CLAUDE.md files are versioned and changes require review
- Prompt changes must pass eval suite before merge
- Model routing changes require explicit operator approval
