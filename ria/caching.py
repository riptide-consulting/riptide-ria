"""Shared prompt-cache scaffolding for document analysis (Phase 2).

Caches the full regulatory document once so multiple specialist agents reading the same
document reuse the cached prefix -- the CCAF "caching" surface ("all sub-agents work from a
cached document prefix"). The cache breakpoint sits on the document body; each agent's
question goes *after* it, so the large document prefix is shared and the small question varies.

Keep the read parameters (model, tools, thinking) identical across reads of the same document,
or the messages-tier cache invalidates and cache_read drops to zero.
"""

from __future__ import annotations

import anthropic

from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings


def cached_document_prefix(doc: RegulatoryDocument, full_text: str) -> list[dict]:
    """Content blocks for the shared, cached document context.

    The last block carries the cache breakpoint, so the metadata header + full body cache
    together. Falls back to the abstract when full text isn't available.
    """
    header = (
        "Regulatory document under analysis:\n"
        f"Document number: {doc.document_number}\n"
        f"Type: {doc.document_type}\n"
        f"Agency: {doc.primary_agency}\n"
        f"Title: {doc.title}\n"
        f"Published: {doc.publication_date}\n"
    )
    body = full_text.strip() or (doc.abstract or "(no full text available)")
    return [
        {"type": "text", "text": header},
        {"type": "text", "text": f"Full text:\n{body}", "cache_control": {"type": "ephemeral"}},
    ]


def ask_over_document(
    prefix_blocks: list[dict],
    question: str,
    settings: Settings | None = None,
    client: anthropic.Anthropic | None = None,
    model: str | None = None,
    max_tokens: int = 512,
):
    """One read of the cached document prefix answering `question`. Returns (text, usage).

    Successive calls with the same `prefix_blocks` reuse the cache (usage.cache_read_input_tokens > 0).
    Model defaults to the operator-pinned specialist model. Thinking is disabled to keep the
    cached prefix stable across reads (toggling it invalidates the messages cache).
    """
    settings = settings or get_settings()
    client = client or anthropic.Anthropic(api_key=settings.anthropic_api_key)
    model = model or settings.models["specialist"]
    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        thinking={"type": "disabled"},
        messages=[{"role": "user", "content": [*prefix_blocks, {"type": "text", "text": question}]}],
    )
    text = next((b.text for b in resp.content if b.type == "text"), "")
    return text, resp.usage
