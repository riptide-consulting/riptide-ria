# Riptide RIA: Regulatory Intelligence Agent

Healthcare compliance teams find out about regulatory change the hard way: someone reads
the Federal Register, decides whether it matters, chases down which internal policies and
processes it touches, and writes it up, days later, per change, forever. Riptide RIA is a
working multi-agent pipeline that does the first pass automatically: it monitors CMS/FDA
publications, analyzes each document against your internal policy context, and produces an
executive briefing with a due-dated, owner-assigned remediation plan in about five minutes
for about $0.59 per document. Measured, not estimated.

**And it can never act on its own judgment alone.** Every external action (a tracker
record, an escalation email) requires two independent things: a trust-gate decision made
by deterministic code from model-supplied scores, and an explicit human approval checked
in code at the exact point of the write. The model proposes; code and people dispose.

```
ingest (Federal Register) -> classify (Haiku) -> analyze (3 Sonnet specialists, chained
over one cached document) -> evaluate (Opus, Agent SDK, autonomy tier) -> synthesize
(Sonnet briefing + DOCX/PPTX, and where authorized: a Notion record and/or an escalation email)
```

Built by Riptide Consulting, an Anthropic-first AI strategy and engineering firm and Claude
Partner Network member, by a Claude Certified Architect (CCA-F). This repository is the
working proof: real pipeline, real governance, real evals, honest limitations.

## What's real vs. not yet

Real and live-proven: the full five-stage pipeline against the live Federal Register API,
prompt caching with measured reuse, Message Batches API classification, the Opus Evaluator
on the Claude Agent SDK with a working read-only Notion precedent tool, deterministic tier
computation, gated Notion writes and Gmail escalation, Claude Code governance hooks, 117
offline unit tests, and a live eval suite (including adversarial prompt-injection cases)
with committed results. Costs and timings are measured from real runs.

Not yet: multi-tenancy (single shared Notion/Drive today; see `docs/DATA-HANDLING.md`),
production hardening (this is a capability demonstration), branded output templates
(`config/riptide_template.docx`/`.pptx` are structural shells today; drop in real branded
files at those paths, keeping title/body/title-only layouts at layout positions 0/1/5, and
the Synthesizer picks them up unchanged), and additional data sources beyond the Federal
Register (`docs/DESIGN-DECISIONS.md` covers how one would be added).

## The trust model, in one paragraph

Root `CLAUDE.md` defines three autonomy tiers. Opus supplies judgment: per-specialist
quality scores, overall confidence, and flags. A pure function (`compute_tier()` in
`ria/evaluator.py`) turns that judgment into tier 1 (auto-execute), 2 (human review, the
default), or 3 (escalate), with hard tier-3 triggers (low confidence, critical risk,
enforcement language) checked first so nothing out-ranks an escalation. The risk input is
the materiality specialist's own output, and enforcement detection is a deterministic
keyword scan OR'd with the model's flags: code backstopping judgment at every step. Then,
independently, `RIA_EVALUATOR_APPROVED=1` is required at the point of every external
write, in the writing code itself. Local DOCX/PPTX generation is deliberately ungated:
reversible, zero external reach. The demo never sets the approval flag, so you watch the
gate correctly report blocked side effects rather than firing real ones.

## For security, compliance, and architecture reviewers

`docs/ENTERPRISE-FAQ.md` answers the vendor-risk questions directly: what data leaves the
environment and where it goes, why PHI is out of scope by design, the human-oversight
model, the audit trail, how Notion/Gmail/Drive swap for ServiceNow-or-Jira/Outlook/SharePoint
behind the MCP boundary, and the model-access options (direct Anthropic API, or Claude via
AWS Bedrock / Google Vertex AI in your own cloud tenancy). `docs/DATA-HANDLING.md` covers
current data flows honestly, including what is single-tenant today and what an enterprise
deployment changes.

## Setup

Requires Python 3.11+. Only one credential is required to run:

```
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt        (Windows)
.venv/bin/pip install -r requirements.txt            (macOS/Linux)
copy .env.example .env                               (then add ANTHROPIC_API_KEY)
```

That's enough for ingest, classify, analyze, and evaluate. Optional integrations:
`NOTION_API_KEY`/`NOTION_DATABASE_ID` make the Evaluator's precedent lookups return real
results and enable the gated Notion write; Google credentials enable Drive context and the
Gmail escalation path (one-time OAuth consent per scope; see `docs/RUNBOOK.md`).

## Running it

```
python run_demo.py            2 documents end to end (cross-platform; run_demo.bat on Windows)
python main.py --limit 5                      ingest + classify only
python main.py --batch --limit 10             classification via the Message Batches API
python main.py --analyze --evaluate --limit 2 add specialists + the Evaluator
python main.py ... --synthesize               add briefings + DOCX/PPTX (side effects stay gated)
python main.py -p --limit 5                   headless: JSONL on stdout, diagnostics on stderr
```

