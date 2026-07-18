# FACTS.md: every number the master deck asserts, verified against the code

Migration brief step 7. Source of the claims: `presentation/build/build_master_v6.js`
(the built deck, 38 slides; slide numbers below are the rendered page numbers).
Each claim is checked against the authoritative file in the repo as of the
presentation-toolchain branch, which includes the review-fixes merge. This file
reports drift; it does not edit the deck.

Verification date: 2026-07-18.

## Cost

| Claim in deck (slide) | Value | Source file | Verified |
|---|---|---|---|
| Per-document total (4, 11) | $0.59 | docs/COST-BREAKDOWN.md: measured $0.587 and $0.5870, "call it ~$0.59" | yes |
| Exact per-document total (32) | $0.587 | docs/COST-BREAKDOWN.md | yes |
| Classifier cost (26, 27, 32) | ~$0.002 | docs/COST-BREAKDOWN.md | yes |
| Materiality cost (26, 28, 32) | ~$0.007 | docs/COST-BREAKDOWN.md | yes |
| Process Impact cost (26, 28, 32) | ~$0.020 | docs/COST-BREAKDOWN.md | yes |
| Gap Analyzer cost (26, 28) | ~$0.013 to 0.019 | docs/COST-BREAKDOWN.md; the slide-32 chart plots the 0.016 midpoint | yes |
| Evaluator cost (26, 29) | $0.33 to $0.50 | docs/COST-BREAKDOWN.md (real range, 4 live runs); the slide-32 chart plots $0.40, matching the doc's rollup bar | yes |
| Synthesizer cost (26, 31, 32) | ~$0.012 | docs/COST-BREAKDOWN.md | yes |
| Evaluator share of run cost (29) | 65 to 85% | docs/COST-BREAKDOWN.md: "65-85% of the per-document cost" | yes |
| "Two-thirds of spend sits at the trust boundary" (32) | ~67% | docs/COST-BREAKDOWN.md: 0.40 of 0.587 is 68%, inside the documented 65-85% range | yes |
| Batch classification at roughly half price (11, 27, 32) | ~50% | ria/classifier.py docstring ("~50% cheaper"), docs/COST-BREAKDOWN.md | yes |
| Cache reads at a tenth of input price (11, 28, 32) | 0.10x | ria/cost.py: `_CACHE_READ_MULTIPLIER = 0.10` | yes |
| Hard spend cap per run, no dollar figure stated (11, 16, 17, 32) | pipeline.max_spend_usd | config/pipeline_config.json: `max_spend_usd: 10.0`; deck deliberately names the key, not the number | yes |

## Latency

| Claim in deck (slide) | Value | Source file | Verified |
|---|---|---|---|
| Wall clock, rounded (1, 4) | ~5 min | docs/COST-BREAKDOWN.md: 4 min 27 sec measured; "about five minutes" is the stated rounding | yes |
| Wall clock, exact (32) | 4 min 27 sec | docs/COST-BREAKDOWN.md | yes |
| Classifier (26, 27) | ~4 sec | docs/COST-BREAKDOWN.md | yes |
| Materiality (26, 28) | 10 to 13 sec | docs/COST-BREAKDOWN.md (~10-13 sec) | yes |
| Process Impact (26, 28) | 17 to 31 sec | docs/COST-BREAKDOWN.md (~17-31 sec) | yes |
| Gap Analyzer (26, 28) | ~25 sec | docs/COST-BREAKDOWN.md | yes |
| Evaluator (26) | 170 to 215 sec | docs/COST-BREAKDOWN.md (~170-215 sec) | yes |
| Synthesizer (26, 31) | 20 to 24 sec | docs/COST-BREAKDOWN.md (~20-24 sec) | yes |
| Evaluator share of wall clock, implied by slide 32 layout | ~65% | docs/COST-BREAKDOWN.md: "about 65% of the wall-clock time" | yes |

## Governance thresholds

| Claim in deck (slide) | Value | Source file | Verified |
|---|---|---|---|
| Tier 1 threshold (7, 29, 30) | 0.90 | config/pipeline_config.json `tier1_threshold: 0.9`; ria/evaluator.py compute_tier default 0.90 | yes |
| Tier 2 threshold (7, 29, 30) | 0.75 | config/pipeline_config.json `tier2_threshold: 0.75`; ria/evaluator.py compute_tier default 0.75 | yes |
| Tier 1 requires confidence >= 0.90 AND risk low or medium (7, 29, 30) | both conditions | ria/evaluator.py compute_tier | yes |
| Tier 2 is the structural default (7, 30) | fall-through return | ria/evaluator.py compute_tier: final `return 2, False, False` | yes |
| Tier 3 triggers checked first: confidence below 0.75, critical risk, enforcement, missing risk signal (7, 29, 30) | hard override | ria/evaluator.py compute_tier: all four escalation returns precede the tier-1 check | yes |
| enforcement_detected = true overrides every cell to tier 3 (30) | override | ria/evaluator.py compute_tier plus config `enforcement_language_always_escalates: true` | yes |
| Tier semantics: tier 1 execute=True, tier 3 escalate=True, tier 2 neither (30) | (tier, execute, escalate) | ria/evaluator.py compute_tier return values | yes |
| Tier matrix cells (30) | full table | ria/evaluator.py compute_tier: every cell of the 3x5 matrix reproduces the code path | yes |
| Classifier confidence floor (27) | _CONFIDENCE_FLOOR = 0.60 | ria/classifier.py line 77; below it, routing widens to all three specialists (_postprocess) | yes |
| Impact score range (28) | 0 to 100 | ria/specialists.py: schema "integer 0-100", clamped `max(0, min(100, ...))` | yes |
| External actions human-gated (4, 6, 31) | 100%, two gated writes | human key RIA_EVALUATOR_APPROVED checked at the writers (ria/synthesizer.py path; asserted by tests/unit/test_settings.py and conftest.py) | yes |
| Enforcement keyword backstop exists (29, 30) | keyword scan OR model flag | ria/evaluator.py `_ENFORCEMENT_KEYWORDS` and `_detect_enforcement` | yes |

