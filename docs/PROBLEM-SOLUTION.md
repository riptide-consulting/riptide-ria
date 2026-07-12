# Riptide RIA — Problem, Solution, and Cost

## The problem

CMS and FDA publish a continuous stream of proposed rules, final rules, and notices through
the Federal Register — often with tight windows attached (a 30-day comment period, a 15-day
corrective-action deadline after an enforcement notice). For a healthcare organization, three
things have to happen for each one, fast and correctly:

1. **Triage** — is this urgent, or routine? Does it even apply to us?
2. **Analysis** — how material is it, what internal processes does it actually touch, and
   where are we exposed relative to what it requires?
3. **Action** — who owns the response, what has to change, and by when?

Today this is done by regulatory affairs staff or outside counsel, reading filings and
assessing them individually. It's slow relative to the deadlines involved, inconsistent
(quality depends on which reviewer caught it and how much time they had), and expensive to
scale — mid-market organizations in particular can't staff a large in-house team to keep pace
with regulatory output that doesn't slow down. Missing or underestimating the wrong filing
has real consequences: compliance gaps, enforcement exposure, operational disruption.

The tension is that this needs to be both **fast** and **rigorous** at once, and manual review
alone struggles to deliver both.

## The solution

An AI-driven pipeline that continuously ingests CMS/FDA filings, triages them by urgency, runs
a chain of specialized analysis agents (materiality, operational impact, compliance gaps),
scores the result against a governed autonomy framework, and produces a human-reviewable
briefing — a real DOCX and PPTX, not just a summary email — with a due-dated remediation plan.

This is deliberately **not** "AI replaces the compliance function." It's AI doing the
first-pass triage and analysis at a speed and consistency no manual process can match, with a
governance architecture that keeps a human in the loop for anything consequential. Every
generated briefing says so explicitly: *"AI-assisted analysis. Not legal advice. Requires
human review before any compliance action is taken."*

### What actually makes this defensible, not just fast

- **The autonomy decision is enforced in code, not asserted by the model.** Claude scores
  quality and confidence; a separate, pure deterministic function decides the tier. The model
  is never in a position to grant itself authority to act. See `docs/ARCHITECTURE.md`.
- **External content is never trusted as instructions.** Every regulatory filing and internal
  policy document this pipeline reads is untrusted input by design, explicitly walled off from
  the instructions governing the agents that read it — live-verified against an actual
  injection attempt embedded in a test document, not just assumed safe.
- **Nothing external happens without a human explicitly approving it.** Writing to a tracking
  system or sending an escalation email requires an explicit operator approval flag, checked
  independently in two places, regardless of what the pipeline itself decided.
- **Every mechanism here has been run against real APIs, not just unit-tested.** Ingestion,
  analysis, governance, output generation — all proven live, including two full end-to-end
  runs against real, current regulatory filings.

## Cost

### To run (per document, full pipeline)

**~$0.59** for one document through the complete pipeline — classification, all three
analysis specialists, the governance evaluation, and the final briefing generation (DOCX +
PPTX). This is a real, measured number from two independent live runs today ($0.587 and
$0.5870), not an estimate. A configurable spend ceiling (`config/pipeline_config.json`,
default $10 per run) stops any batch from running away regardless of document count.

### To build

**Confirmed at $3.99** as of a mid-build checkpoint today, scoped precisely to this project's
own API key. Substantial additional work happened after that checkpoint — hardening,
live-verified prompt-injection testing, a full live eval assessment, two additional full
pipeline runs — bringing the real total higher; **the authoritative current number needs one
more console check** (`console.anthropic.com`, Cost page, filtered to the
`Regulatory Agent Demo` key) before it goes in front of anyone external. Rough reconstruction
from what's been directly observed and logged this session puts it in the **$6-7 range
total**, but that's a estimate, not a verified figure — don't quote it externally until
confirmed.

### Build scope, for context

33 commits, 3 days (July 10-12, 2026), 79 source files, ~4,400 lines of Python, 94 offline
tests plus 7 live model-quality evals — built end-to-end including ingestion, a 3-stage
analysis chain, a governed autonomy decision, real MCP integrations (Notion, Gmail, Google
Drive), a CI pipeline with an enforced eval gate, and real branded output generation.
