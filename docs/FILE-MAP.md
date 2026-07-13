# Riptide RIA — File Map

A tracking log of where everything actually is, verified against the real filesystem and git
state on 2026-07-12, not reconstructed from memory. Every path below is the complete path —
nothing to combine with a "repo root" mentioned elsewhere in this document.

Repo root: `C:\Users\poole\Documents\riptide-ria`
GitHub: `github.com/riptide-consulting/riptide-ria`

## Start here

| Full path | Why start here |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\CLAUDE.md` | Operator-level constraints. Nothing downstream can override this. |
| `C:\Users\poole\Documents\riptide-ria\docs\ARCHITECTURE.md` | The real design: trust boundary, governance, project structure. |
| `C:\Users\poole\Documents\riptide-ria\scratchpad\scratchpad.md` | 636 lines. Full chronological build log — every decision, every live proof, in order. |

## Documentation

| Full path | Audience | Covers |
|---|---|---|
| `C:\Users\poole\Documents\riptide-ria\docs\ARCHITECTURE.md` | Engineers extending the code | Pipeline shape, trust-boundary mechanics, governance layering, caching design, known constraints |
| `C:\Users\poole\Documents\riptide-ria\docs\AGENTS.md` | Engineers, deep dive | Every agent individually — model, mechanics, the code-enforced backstop behind each prompt instruction |
| `C:\Users\poole\Documents\riptide-ria\docs\DESIGN-DECISIONS.md` | Architects/reviewers | Q&A format — the specific tradeoff behind 10 real design choices |
| `C:\Users\poole\Documents\riptide-ria\docs\PROBLEM-SOLUTION.md` | Business stakeholders | The problem, the solution, build cost and run cost |
| `C:\Users\poole\Documents\riptide-ria\docs\COST-BREAKDOWN.md` | Finance/accounting | Per-agent real cost and runtime, measured not estimated |
| `C:\Users\poole\Documents\riptide-ria\docs\DATA-HANDLING.md` | A prospective client, direct | Where document content goes, who has access, single-tenant status |
| `C:\Users\poole\Documents\riptide-ria\docs\RUNBOOK.md` | Whoever runs it | Start-to-finish operating procedure, first run and every run after |
| `C:\Users\poole\Documents\riptide-ria\docs\DEMO-PLAYBOOK.md` | Whoever demos it live | Rehearsed procedure, real timing, recovery moves if something breaks |
| `C:\Users\poole\Documents\riptide-ria\docs\FILE-MAP.md` | This file | Where everything is, what's backed up, what's still open |

## Core pipeline

| Full path | Role |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\ria\settings.py` | Loads/validates `.env` + `pipeline_config.json` into one typed object every other module reads from |
| `C:\Users\poole\Documents\riptide-ria\ria\models.py` | Shared data shapes (`RegulatoryDocument`, specialist/evaluator output schemas) |
| `C:\Users\poole\Documents\riptide-ria\ria\classifier.py` | Haiku routing/triage stage, confidence-floor backstop, untrusted-content wrapping |
| `C:\Users\poole\Documents\riptide-ria\ria\specialists.py` | The 3 specialist calls, shared-cache mechanics, per-specialist postprocessing backstops, failure isolation |
| `C:\Users\poole\Documents\riptide-ria\ria\caching.py` | Builds the shared cached document prefix all 3 specialists read |
| `C:\Users\poole\Documents\riptide-ria\ria\evaluator.py` | Opus/Agent-SDK trust-boundary stage — judgment only; retry/backoff |
| `C:\Users\poole\Documents\riptide-ria\ria\synthesizer.py` | Briefing generation, jargon/citation scrub, DOCX/PPTX writers, the two gated external actions |
| `C:\Users\poole\Documents\riptide-ria\ria\cost.py` | Pricing table, token-usage extraction, per-call cost estimation |
| `C:\Users\poole\Documents\riptide-ria\ria\logging_setup.py` | Wires `logging.conf`; now warns loudly instead of silently falling back |

