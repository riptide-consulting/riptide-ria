# Riptide RIA — Design Decisions Q&A

`docs/ARCHITECTURE.md` and `docs/AGENTS.md` describe what was built. This is the other half:
the questions a technical reviewer actually asks in a design review, and the direct,
specific answer — including the tradeoff, not just the choice.

---

**Q: Why split judgment (Opus) from the actual tier decision (a pure function) instead of just
trusting Opus's own structured output?**

Because "this agent cannot be bypassed under any circumstances" (root `CLAUDE.md`'s stated
rule for the Evaluator) is only a claim you can make if it's structurally true. A well-prompted
model is highly reliable — not *provably* reliable. Code is. `compute_tier()` takes Opus's
scores and applies fixed thresholds with hard overrides checked first; there is no path
through that function where the model's own confidence about its own authority matters. This
is a governance decision, not a comment on Opus's capability.

---

**Q: Why the Claude Agent SDK for the Evaluator specifically, and plain API calls everywhere
else?**

The Evaluator is the one stage that benefits from genuine multi-step agentic behavior —
deciding for itself whether to check precedent, how many times, and adjusting based on what it
finds. That's what the Agent SDK is for. Every other stage is a single, forced-tool-call
decision with no loop to run; reaching for the Agent SDK there would add latency and
complexity for a shape of problem that doesn't need it. Use the simplest surface that does the
job, not the most capable one everywhere.

---

**Q: Why forced tool-use with a strict schema for the Classifier and Synthesizer, but free-form
JSON with a retry loop for the three specialists?**

Forced tool-use is the more reliable pattern — it constrains output at the API level instead
of hoping a "return JSON" instruction is followed exactly. The specialists don't use it because
they share one cached document prefix across all three calls, and a per-specialist tool
definition would vary that prefix and break the cache-sharing that makes the analysis stage
cost roughly a third of what three independent full-document reads would cost. The specialists
trade the strict-schema guarantee for the caching benefit, and cover the gap with a
retry-on-invalid-JSON loop instead. Deliberate tradeoff, not an inconsistency.

---

**Q: Why is Drive context searched once and folded into the shared prefix, instead of giving
each specialist a live tool to search Drive itself?**

Same reason as the schema question above — a live tool varies the prefix per specialist and
breaks cache-sharing. It's also simply redundant: the search result for "internal policy
documents relevant to this agency" doesn't change based on which specialist is asking, so
three separate searches would be three times the Drive API calls for the identical answer.

---

**Q: No orchestration framework (LangGraph, etc.) — why plain Python control flow in `main.py`?**

The actual control flow here is a mostly-linear sequence with a small number of clear
conditional branches (does this route to a specialist, does this tier authorize a write). A
framework's value is in complex, cyclic, multi-path state machines — this pipeline isn't
shaped like that, and forcing it into one would add a dependency and an abstraction layer
that doesn't pay for itself. Plain control flow is more legible and more debuggable for a flow
this straightforward — the same reasoning that governs not adding an abstraction until the
shape of the problem actually needs one.

---

**Q: What's the actual worst case if a document successfully manipulates the Classifier or a
specialist despite the injection hardening?**

A bad classification or a bad specialist analysis — and that's the ceiling. The Evaluator's
score comes from its own independent read of the specialist output, not from anything the
classifier or specialists directly assert about their own trustworthiness, and the tier
decision is computed from the Evaluator's scores by code the model never touches. Manipulated
input could produce a *wrong* tier via genuinely bad analysis quality — it could not grant
itself `execute=True` outright. And even a tier authorizing a real action still requires the
separate, human-set `RIA_EVALUATOR_APPROVED` flag before anything external fires. Three
independent layers between "a document says something" and "something happens outside the
system" — not one prompt's worth of trust.

---

**Q: Why is local DOCX/PPTX generation ungated, but the Notion write and escalation email are?**

The gating boundary is drawn at "does this reach outside the system," not "is this
AI-generated." A local file write to the project's own output directory has no external blast
radius and is trivially reversible — delete the file. A Notion write reaches a third-party
system; an email genuinely cannot be unsent. Those get the approval gate; a file on disk
doesn't need one to be safe.

---

**Q: Why cap retries at 3 attempts with exponential backoff — is that actually enough?**

3 is root `CLAUDE.md`'s own stated operator policy ("maximum retry attempts: 3 per agent per
document"), not an arbitrary engineering choice — changing it is a policy decision, not a
tuning knob. Backoff (roughly 1s, then 2s between attempts) is enough to smooth over the
transient failures retries are actually for — a rate limit, a brief network blip — without
letting a genuinely broken call spin for a long time before surfacing as the real failure it
is. A call that still fails after 3 backed-off attempts is treated as a real failure, logged
with its exact error, not retried indefinitely.

---

**Q: How would you add a second data source beyond Federal Register?**

The rest of the pipeline — classify onward — depends only on the `RegulatoryDocument` model,
not on any Federal-Register-specific field. Adding a source means a new
`mcp_servers/<source>/client.py` following the same plain-client-plus-FastMCP-server pattern
already used for every other integration, mapping that source's documents into the same
`RegulatoryDocument` shape. Nothing downstream of ingestion would need to change.

---

**Q: How do you know a prompt change didn't quietly make things worse?**

The eval suite plus the CI gate exist for exactly this — root `CLAUDE.md`'s stated rule is
"prompt changes must pass the eval suite before merge," and as of today that's mechanically
enforced in CI, not just written down. It's not just schema-validity checks: one eval feeds
the Synthesizer deliberately jargon-dense input and asserts the output is actually plain
language; another feeds the Evaluator genuinely conflicting specialist input and asserts
confidence gets pulled down, not averaged. A prompt change that regressed either behavior
would fail a real assertion, not just "still returns valid JSON."
