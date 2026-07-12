# Riptide RIA — Data Handling

Written for a prospective or engaged client to read directly. Describes where document
content actually goes when this pipeline runs, in plain terms.

## Current status

**As of this writing, Riptide RIA is a capability demonstration.** No client's real
regulatory or compliance data has been run through it. Everything below describes exactly
how the system behaves today, and what Riptide would commit to before running it against a
real client's data.

## What happens to a document when the pipeline runs

1. **The regulatory filing itself** (from the Federal Register, or a client-provided document)
   is sent to Anthropic's API for classification and analysis. This is the same as any other
   use of Claude's API — see Anthropic's own data usage policy for exactly what Anthropic
   does and doesn't do with API traffic (as a baseline: Anthropic does not train its models on
   API customer data by default). Riptide does not control Anthropic's retention policy; we
   can share the current terms on request before any engagement starts.
2. **Any internal policy or procedure document a client provides** for gap analysis is
   likewise sent to Anthropic's API as part of that analysis, and is stored in Riptide's own
   Google Drive (today, Riptide's own account — see "Single-tenant today" below).
3. **The output** — a risk/gap analysis, a remediation plan, and a compliance briefing
   (DOCX/PPTX) — is generated and, where the analysis warrants it, written to Riptide's
   internal Notion tracker and can trigger an internal escalation email. Neither of those two
   actions ever happens automatically without an operator explicitly approving it
   (`RIA_EVALUATOR_APPROVED`, see `docs/ARCHITECTURE.md`).

## Who has access

Today: whoever has access to Riptide's own Anthropic account, Notion workspace, and Google
Drive/Gmail — the same access boundary as any other internal Riptide tool. No client login,
no client-facing dashboard; a client receives the generated briefing as a deliverable, not
system access.

## Single-tenant today

There is currently one shared Notion tracker and one shared Drive account for the whole
system — not split per client. That's a deliberate scope decision for a demo with no real
client data in it (see `docs/ARCHITECTURE.md`'s "Single-tenant by design" section for the
full reasoning and what production would require). **Before any real client engagement**,
Riptide would stand up a client-specific tracker and Drive scope so one client's data is
never reachable while working on another's.

## What every generated briefing already says

Every DOCX and PPTX this pipeline produces carries this notice: *"AI-assisted analysis. Not
legal advice. Requires human review before any compliance action is taken."* The analysis is
a starting point for a human reviewer, not a substitute for one.
