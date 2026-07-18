# Riptide RIA: Cost & Runtime Breakdown

Every number below is measured from real, live API calls made today, not estimated in
advance and not a vendor rate card applied to a guess. Where a number varies by document
(mainly the Evaluator), the real observed range is shown instead of a single false-precision
figure. Source data: `evaluations/` live test runs and two complete end-to-end pipeline runs
against real Federal Register documents.

## Per-agent: model choice, cost, and time

| Stage | Model | Why this model | Cost per call | Time per call |
|---|---|---|---|---|
| **Classifier** | Haiku 4.5 | Routing is a narrow, bounded decision (does this document match specialist criteria) not deep analysis. Runs on *every* document unconditionally, so it's the one stage where call volume makes the cheapest capable tier the right default. | **~$0.002** | **~4 sec** |
| **Materiality** | Sonnet 5 | Judging real-world significance needs genuine reasoning, not pattern-matching. | **~$0.007** | **~10-13 sec** |
| **Process Impact** | Sonnet 5 | Mapping a regulation to specific internal workflows and owners is the most open-ended of the three specialist tasks; reflected in it being the most expensive specialist call. | **~$0.020** | **~17-31 sec** |
| **Gap Analyzer** | Sonnet 5 | Comparing regulatory requirements against internal documentation for real gaps; same reasoning tier as the other two specialists, run independently over the same cached document. | **~$0.013-0.019** | **~25 sec** |
| **Evaluator** | Opus 4.8 | **The one deliberately expensive stage.** This is the trust boundary; the single decision that determines whether anything auto-executes. It's also genuinely agentic: it decides for itself whether and how many times to call a live precedent-lookup tool before answering, which is real reasoning work a cheaper model does less reliably. Every other stage uses a cheaper tier precisely so the budget can concentrate here, where judgment quality has the highest consequence. | **$0.33 to $0.50** (real range, 4 live runs) | **~170-215 sec** |
| **Synthesizer** | Sonnet 5 | Writing a clear, well-organized briefing from already-analyzed input is squarely in Sonnet's range; doesn't need Opus-level judgment, the hard analytical work already happened upstream. | **~$0.012** | **~20-24 sec** |

**The Evaluator is 65-85% of the per-document cost and about 65% of the wall-clock time.**
That's the deliberate design, not an inefficiency to fix; see `docs/DESIGN-DECISIONS.md` for
the direct case for spending the budget there specifically.

## Rolled up: one document, full pipeline

**Real, measured totals from two complete live runs today: $0.587 and $0.5870.**

Call it **~$0.59 per document**, ingest through a finished, template-based DOCX and PPTX. Wall clock:
**4 minutes 27 seconds**, measured end to end on the second run.

```
Classify        $0.002   |####                                              |  4s
Analyze (x3)    $0.040   |########                                          |  66s
Evaluate        $0.40    |################################                  |  170s
Synthesize      $0.012   |###                                               |  24s
                -------
                ~$0.59              total: 4 min 27 sec
```

(Bar widths are illustrative of proportion, not to scale precisely; the point is Evaluate
dominates both cost and time, by design.)

## What changes the number

- **Routing.** A document the Classifier sends to only one or two specialists (not all three)
  costs less than the worst case above; the specialist total isn't fixed, it's the sum of
  whichever ones actually ran.
- **Document complexity.** The Evaluator's cost tracks how much reasoning and how many
  precedent-lookup tool calls a document actually warrants; a straightforward routine notice
  costs less than a document with real ambiguity or enforcement history to check.
- **Cache reuse within a run.** The three specialists share one cached document read; the 2nd
  and 3rd specialist read the cache instead of re-paying full price for the document text.
  Across documents in the *same* run, the classifier's system prompt is also cached.
- **Batch classification.** `--batch` runs classification through the Anthropic Batches API
  instead of one call per document; about half the classifier's per-document cost, at the
  cost of async/polling latency instead of an immediate result. Not used for the other stages,
  since each depends on that specific document's own prior-stage output.

## Run-level ceiling, independent of any single document's cost

`config/pipeline_config.json`'s `pipeline.max_spend_usd` (default $10) caps a whole run's
*cumulative* real spend, checked between documents, not a per-document limit, a backstop
against a large batch running away regardless of how expensive any individual document turns
out to be.

## Build cost (distinct from run cost: see `docs/PROBLEM-SOLUTION.md`)

Run cost (above) is what it costs to *use* the finished pipeline. Build cost; what it cost in
API spend to *develop* it; is a separate, one-time number, covered in
`docs/PROBLEM-SOLUTION.md`'s Cost section, including the honest caveat on why that figure
still needs one more console check before being quoted externally.
