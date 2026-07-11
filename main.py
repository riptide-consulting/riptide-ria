"""Riptide RIA pipeline entrypoint (headless).

Phase 1: ingest recent CMS/FDA documents and route each through the Classifier.
Phase 2: optionally run the routed specialists (materiality / process_impact /
gap_analyzer) over the cached full document text. This is the CCAF "headless vs
interactive" surface -- the ``-p`` flag makes it pipe-friendly (JSON lines to
stdout) for batch/cron use.

    python main.py                  # ingest, classify, print a routing table
    python main.py -p               # headless: one JSON object per line to stdout
    python main.py --limit 5        # cap how many documents are classified
    python main.py --analyze        # also run routed specialists (Sonnet; costs more)
"""

from __future__ import annotations

import argparse
import json
import sys

from mcp_servers.federal_register.client import fetch_full_text, fetch_recent_documents
from ria.classifier import classify
from ria.logging_setup import log_event, setup_logging
from ria.settings import get_settings
from ria.specialists import run_all_specialists


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Riptide RIA pipeline (ingest + classify [+ analyze])")
    parser.add_argument("-p", "--headless", action="store_true", help="emit JSONL to stdout (pipe-friendly)")
    parser.add_argument("--limit", type=int, default=10, help="max documents to classify")
    parser.add_argument("--analyze", action="store_true",
                         help="run routed specialists over full text (Sonnet; off by default -- costs more)")
    args = parser.parse_args(argv)

    settings = get_settings()
    logger = setup_logging(settings)

    docs = fetch_recent_documents(settings, logger=logger)[: args.limit]
    log_event(logger, "pipeline", "run_start", "begin",
              documents=len(docs), headless=args.headless, analyze=args.analyze)

    results = []
    for doc in docs:
        decision, usage = classify(doc, settings=settings, logger=logger)
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
        results.append(entry)

    if args.headless:
        for r in results:
            sys.stdout.write(json.dumps(r) + "\n")
    else:
        _print_table(results, analyzed=args.analyze)

    log_event(logger, "pipeline", "run_complete", "ok", classified=len(results), analyzed=args.analyze)
    return 0


def _print_table(results: list[dict], analyzed: bool = False) -> None:
    print()
    print(f"{'Document':14} | {'Priority':8} | {'Conf':4} | {'Route':22} | Title")
    print("-" * 100)
    for r in results:
        route = "+".join(k[:4] for k, v in r["routing"].items() if v) or "-"
        print(f"{r['document']:14} | {r['priority']:8} | {r['confidence']:.2f} | {route:22} | {r['title'][:44]}")

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


if __name__ == "__main__":
    raise SystemExit(main())
