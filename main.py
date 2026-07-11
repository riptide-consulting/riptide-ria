"""Riptide RIA pipeline entrypoint (headless).

Phase 1: ingest recent CMS/FDA documents and route each through the Classifier.
This is the CCAF "headless vs interactive" surface -- the ``-p`` flag makes it
pipe-friendly (JSON lines to stdout) for batch/cron use.

    python main.py               # ingest, classify, print a routing table
    python main.py -p            # headless: one JSON object per line to stdout
    python main.py --limit 5     # cap how many documents are classified
"""

from __future__ import annotations

import argparse
import json
import sys

from mcp_servers.federal_register.client import fetch_recent_documents
from ria.classifier import classify
from ria.logging_setup import log_event, setup_logging
from ria.settings import get_settings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Riptide RIA pipeline (Phase 1: ingest + classify)")
    parser.add_argument("-p", "--headless", action="store_true", help="emit JSONL to stdout (pipe-friendly)")
    parser.add_argument("--limit", type=int, default=10, help="max documents to classify")
    args = parser.parse_args(argv)

    settings = get_settings()
    logger = setup_logging(settings)

    docs = fetch_recent_documents(settings, logger=logger)[: args.limit]
    log_event(logger, "pipeline", "run_start", "begin", documents=len(docs), headless=args.headless)

    results = []
    for doc in docs:
        decision, usage = classify(doc, settings=settings, logger=logger)
        results.append({
            "document": doc.document_number,
            "title": doc.title,
            **decision,
            "cache_write": usage.cache_creation_input_tokens,
            "cache_read": usage.cache_read_input_tokens,
        })

    if args.headless:
        for r in results:
            sys.stdout.write(json.dumps(r) + "\n")
    else:
        _print_table(results)

    log_event(logger, "pipeline", "run_complete", "ok", classified=len(results))
    return 0


def _print_table(results: list[dict]) -> None:
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
    if written == 0 and results:
        print("(Haiku's cacheable-prefix minimum is 4096 tokens; short abstracts fall under it. "
              "Full-document caching + cross-agent reuse arrives in Phase 2.)")


if __name__ == "__main__":
    raise SystemExit(main())