## Entry points and live-proof scripts

| Full path | What it is |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\main.py` | Headless pipeline entrypoint / Coordinator |
| `C:\Users\poole\Documents\riptide-ria\run_demo.bat` | Wraps `main.py` with sensible defaults for a demo run |
| `C:\Users\poole\Documents\riptide-ria\cache_probe.py` | Live proof: prompt-cache reuse across repeated reads of one cached document |
| `C:\Users\poole\Documents\riptide-ria\specialist_probe.py` | Live proof: the specialist chain reuses the cached document prefix |
| `C:\Users\poole\Documents\riptide-ria\evaluator_probe.py` | Live proof: real specialist output in, a real tier decision out |
| `C:\Users\poole\Documents\riptide-ria\execute_probe.py` | Live proof: `main.py`'s `--execute` wiring end to end, one real Notion write |
| `C:\Users\poole\Documents\riptide-ria\gmail_probe.py` | Live proof: the Gmail escalation-email send, end to end |
| `C:\Users\poole\Documents\riptide-ria\mcp_probe.py` | Live proof: the MCP servers are real MCP servers, not plain wrappers |
| `C:\Users\poole\Documents\riptide-ria\requirements.txt` | Pinned dependencies |
| `C:\Users\poole\Documents\riptide-ria\pyproject.toml` | Project metadata / tool config |

## Per-agent specs

| Full path |
|---|
| `C:\Users\poole\Documents\riptide-ria\agents\classifier\CLAUDE.md` |
| `C:\Users\poole\Documents\riptide-ria\agents\materiality\CLAUDE.md` |
| `C:\Users\poole\Documents\riptide-ria\agents\process_impact\CLAUDE.md` |
| `C:\Users\poole\Documents\riptide-ria\agents\gap_analyzer\CLAUDE.md` |
| `C:\Users\poole\Documents\riptide-ria\agents\evaluator\CLAUDE.md` |
| `C:\Users\poole\Documents\riptide-ria\agents\synthesizer\CLAUDE.md` |

Terse, operator-facing: role, model, output schema, hard constraints, one per agent.
`docs\AGENTS.md` (full path above) is the narrative expansion of these six files.

## MCP integrations

| Full path | Notes |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\federal_register\client.py` | Public API, no key required |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\federal_register\server.py` | |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\notion_tracker\client.py` | |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\notion_tracker\writer.py` | The one place a real Notion write actually fires |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\notion_tracker\server.py` | |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\notion_tracker\verify_connection.py` | Pre-flight check script |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\google_drive\client.py` | `_BINARY_PARSERS` handles real `.docx`; PDF not yet handled |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\google_drive\server.py` | |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\gmail\client.py` | No standalone server — called directly from `synthesizer.py` |
| `C:\Users\poole\Documents\riptide-ria\mcp_servers\google_auth.py` | Shared OAuth flow behind both Drive and Gmail |
| `C:\Users\poole\Documents\riptide-ria\.mcp.json` | Registers federal-register / notion-tracker / google-drive as MCP servers Claude Code can call directly |

## Config

