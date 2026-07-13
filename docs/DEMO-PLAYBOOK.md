# Riptide RIA — Client Demo Playbook

This is for you, specifically, the moment before and during a live demo. `docs/RUNBOOK.md` is
the technical operator reference; this is the rehearsed procedure so nothing surprises you in
front of someone.

**Golden rule: never run this live for the first time in front of a client.** Everything below
assumes you did a full dry run recently enough to know what you'll see.

---

## The night before (or morning of)

1. **Do a real dry run**, start to finish:
   ```
   run_demo.bat 1
   ```
   This is not optional. It confirms the pipeline actually works *right now* (not "worked last
   time you checked"), and it generates a real docx/pptx you keep as a backup — see step 3.

2. **Pre-flight check**, if the dry run above didn't already tell you something's wrong:
   ```
   .venv\Scripts\python.exe -c "from ria.settings import get_settings; get_settings(); print('settings OK')"
   ```
   Fails loudly and names the missing piece if any credential is absent.

3. **Copy the dry run's output files somewhere you can find them without the pipeline
   running** — `outputs\docx\<doc-number>.docx` and the matching `.pptx`. This is your backup
   if wifi at the venue is bad or slow: *"here's a completed run"* is a perfectly good fallback
   line, and nobody needs to know it wasn't generated in that exact minute.

4. **Check your spend ceiling isn't already half-spent** from other testing —
   `config/pipeline_config.json`'s `pipeline.max_spend_usd` (default $10). One real demo run
   costs about $0.59; you have room, but don't walk in with $9.50 already spent this month on
   unrelated testing.

5. Have `docs/PROBLEM-SOLUTION.md`, the architecture diagram, and this repo open in tabs/windows
   *before* anyone sits down. Don't search for them live.

## Five minutes before

- Close anything unrelated — Slack, personal tabs, notifications. Basic hygiene, easy to forget.
- Confirm wifi actually works, not just that it's connected.
- Have a terminal open, already `cd`'d into the project directory.

---

## The live sequence

**Total time: about 4.5 minutes for the pipeline to run** (measured from a real run today:
4 min 27 sec end to end). Don't stand there watching a terminal in silence — narrate. The
timing below is real, not estimated, so you know what's happening at each point without
having to check.

### 1. Open with the problem, not the code (1-2 min)

Don't start by opening a terminal. Start with why this exists: CMS/FDA publish continuously,
tight deadlines are attached, manual review doesn't scale, and getting it wrong is expensive.
`docs/PROBLEM-SOLUTION.md` has this written out if you want to read from it directly.

### 2. Show the architecture diagram (1-2 min)

Give them the five-stage shape before they see a terminal scroll by — it's much easier to
follow a live run once they already know what they're looking at. The one thing worth making
sure lands: **Claude scores, code decides.** The Evaluator never gets to grant itself
authority to act — that's the one sentence that separates this from "we called an API."

### 3. Start the run, narrate while it works

```
run_demo.bat 1
```

What's actually happening, in order, so you can talk through it instead of standing in silence:

| Time (from start) | Stage | What to say |
|---|---|---|
| 0:00 - 0:05 | Classify | "Routing this to the right specialists and scoring urgency." |
| 0:05 - 1:10 | Analyze | "Three independent analyses — materiality, process impact, compliance gaps — sharing one cached read of the document." |
| 1:10 - 4:00 | Evaluate | **The longest wait — use it.** This is where you explain the trust boundary in detail: Opus scores quality and confidence; a separate, deterministic function computes the actual tier. Mention the live tool call happening (a real precedent lookup against past decisions) if you want to show it's genuinely agentic, not scripted. |
| 4:00 - 4:27 | Synthesize | "Generating the briefing now — a real branded document, not a summary email." |

**Be upfront that this pulls a real, live document** from whatever CMS/FDA published recently
— you don't control which one. If it's a big enforcement action, that's a strong demo. If it's
routine, say so plainly: *"this one turned out to be routine, and the system correctly scored
it low-priority instead of manufacturing urgency that isn't there"* — that's also a real
demonstration of the system working correctly, not a weak result.

### 4. Open the real output

Open the generated `.docx` and `.pptx` from `outputs\docx\` / `outputs\pptx\`. Point out:
- The disclaimer at the top — this isn't hidden, it's the honest framing of what this is.
- The remediation plan table — real due dates, computed from today's date, not placeholders.
- The branding — this is a finished deliverable, not a debug printout.

### 5. Mention, don't necessarily trigger, the gated actions

The Notion write and escalation email are real, and they're gated behind an explicit approval
flag you didn't set for this run — that's why nothing external fired. You can say so directly
rather than demonstrating it live: triggering real side effects live adds risk (what if this
particular document doesn't qualify) for very little added impact. The disclaimer and the
"nothing happens without approval" story land fine as description.

---

## If something goes wrong

- **Wifi is bad or the run is slow/hangs**: stop, don't apologize repeatedly, switch to *"let
  me show you a completed run"* and open your pre-saved backup files from the night before.
- **A document genuinely fails partway through**: the pipeline is built to keep going past a
  single failure now — if you're running more than one document, the others still complete.
  If your one demo document fails, that's what the backup files are for.
- **The result looks unimpressive** (routine document, low priority): say so honestly, per
  step 3 above. Don't oversell a routine result as urgent — a client who later sees the real
  system correctly downgrade something will trust it more for having watched it *not*
  overreact once.

---

## Likely questions, honest answers ready

- **"Is this production-ready?"** — No, and don't imply otherwise. This is a capability
  demonstration: it proves Riptide can build real, governed multi-agent systems. Making it
  handle a real client's real data safely is real, scoped, additional work — `docs/ARCHITECTURE.md`
  names exactly what that work is (per-client data isolation, mainly).
- **"What does this cost?"** — ~$0.59 per document to run, measured, not estimated. Build cost
  is in `docs/PROBLEM-SOLUTION.md`, flagged honestly where it's still an estimate.
- **"Is our data safe?"** — Point to `docs/DATA-HANDLING.md`. Current state is single-tenant
  (one shared tracker/Drive) because there's no real client data in it yet — say that plainly,
  it's a demo-scope decision, not an oversight, and the doc says exactly what changes before
  it wouldn't be.
- **"Why no pull requests in the git history?"** — Solo capability build, not a team
  engagement; direct-to-main with a CI gate on every push is the right practice for that
  phase. Verification happened continuously and live throughout the build instead of batched
  into an end-of-PR review — arguably more rigorous, just via a different mechanism.
- **"Can it be wrong?"** — Yes, and that's exactly why every output says so. It's a
  probabilistic system; the honest target isn't "never wrong," it's "well-tested, the failure
  modes are known and guarded, and human review is required before anything acts on it." The
  jargon-scrub story (a live eval caught the model slipping legal jargon into plain-language
  output some of the time, so it's now enforced in code afterward) is a good concrete example
  if it comes up — it shows the process catches its own gaps rather than assuming compliance.
