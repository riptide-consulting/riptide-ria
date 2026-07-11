"""Shared prompt-cache scaffolding for document analysis (Phase 2).

Caches the full regulatory document once so multiple specialist agents reading the same
document reuse the cached prefix -- the CCAF "caching" surface ("all sub-agents work from a
cached document prefix"). The cache breakpoint sits on the LAST block; each agent's question
goes *after* it, so the large document (+ Drive context, Phase 3) prefix is shared and the
small question varies.

Keep the read parameters (model, tools, thinking) identical across reads of the same document,
or the messages-tier cache invalidates and cache_read drops to zero.
"""

from __future__ import annotations

import anthropic

from mcp_servers.google_auth import is_configured as google_configured
from mcp_servers.google_drive.client import fetch_document_text, search_policy_documents
from ria.logging_setup import log_event, setup_logging
from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings


def fetch_drive_context(doc: RegulatoryDocument, settings: Settings | None = None, logger=None) -> str:
    """Search Drive for internal policy documents relevant to this regulation and return
    their combined text. Returns "" if Phase 3 isn't configured, the search finds nothing, or
    the search/fetch fails -- callers should treat "" as an honest 'nothing found', not an
    error worth crashing over (root CLAUDE.md: partial results, not a full re-run)."""
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    if not google_configured(settings):
        return ""
    try:
        matches = search_policy_documents(doc.primary_agency, settings=settings, limit=2)
    except Exception as exc:  # noqa: BLE001 -- Drive being unreachable shouldn't fail the pipeline
        log_event(logger, "caching", "drive_search", "failed", doc=doc.document_number, error=str(exc)[:160])
        return ""
    if not matches:
        log_event(logger, "caching", "drive_search", "ok", doc=doc.document_number, matches=0)
        return ""

    sections = []
    for match in matches:
        try:
            text = fetch_document_text(match["id"], match["mimeType"], settings=settings, max_chars=8000)
            sections.append(f"--- {match['name']} ---\n{text}")
        except Exception as exc:  # noqa: BLE001 -- one bad file shouldn't drop the others
            log_event(logger, "caching", "drive_fetch", "failed", doc=doc.document_number,
                      file=match.get("name"), error=str(exc)[:160])
    log_event(logger, "caching", "drive_search", "ok", doc=doc.document_number, matches=len(sections))
    return "\n\n".join(sections)


def cached_document_prefix(doc: RegulatoryDocument, full_text: str, drive_context: str = "") -> list[dict]:
    """Content blocks for the shared, cached document context.

    The last block carries the cache breakpoint, so header + full body + Drive context all
    cache together. Falls back to the abstract when full text isn't available. drive_context
    is always stated explicitly (real content or an honest "nothing found") rather than left
    implicit, so specialists never have to guess whether Drive was actually checked.
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
    drive_text = (
        f"Internal policy documents found in Google Drive:\n{drive_context}" if drive_context
        else "No matching internal policy documents were found in Google Drive for this agency/topic."
    )
    return [
        {"type": "text", "text": header},
        {"type": "text", "text": f"Full text:\n{body}"},
        {"type": "text", "text": drive_text, "cache_control": {"type": "ephemeral"}},
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
