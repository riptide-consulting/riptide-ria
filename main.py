"""Riptide RIA pipeline entrypoint (headless).

Phase 1: ingest recent CMS/FDA documents and route each through the Classifier.
Phase 2: optionally run the routed specialists (materiality / process_impact /
gap_analyzer) over the cached full document text, then optionally the Evaluator
(Opus, Agent SDK) to score that analysis into an autonomy-tier decision. This is the
CCAF "headless vs interactive" surface -- the ``-p`` flag makes it pipe-friendly
(JSON lines to stdout) for batch/cron use.

    python main.py                  # ingest, classify, print a routing table
    python main.py -p               # headless: one JSON object per line to stdout
    python main.py --limit 5        # cap how many documents are classified
    python main.py --batch          # classify via the Anthropic Batches API (cheaper, async)
    python main.py --analyze        # also run routed specialists (Sonnet; costs more)
    python main.py --evaluate       # also run the Evaluator (Opus; implies --analyze)
    python main.py --synthesize     # also run the Synthesizer -- briefing + DOCX/PPTX for
                                     # every evaluated document (implies --evaluate); the
                                     # Notion write and escalation email it can additionally
                                     # trigger are REAL external side effects, refused unless
                                     # RIA_EVALUATOR_APPROVED=1 is set in the environment

Note: DOCX/PPTX generation always happens once a document is synthesized -- that's a local
file write, not an external side effect. The Notion write (execute=True) and escalation
email (escalate=True) it can additionally trigger are separately gated and require
RIA_EVALUATOR_APPROVED=1, independent of each other.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from mcp_servers.federal_register.client import fetch_full_text, fetch_recent_documents
from ria.classifier import classify, classify_batch
from ria.cost import estimate_cost
from ria.evaluator import evaluate
from ria.logging_setup import log_event, setup_logging
from ria.settings import get_settings
from ria.specialists import run_all_specialists
from ria.synthesizer import synthesize


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Riptide RIA pipeline (ingest, classify, analyze/evaluate/synthesize)")
    parser.add_argument("-p", "--headless", action="store_true", help="emit JSONL to stdout (pipe-friendly)")
    parser.add_argument("--limit", type=int, default=10, help="max documents to classify")
    parser.add_argument("--batch", action="store_true",
                         help="classify via the Anthropic Batches API instead of one call per document "
                              "(cheaper, async; classifier stage only -- specialists/evaluator stay per-document)")
    parser.add_argument("--analyze", action="store_true",
                         help="run routed specialists over full text (Sonnet; off by default -- costs more)")
    parser.add_argument("--evaluate", action="store_true",
                         help="run the Evaluator (Opus, Agent SDK) on analyzed documents -- implies --analyze")
    parser.add_argument("--synthesize", action="store_true",
                         help="run the Synthesizer (briefing + DOCX/PPTX) on evaluated documents -- implies "
                              "--evaluate. Its Notion write / escalation email need RIA_EVALUATOR_APPROVED=1")
    args = parser.parse_args(argv)
    if args.synthesize:
        args.evaluate = True  # the Synthesizer scores specialist output via the Evaluator's decision
    if args.evaluate:
        args.analyze = True  # the Evaluator scores specialist output, so it needs --analyze to have run

    settings = get_settings()
    logger = setup_logging(settings)
    approved = os.environ.get("RIA_EVALUATOR_APPROVED", "").strip().lower() in ("1", "true")
    if args.synthesize and not approved:
        print("--synthesize requested but RIA_EVALUATOR_APPROVED is not set -- briefings and "
              "DOCX/PPTX still get generated, but no Notion record or escalation email will be sent.\n")
        log_event(logger, "pipeline", "execute_gate", "blocked", reason="RIA_EVALUATOR_APPROVED not set")

    docs = fetch_recent_documents(settings, logger=logger)[: args.limit]
    log_event(logger, "pipeline", "run_start", "begin", documents=len(docs), headless=args.headless,
              batch=args.batch, analyze=args.analyze, evaluate=args.evaluate, synthesize=args.synthesize)

    batch_decisions: dict = {}
    if args.batch and docs:
        batch_decisions = classify_batch(docs, settings=settings, logger=logger)

    max_spend = settings.pipeline.get("max_spend_usd")
    total_cost = 0.0

    results = []
    for doc in docs:
        if max_spend and total_cost >= max_spend:
            log_event(logger, "pipeline", "circuit_breaker", "tripped", total_cost=round(total_cost, 4),
                      max_spend=max_spend, completed=len(results), remaining=len(docs) - len(results))
            print(f"\nCost circuit breaker: ${total_cost:.2f} spent >= ${max_spend:.2f} limit "
                  f"(config/pipeline_config.json's pipeline.max_spend_usd). "
                  f"Stopping after {len(results)} of {len(docs)} document(s).")
            break

        try:
            if doc.document_number in batch_decisions:
                decision, usage = batch_decisions[doc.document_number]
            else:
                if args.batch:
                    # No silent gaps: a document missing from the batch (sub-request failure)
                    # still gets classified, just synchronously instead of in the batch.
                    log_event(logger, "pipeline", "batch_fallback", "warn", doc=doc.document_number)
                decision, usage = classify(doc, settings=settings, logger=logger)
            total_cost += estimate_cost(usage, settings.models["classifier"])

            entry = {
                "document": doc.document_number,
                "title": doc.title,
                "agency": doc.primary_agency,
                "document_type": doc.document_type,
                "publication_date": str(doc.publication_date),
                "html_url": doc.html_url,
                **decision,
                "cache_write": usage.cache_creation_input_tokens,
                "cache_read": usage.cache_read_input_tokens,
            }
            if args.analyze and any(decision["routing"].values()):
                full_text = fetch_full_text(doc, settings=settings, logger=logger)
                specialist_results = run_all_specialists(
                    doc, full_text, decision["routing"], settings=settings, logger=logger
                )
                entry["specialists"] = {key: v["result"] for key, v in specialist_results.items()}
                entry["cache_write"] += sum(v["usage"].cache_creation_input_tokens for v in specialist_results.values())
                entry["cache_read"] += sum(v["usage"].cache_read_input_tokens for v in specialist_results.values())
                total_cost += sum(
                    estimate_cost(v["usage"], settings.models["specialist"]) for v in specialist_results.values()
                )

                if args.evaluate:
                    eval_decision, eval_usage = evaluate(
                        doc, decision, specialist_results, settings=settings, logger=logger
                    )
                    entry["evaluation"] = eval_decision
                    entry["cache_write"] += eval_usage.get("cache_creation_input_tokens", 0)
                    entry["cache_read"] += eval_usage.get("cache_read_input_tokens", 0)
                    total_cost += estimate_cost(eval_usage, settings.models["evaluator"])

                    if args.synthesize:
                        briefing = synthesize(
                            doc, decision, specialist_results, eval_decision, settings=settings, logger=logger
                        )
                        entry["synthesis"] = briefing
        except Exception as exc:  # noqa: BLE001 -- one document's failure shouldn't crash the whole batch
            log_event(logger, "pipeline", "document_failed", "error", doc=doc.document_number,
                      error_type=type(exc).__name__, error=str(exc)[:300])
            print(f"  [FAILED] {doc.document_number}: {type(exc).__name__}: {str(exc)[:200]}")
            results.append({"document": doc.document_number, "title": doc.title, "failed": True,
                             "error_type": type(exc).__name__, "error": str(exc)[:300]})
            continue

        results.append(entry)

    if args.headless:
        for r in results:
            sys.stdout.write(json.dumps(r) + "\n")
    else:
        _print_table(results, analyzed=args.analyze)
        if args.analyze:
            print(f"\nEstimated cost this run: ${total_cost:.4f}"
                  + (f" (limit: ${max_spend:.2f})" if max_spend else ""))

    log_event(logger, "pipeline", "run_complete", "ok", classified=len(results),
              analyzed=args.analyze, evaluated=args.evaluate, synthesized=args.synthesize,
              total_cost_usd=round(total_cost, 4))
    return 0


def _print_table(results: list[dict], analyzed: bool = False) -> None:
    failed = [r for r in results if r.get("failed")]
    ok = [r for r in results if not r.get("failed")]

    print()
    print(f"{'Document':14} | {'Priority':8} | {'Conf':4} | {'Route':22} | Title")
    print("-" * 100)
    for r in ok:
        route = "+".join(k[:4] for k, v in r["routing"].items() if v) or "-"
        print(f"{r['document']:14} | {r['priority']:8} | {r['confidence']:.2f} | {route:22} | {r['title'][:44]}")

    if failed:
        print()
        print(f"Failed ({len(failed)}):")
        print("-" * 100)
        for r in failed:
            print(f"{r['document']:14} | {r['error_type']}: {r['error'][:80]}")

    results = ok  # everything below assumes a completed entry's shape
    written = sum(r["cache_write"] for r in results)
    read = sum(r["cache_read"] for r in results)
    print()
    print(f"Prompt cache: {written} tokens written, {read} read across {len(results)} document(s).")
    if not analyzed and written == 0 and results:
        print("(Haiku's cacheable-prefix minimum is 4096 tokens; short abstracts fall under it. "
              "Pass --analyze to run full-document specialist analysis, which does show reuse.)")

    analyzed_docs = [r for r in results if "specialists" in r]
    if analyzed_docs:
        print()
        print("Specialist analysis:")
        print("-" * 100)
        for r in analyzed_docs:
            print(f"{r['document']} | {r['title'][:70]}")
            for key, s in r["specialists"].items():
                if key == "materiality":
                    print(f"  materiality:     impact={s['impact_score']:>3}  risk={s['risk_level']}")
                elif key == "process_impact":
                    print(f"  process_impact:  {len(s['affected_processes'])} affected process(es)")
                elif key == "gap_analyzer":
                    print(f"  gap_analyzer:    {s['total_gaps']} gap(s), {s['critical_gaps']} critical")

    evaluated_docs = [r for r in results if "evaluation" in r]
    if evaluated_docs:
        print()
        print("Evaluator decisions:")
        print("-" * 100)
        for r in evaluated_docs:
            e = r["evaluation"]
            confidence = e["scores"].get("overall_confidence", 0.0)
            print(f"{r['document']} | tier={e['autonomy_tier']}  execute={e['execute']}  "
                  f"escalate={e['escalate']}  confidence={confidence:.2f}  enforcement={e['enforcement_detected']}")

    synthesized_docs = [r for r in results if "synthesis" in r]
    if synthesized_docs:
        print()
        print("Synthesizer output (Notion write / escalation email require RIA_EVALUATOR_APPROVED=1):")
        print("-" * 100)
        for r in synthesized_docs:
            s = r["synthesis"]
            print(f"{r['document']} | files={s['output_files']}  "
                  f"notion={s['notion_record_id'] or '-'}  email_sent={s['email_sent']}")


if __name__ == "__main__":
    raise SystemExit(main())