A full-pipeline run measures about $0.59 and 4.5 minutes per document, dominated by the
Evaluator (the one deliberately expensive stage; judgment quality concentrates where
consequence is highest). `docs/COST-BREAKDOWN.md` has stage-by-stage numbers;
`config/pipeline_config.json`'s `max_spend_usd` is a hard circuit breaker checked between
documents.

## Evals: measured, adversarial, committed

`evaluations/` makes real API calls and asserts on model behavior, not just schema
validity. Cheap cases run through a pass-rate harness (default 3 repeats; a rate is a
measurement, one sample is an anecdote). `test_injection_evals.py` embeds explicit
injected directives (fake operator authority demanding low priority, zero gaps, inflated
confidence, a canary opener) in enforcement-grade fixtures and asserts they do not take,
at the classifier, at a specialist, and at the Evaluator gate itself. Every run writes a
dated results file to `evaluations/results/`, committed after green runs so a reviewer
sees dates, rates, and dollar cost without needing keys. CI runs the suite on any PR that
touches prompt-affecting paths and on every push to main.

## Engineering evidence map

For technical reviewers: every capability this project claims is tied to code you can
read, a probe that was actually run, and (where model behavior is the claim) a live eval.
Rows follow the five domains of Anthropic's Claude Certified Architect - Foundations
certification; pattern names follow Anthropic's "Building effective agents".

| Domain | Implementation | Live proof |
|---|---|---|
| Agentic Architecture & Orchestration | Routing: `ria/classifier.py` (forced tool use). Prompt chaining: `ria/specialists.py` over one cached prefix. Evaluator-optimizer (adapted): Opus scores, `compute_tier()` disposes. Agent SDK: `ria/evaluator.py` | `evaluations/test_classifier_evals.py`, `test_evaluator_evals.py` (end-to-end enforcement chain forces tier 3) |
| Tool Design & MCP Integration | `mcp_servers/` (federal_register, notion_tracker, gmail, google_drive), least-privilege scopes; Evaluator holds exactly one read-only tool | `mcp_probe.py`, `execute_probe.py`; audit trail in `logs/audit.jsonl` |
| Claude Code Configuration & Workflows | Root + 6 scoped `agents/*/CLAUDE.md`; hooks in `.claude/settings.json` (secrets guard, side-effect guard, audit log); path-filtered eval gate in CI; `-p` headless mode with pure-JSONL stdout | `tests/unit/test_hooks.py`; hook-block events in `logs/audit.jsonl` |
| Prompt Engineering & Structured Output | Strict JSON schemas via forced tool use at every model boundary; untrusted-content framing for all externally derived text | `evaluations/test_injection_evals.py` (injected directives measurably do not take) |
| Context Management & Reliability | `ria/caching.py` shared prefix, sequential specialists for guaranteed cache reuse; Batches path; retryable-vs-fatal retry policy (`ria/retry.py`); per-document error isolation; cost circuit breaker | `cache_probe.py`; `cache_read` fields in `logs/ria.log`; `tests/unit/test_retry.py` |

## Known limitations and residual risks

Stated plainly rather than implied away. The untrusted-content framing is instruction, not
proof: the injection evals show current models with these prompts resist the attacks we
wrote, which is evidence, not a guarantee against attacks nobody has written yet; the
load-bearing defense is that tier computation and both side-effect gates are code. The
Claude Code hooks fail open by design (tripwire, not wall; the wall is the in-code approval
check). The enforcement and PHI backstops are keyword heuristics and a novel phrasing would
get past the keyword to rely on model judgment alone. Single-tenant data handling today.
Every briefing carries a verify-with-counsel disclaimer: this is analysis support, not
legal advice. `docs/DESIGN-DECISIONS.md` carries the full Q&A, including what the worst
case actually is if a stage is successfully manipulated.

## Testing

```
pytest -q                     117 offline tests, no API cost (what CI runs on every push)
ruff check .                  lint, clean
pytest evaluations -q         live eval suite (real API cost; ~$1-2 with default repeats)
```

## Layout

```
main.py                orchestration + circuit breaker + per-document error isolation
run_demo.py / .bat     one-command demo (cross-platform / Windows double-click)
ria/                   pipeline stages: classifier, caching, specialists, evaluator,
                       synthesizer, settings, cost, retry, logging
mcp_servers/           federal_register, notion_tracker, gmail, google_drive
agents/*/CLAUDE.md     scoped per-agent specs (schemas, constraints, precedence)
.claude/               hooks (secrets guard, side-effect guard, audit log), skills, settings
evaluations/           live evals + injection suite + pass-rate harness + committed results
tests/unit/            offline suite
docs/                  ARCHITECTURE, AGENTS, DESIGN-DECISIONS, COST-BREAKDOWN, RUNBOOK,
                       DEMO-PLAYBOOK, DATA-HANDLING, ENTERPRISE-FAQ, PROBLEM-SOLUTION, FILE-MAP
scratchpad/            complete chronological build log (decisions, dead ends, live proofs)
```
