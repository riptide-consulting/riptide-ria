# Riptide RIA — Architecture

`scratchpad/scratchpad.md` is the complete, chronological build log — decisions, dead ends,
what's been proven live. This document distills the parts of it that matter for understanding
the system, not for re-living how it was built.

## Pipeline

```
ingest (Federal Register) -> classify (Haiku) -> analyze (3 Sonnet specialists, chained
over one cached document) -> evaluate (Opus, Agent SDK, autonomy tier) -> synthesize
(Sonnet briefing + DOCX/PPTX, and where authorized: a Notion record and/or an escalation email)
```

Each stage is a separate flag on `main.py` (see README). Nothing past `classify` runs unless
requested, and nothing writes anywhere external unless both the Evaluator's decision *and* an
explicit operator approval say so.

## The trust boundary: how autonomy decisions actually get made

Root `CLAUDE.md` defines four autonomy tiers by confidence and risk. The critical design
choice: **the tier number is never something the model asserts on its own.**

`ria/evaluator.py` splits the decision in two:
- Opus (via the Claude Agent SDK) supplies *judgment* — quality scores per specialist,
  overall confidence, a risk level, an enforcement-language flag. It has exactly one live
  tool (Notion precedent lookup) and no ability to write anything.
- `compute_tier()` is a pure, deterministic function that turns those scores into tier 1/2/3.
  It reads `config/pipeline_config.json`'s `tier1_threshold`/`tier2_threshold`, and applies
  hard overrides *before* the threshold check: confidence below tier2, critical risk, or
  enforcement language detected all force tier 3 regardless of what Opus scored. Root
  `CLAUDE.md` states the Evaluator "cannot be bypassed under any circumstances" — this is
  the code that makes that literally true rather than a prompt instruction that could drift.

This same proposes-then-code-disposes pattern repeats at every stage: the classifier's
confidence floor (`_CONFIDENCE_FLOOR` in `ria/classifier.py`) forces full specialist routing
below 0.60 regardless of what the model claims; each specialist's `_postprocess_*` function in
`ria/specialists.py` enforces its own agent's hard constraints in code (materiality forces
`critical` above impact 80; gap_analyzer never lets a PHI/patient-safety gap stay `low`).

## Governance enforcement: two independent layers

`RIA_EVALUATOR_APPROVED` is checked in two places that don't know about each other:

1. **`.claude/hooks/guard_side_effects.py`** — blocks git pushes and mutating tool calls run
   *through Claude Code* without the flag set.
2. **The pipeline's own write functions** (`mcp_servers/notion_tracker/writer.py`,
   `mcp_servers/gmail/client.py`) — check the same env var at the point of the actual network
   call, independent of whether Claude Code is involved at all.

This is deliberate defense in depth: layer 2 is what actually matters, since the pipeline
runs standalone (e.g. `python main.py`, or eventually a cron job) with no hook watching it.
Layer 1 catches accidental side effects specifically when working *through* Claude Code.

DOCX/PPTX generation in `ria/synthesizer.py` is explicitly *not* gated by this flag — writing
a file to the local `outputs/` directory isn't an external side effect. Only the Notion write
and the escalation email are.

## Prompt caching: why 3 specialists share one prefix

`ria/caching.py`'s `cached_document_prefix()` builds three content blocks (header, full
document text, Drive context), with the cache breakpoint on the *last* block. Each specialist's
question goes after the breakpoint. Anthropic's cache matching requires the whole prefix —
tools, system, and messages up to the breakpoint — to be byte-identical, which is why:

- The specialist calls carry no system prompt and no tools. A per-specialist live tool would
  vary the prefix per specialist and break cache-sharing across all three.
- Google Drive context (Phase 3) was folded into the shared prefix as a third block, rather
  than given to each specialist as its own tool call, for the same reason.
- The prefix always states explicitly whether Drive found anything ("no matching documents
  were found" vs. real content) — specialists never have to guess whether Drive was checked.

First specialist call writes the cache; the next two read it (`cache_read_input_tokens > 0`
in the logs is the live signal this is actually working, not just correctly configured).

## Known constraints worth knowing before extending this

- **`python-pptx` cannot add shapes to a slide layout or master via its public API** — only to
  an actual slide. `layout.shapes.add_textbox()` / `add_picture()` / `add_shape()` don't exist;
  only `SlideShapes` (real slides) has them. Branding baked into a *reusable* PowerPoint
  template (logos, dividers, background images on the layout itself, not just background color
  and placeholder text formatting) requires either low-level XML construction against the
  layout's `spTree`, or doing the edit directly in PowerPoint (which has no such restriction).
  `config/riptide_template.pptx` was built the low-level-XML way.
- **Google Drive's `fetch_document_text` only exports Google-native formats** (Docs/Sheets/
  Slides) to plain text automatically. A real uploaded `.docx` decodes as UTF-8 with
  `errors="ignore"` unless its mimetype has an explicit parser in `_BINARY_PARSERS` — without
  one, this doesn't error, it silently returns the file's raw ZIP bytes as mojibake. Currently
  handled for real `.docx` uploads (via `python-docx`); a PDF would hit the same failure mode
  and needs the same treatment before anything real is staged in that format.
- **Claude Agent SDK's `query()` async generator must be allowed to finish its own loop** —
  returning early from inside `async for message in query(...)` on seeing a `ResultMessage`
  races the SDK's internal cleanup. Collect into a variable and let the loop end naturally.
- **A cached token's scope is fixed at consent time** — Gmail (`gmail.send`) and Drive
  (`drive.readonly`) needed separate token files (`mcp_servers/gmail/client.py` /
  `mcp_servers/google_drive/client.py`) sharing one client-credentials file, not one shared
  token, because a token is only valid for the exact scopes it was granted under.

## Project structure

```
main.py                    headless pipeline entrypoint
*_probe.py                 live proof scripts for each major mechanism -- run standalone
ria/                        core pipeline: settings, models, classifier, specialists, caching,
                            evaluator, synthesizer, logging
mcp_servers/                one subpackage per integration, each a plain client.py + a real
                            FastMCP server.py -- see .mcp.json for registration
agents/<name>/CLAUDE.md     each agent's scoped role, model, output schema, constraints
.claude/hooks/               governance enforcement (see above)
config/                     pipeline_config.json, logging.conf, branded templates
tests/unit/                 offline tests, no live API calls -- what CI runs
evaluations/                live prompt-quality evals, real API cost -- run manually or in CI
                            once the required secrets are configured (see README)
docs/ARCHITECTURE.md        this file
scratchpad/scratchpad.md    the full chronological build log
```
