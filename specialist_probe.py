"""Prove the specialist chain reuses the cached document prefix (Phase 2 step 2).

Classifies one real document (for context), then forces all three specialists --
materiality, process_impact, gap_analyzer -- to run in order over ONE cached full-text
prefix. Call 1 writes the cache; calls 2 and 3 show cache_read_input_tokens > 0 -- the
chaining and caching CCAF surfaces working together (cache_probe.py proved the same
mechanic with canned questions; this proves it across the real specialist agents).

    python specialist_probe.py
"""

from __future__ import annotations

from mcp_servers.federal_register.client import fetch_full_text, fetch_recent_documents
from ria.classifier import classify
from ria.logging_setup import log_event, setup_logging
from ria.settings import get_settings
from ria.specialists import run_all_specialists

_FORCE_ALL = {"materiality": True, "process_impact": True, "gap_analyzer": True}


def main() -> int:
    settings = get_settings()
    logger = setup_logging(settings)
    docs = fetch_recent_documents(settings, logger=logger)

    doc, full_text = None, ""
    for candidate in docs:
        text = fetch_full_text(candidate, settings, logger=logger)
        if len(text) > 8000:
            doc, full_text = candidate, text
            break
    if doc is None:
        print("No document with sufficient full text found; widen the lookback window and retry.")
        return 1

    decision, _ = classify(doc, settings=settings, logger=logger)
    print(f"\n{doc.document_number}: {doc.title[:70]}")
    print(f"Classifier routing: {decision['routing']} "
          f"(priority={decision['priority']}, confidence={decision['confidence']:.2f})")
    print("Forcing all three specialists to run regardless of routing, to prove the chain.")
    print("-" * 96)

    results = run_all_specialists(doc, full_text, _FORCE_ALL, settings=settings, logger=logger)

    for i, (key, entry) in enumerate(results.items(), 1):
        usage, result = entry["usage"], entry["result"]
        log_event(logger, "specialist_probe", "read", "ok", call=i, specialist=key,
                   cache_write=usage.cache_creation_input_tokens,
                   cache_read=usage.cache_read_input_tokens, uncached=usage.input_tokens)
        print(f"call {i} [{key:15}] write={usage.cache_creation_input_tokens:>6}  "
              f"read={usage.cache_read_input_tokens:>6}  uncached={usage.input_tokens:>4}  "
              f"confidence={result['confidence']:.2f}")

    print("\nCall 1 writes the cache; calls 2+ show cache_read > 0 -- the document prefix is")
    print("shared across all three specialists, not re-sent per agent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