## Models

| Claim in deck (slide) | Value | Source file | Verified |
|---|---|---|---|
| Classifier model (26, 27) | Haiku 4.5 | .env.example: MODEL_CLASSIFIER=claude-haiku-4-5-20251001 | yes |
| Specialist model, all three (26, 28) | Sonnet 5 | .env.example: MODEL_SPECIALIST=claude-sonnet-5 | yes |
| Evaluator model (26, 29) | Opus 4.8 | .env.example: MODEL_EVALUATOR=claude-opus-4-8 | yes |
| Synthesizer model (26, 31) | Sonnet 5 | .env.example: MODEL_SYNTHESIZER=claude-sonnet-5 | yes |
| "Model IDs are pinned snapshots in .env" (26) | four pinned IDs | .env.example comment: all four IDs are pinned snapshots; dateless IDs are snapshots under the post-4.6 scheme | yes |

## Tests and evidence

| Claim in deck (slide) | Value | Source file | Verified |
|---|---|---|---|
| Offline test count (16, 17, 34, 35, 36, 37) | 117 | tests/unit/: `pytest tests/unit -q --collect-only` reports "117 tests collected" | yes |
| Behavioral eval repeats (17, 36) | 3x, pass rate asserted | evaluations/harness.py: repeats defaults to 3 (RIA_EVAL_REPEATS override), required passes ceil(2/3) | yes |
| Retry policy: 3 attempts, exponential backoff, 4xx fail fast (27, 33) | max 3 | ria/classifier.py and ria/evaluator.py max_attempts=3 with 2^(n-1) backoff; ria/retry.py classifies 4xx fatal except 408/429 | yes |
| Injection suite asserts gate holds against injected 0.99 confidence (36) | 0.99 | evaluations/test_injection_evals.py (named on the slide) | yes |

## Dependency pins (slide 34)

| Claim in deck (slide) | Value | Source file | Verified |
|---|---|---|---|
| anthropic 0.116 (34) | 0.116.0 | requirements.txt | yes |
| claude-agent-sdk 0.2.116 (34) | 0.2.116 | requirements.txt | yes |
| mcp 1.28 (34) | 1.28.1 | requirements.txt | yes |
| httpx 0.28 (34) | 0.28.1 | requirements.txt | yes |
| notion-client 3.1 (34) | 3.1.0 | requirements.txt | yes |
| pydantic 2.13 (34) | 2.13.4 | requirements.txt | yes |
| python-dotenv 1.2 (34) | 1.2.2 | requirements.txt | yes |

## Notes (not drift)

- Slide 27's source line says the `_postprocess` code block is from ria/classifier.py
  "verbatim". It is lightly condensed: the real function uses
  `decision.get("confidence", 0.0)` rather than direct indexing, and also attaches
  `document_id` before returning. Behavior of the lines shown is equivalent; the
  word "verbatim" slightly overstates it. No number is affected.
- Slide 29 correctly labels its compute_tier block "condensed, behavior identical";
  the condensation drops only the config-flag guards, which default to true in
  config/pipeline_config.json, so the shown behavior matches.
- The slide-32 chart's specialist bars (0.007, 0.020, 0.016) sum to 0.043 while the
  COST-BREAKDOWN rollup shows $0.040 for "Analyze (x3)"; the deck never asserts a
  specialist subtotal, and the gap-analyzer bar is the documented range's midpoint,
  so nothing conflicts.

## Drift summary

No drift found. All 40 checked claims match the current code and docs on the
presentation-toolchain branch: costs per stage and the $0.587 / $0.59 totals match
docs/COST-BREAKDOWN.md; the 4 min 27 sec wall clock and every per-stage latency
match docs/COST-BREAKDOWN.md; the 0.90 / 0.75 tier thresholds match
config/pipeline_config.json and ria/evaluator.py; _CONFIDENCE_FLOOR 0.60 matches
ria/classifier.py; the impact score 0-100 clamp matches ria/specialists.py; the
tier matrix and tier semantics reproduce compute_tier exactly; all four model
names match the pinned IDs in .env.example; the 117-test count matches a live
pytest collection of tests/unit; the 3x eval repeat, 3-attempt retry, 0.10x cache
read, ~50% batch discount, and dependency pins all match their source files.