| Full path | In git? | What it is |
|---|---|---|
| `C:\Users\poole\Documents\riptide-ria\config\pipeline_config.json` | Yes | Agencies monitored, autonomy thresholds, spend ceiling |
| `C:\Users\poole\Documents\riptide-ria\config\logging.conf` | Yes | File+console logging setup (BOM bug fixed) |
| `C:\Users\poole\Documents\riptide-ria\config\riptide_template.docx` | Yes | Real branded Word template |
| `C:\Users\poole\Documents\riptide-ria\config\riptide_template.pptx` | Yes | Real branded PowerPoint template |
| `C:\Users\poole\Documents\riptide-ria\config\` (OAuth client-credentials file, matches `google_*.json`) | **No** | Downloaded from Google Cloud Console |
| `C:\Users\poole\Documents\riptide-ria\config\` (two OAuth token files, match `*_token.json`) | **No** | One per scope — Gmail send, Drive read |
| `C:\Users\poole\Documents\riptide-ria\.env` | **No** | Anthropic key, Notion token + IDs, model routing, token caps |
| `C:\Users\poole\Documents\riptide-ria\.env.example` | Yes | Every variable name, placeholder values only |

## Governance and CI

| Full path | What it enforces |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\.claude\settings.json` | Wires the 3 hooks below to the tool-call matchers they run on |
| `C:\Users\poole\Documents\riptide-ria\.claude\hooks\guard_secrets.py` | Blocks writing real secret values outside `.env` (this doc tripped it once — see Open items) |
| `C:\Users\poole\Documents\riptide-ria\.claude\hooks\guard_side_effects.py` | Blocks git pushes / mutating calls unless `RIA_EVALUATOR_APPROVED=1` |
| `C:\Users\poole\Documents\riptide-ria\.claude\hooks\audit_log.py` | Writes every tool call to `logs\audit.jsonl` |
| `C:\Users\poole\Documents\riptide-ria\.github\workflows\ci.yml` | Lint + unit tests every push/PR; live eval suite skips (not fails) if repo secrets are absent |

## Tests and evaluations

| Full path | What's in it |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\tests\unit\` | 10 files, offline, no API cost — what CI runs on every push (caching, classifier, evaluator, specialists, synthesizer, Notion client/writer, Gmail client, models, the hooks themselves) |
| `C:\Users\poole\Documents\riptide-ria\evaluations\` | Live, real API cost — `conftest.py`, `fixtures\`, one test file per stage. Where the jargon-scrub gap and conflicting-specialist-confidence behavior were actually proven |

## Real generated output — local only, not in git

| Full path | Contents |
|---|---|
| `C:\Users\poole\Documents\riptide-ria\outputs\docx\2026-13918.docx` | July 11 run |
| `C:\Users\poole\Documents\riptide-ria\outputs\docx\2026-14073.docx` | July 12 run (today) |
| `C:\Users\poole\Documents\riptide-ria\outputs\pptx\2026-13918.pptx` | July 11 run |
| `C:\Users\poole\Documents\riptide-ria\outputs\pptx\2026-14073.pptx` | July 12 run (today) |
| `C:\Users\poole\Documents\riptide-ria\logs\ria.log` | Full run log, one line per decision |
| `C:\Users\poole\Documents\riptide-ria\logs\audit.jsonl` | Every tool call, from the audit-log hook |

All fully populated, disclaimer confirmed present on both today's files.

## External systems and credentials — the real attack/audit surface

| System | Configured where | Credential lives | In git? |
|---|---|---|---|
| Anthropic API | `C:\Users\poole\Documents\riptide-ria\.env` | Same file | No |
| Notion (RIA Remediation Tracker) | `C:\Users\poole\Documents\riptide-ria\.env` | Same file | No |
| Google Drive (read-only policy docs) | `C:\Users\poole\Documents\riptide-ria\.env` (path variable) | OAuth credentials + Drive-scoped token, both in `C:\Users\poole\Documents\riptide-ria\config\` | No |
| Gmail (send-only, escalations) | `C:\Users\poole\Documents\riptide-ria\.env` (address variables) | Same OAuth credentials file + a separate Gmail-scoped token, both in `C:\Users\poole\Documents\riptide-ria\config\` | No |
| GitHub Actions secrets | Repo settings on github.com, not a local file | 3 secrets: Anthropic key, Notion key, Notion database ID | N/A |
| Federal Register API | `C:\Users\poole\Documents\riptide-ria\.env` (URL variable) | None — public, no auth | N/A |

Two independent gates stand between any of this and a real external write: the Evaluator's tier
decision, and `RIA_EVALUATOR_APPROVED` checked at the point of the actual network call — full
mechanics in `C:\Users\poole\Documents\riptide-ria\docs\ARCHITECTURE.md`.

## What's actually backed up on GitHub vs. local-only

Everything under version control is on GitHub as of commit `3012b3c` (confirmed synced,
`0 0` ahead/behind `origin/main`) — all source code, all of `docs\`, all tests/evals, CI
config, and this file once committed.

**Not on GitHub — lost if this machine is lost, unless backed up separately:**
- `C:\Users\poole\Documents\riptide-ria\.env`
- `C:\Users\poole\Documents\riptide-ria\config\` — the OAuth credential/token files specifically
- `C:\Users\poole\Documents\riptide-ria\outputs\` — regenerable by re-running the pipeline, not by git
- `C:\Users\poole\Documents\riptide-ria\logs\`

**Backed up separately, outside this repo entirely:**
- `C:\Users\poole\OneDrive\Desktop\RIA-Completion-Checklist.md` — OneDrive-synced, covered by OneDrive's own backup
- `C:\Users\poole\.claude\projects\C--Users-poole-Documents-riptide-ria\memory\MEMORY.md` (index) plus:
  - `C:\Users\poole\.claude\projects\C--Users-poole-Documents-riptide-ria\memory\feedback_direct_answers_no_preamble.md`
  - `C:\Users\poole\.claude\projects\C--Users-poole-Documents-riptide-ria\memory\prefers-config-over-code.md`
  - `C:\Users\poole\.claude\projects\C--Users-poole-Documents-riptide-ria\memory\riptide-ria-ccaf-showcase.md`
  - `C:\Users\poole\.claude\projects\C--Users-poole-Documents-riptide-ria\memory\values-live-verification-over-claims.md`
  - Not git- or OneDrive-backed — lives only on this machine's Claude Code config.
- Architecture diagram Artifact: `https://claude.ai/code/artifact/6d40a14e-0550-4518-92a1-e3fca090cb59` — hosted by Anthropic, independent of this machine. Its HTML source lives only in a temp session folder that isn't backed up; the published Artifact is the durable copy.

