"""Prove prompt-cache reuse: cache one full document, read it several times.

Fetches a real CMS/FDA document's full text, caches it once, and asks several
specialist-style questions sequentially. Call 1 writes the cache; calls 2+ read it
(cache_read_input_tokens > 0) -- the reuse the classifier's short abstracts couldn't show.

    python cache_probe.py
"""

from __future__ import annotations

from mcp_servers.federal_register.client import fetch_full_text, fetch_recent_documents
from ria.caching import ask_over_document, cached_document_prefix
from ria.logging_setup import log_event, setup_logging
from ria.settings import get_settings

_QUESTIONS = [
    "In one sentence, which agency issued this and what is its subject?",
    "In one sentence, is there a compliance deadline or effective date, and when?",
    "In one sentence, does this document contain enforcement or penalty language?",
]


def main() -> int:
    settings = get_settings()
    logger = setup_logging(settings)
    docs = fetch_recent_documents(settings, logger=logger)

    # Pick the first document with full text large enough to clear the cache minimum.
    doc, full_text = None, ""
    for candidate in docs:
        text = fetch_full_text(candidate, settings, logger=logger)
        if len(text) > 8000:
            doc, full_text = candidate, text
            break
    if doc is None:
        print("No document with sufficient full text found; widen the lookback window and retry.")
        return 1

    prefix = cached_document_prefix(doc, full_text)
    print(f"\nCaching full text of {doc.document_number} ({len(full_text)} chars): {doc.title[:56]}")
    print("-" * 96)
    for i, question in enumerate(_QUESTIONS, 1):
        answer, usage = ask_over_document(prefix, question, settings=settings, max_tokens=256)
        log_event(logger, "cache_probe", "read", "ok", call=i,
                  cache_write=usage.cache_creation_input_tokens,
                  cache_read=usage.cache_read_input_tokens, uncached=usage.input_tokens)
        print(f"call {i}: write={usage.cache_creation_input_tokens:>6}  read={usage.cache_read_input_tokens:>6}  "
              f"uncached={usage.input_tokens:>4}  | {answer.strip()[:66]}")

    print("\nCall 1 writes the cache; calls 2+ show cache_read > 0 -- the document prefix is reused.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