## Self-identified open items — for the red-team pass to verify or extend

Every item below is a real, already-known gap, not something surfacing for the first time
under review — pulled into one list so a second reviewer spends time confirming or extending
these rather than rediscovering them from scratch.

| Item | Status | Where it's already documented |
|---|---|---|
| Per-client data isolation (Notion, Drive, cost ceiling all single-tenant) | Not built — deliberate demo-scope decision | `C:\Users\poole\Documents\riptide-ria\docs\ARCHITECTURE.md` "Single-tenant by design" |
| Build-cost figure ($6-7 range) | Estimate, not verified against the Anthropic console | `C:\Users\poole\Documents\riptide-ria\docs\PROBLEM-SOLUTION.md` Cost section |
| PDF documents in Google Drive gap-analysis | Would hit the same binary-decode failure the `.docx` fix solved — no PDF parser exists yet | `C:\Users\poole\Documents\riptide-ria\docs\ARCHITECTURE.md` "Known constraints" |
| White-labeled/client-specific branded templates | Not built — Riptide-only branding today | `C:\Users\poole\Documents\riptide-ria\docs\RUNBOOK.md` section 4 |
| CI eval-suite gate skips (doesn't fail) when repo secrets are absent | Deliberate today, but a misconfigured/missing-secret state can't block a merge | `C:\Users\poole\Documents\riptide-ria\.github\workflows\ci.yml` inline comment |
| Key rotation for any of the credentials above | No plan or mechanism exists | Not documented anywhere yet |
| Adversarial testing of the governance hooks themselves | Unit-tested for intended behavior; not yet tested for bypass | Not documented anywhere yet |
| Formal threat model (adversary-by-adversary, not narrative) | Covered in prose across `DESIGN-DECISIONS.md`/`ARCHITECTURE.md`; no dedicated enumerated threat model exists | Not documented anywhere yet |
| Gmail test-send cleanup from earlier `gmail_probe.py` runs | Not confirmed cleaned up — not re-checked this session | Not documented anywhere yet |
