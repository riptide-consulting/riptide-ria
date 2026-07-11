"""Federal Register ingestion client (read-only).

Pulls recent CMS + FDA regulatory documents from the public Federal Register API and
maps them to ``RegulatoryDocument``. The API needs no auth and this client only issues
GET requests, so it has no external side effects (no Evaluator gate required).

Run the ingestion smoke test from the repo root:

    python -m mcp_servers.federal_register.client
"""

from datetime import date, timedelta
from typing import Any

import httpx

from ria.logging_setup import log_event, setup_logging
from ria.models import RegulatoryDocument
from ria.settings import Settings, get_settings

# Fields we ask the API to return (keeps payloads small and predictable).
_FIELDS = [
    "document_number", "title", "type", "abstract", "publication_date",
    "effective_on", "html_url", "pdf_url", "agency_names",
    "full_text_xml_url", "body_html_url",
]
# Safety cap so an unexpectedly large window can't page forever.
_MAX_PAGES = 5


def _build_params(settings: Settings, gte: str, per_page: int, page: int) -> list[tuple[str, str]]:
    """Build the repeated-key query string the Federal Register API expects."""
    params: list[tuple[str, str]] = [
        ("per_page", str(per_page)),
        ("page", str(page)),
        ("order", "newest"),
        ("conditions[publication_date][gte]", gte),
    ]
    params += [("conditions[agencies][]", slug) for slug in settings.fr_agencies]
    params += [("conditions[type][]", t) for t in settings.fr_document_types]
    params += [("fields[]", f) for f in _FIELDS]
    return params


def _map(result: dict[str, Any]) -> RegulatoryDocument | None:
    """Map one API result to a RegulatoryDocument; return None if it can't be parsed."""
    try:
        return RegulatoryDocument(
            document_number=result["document_number"],
            title=result.get("title") or "(untitled)",
            document_type=result.get("type") or "Unknown",
            agencies=result.get("agency_names") or [],
            publication_date=result["publication_date"],
            effective_date=result.get("effective_on"),
            abstract=result.get("abstract"),
            html_url=result.get("html_url") or "",
            pdf_url=result.get("pdf_url"),
            full_text_url=result.get("full_text_xml_url") or result.get("body_html_url"),
        )
    except Exception:
        return None


def fetch_recent_documents(
    settings: Settings | None = None,
    logger=None,
    per_page: int = 50,
) -> list[RegulatoryDocument]:
    """Fetch recent CMS/FDA documents within the configured lookback window."""
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)

    gte = (date.today() - timedelta(days=settings.fr_lookback_days)).isoformat()
    url = f"{settings.fr_base_url}/documents.json"

    docs: list[RegulatoryDocument] = []
    page, total_pages = 1, 1
    with httpx.Client(timeout=30.0) as client:
        while page <= total_pages and page <= _MAX_PAGES:
            resp = client.get(url, params=_build_params(settings, gte, per_page, page))
            resp.raise_for_status()
            data = resp.json()

            total_pages = data.get("total_pages", 1) or 1
            results = data.get("results", []) or []
            parsed = [d for d in (_map(r) for r in results) if d is not None]
            docs.extend(parsed)

            log_event(
                logger, "federal_register", "ingest_page", "ok",
                page=page, total_pages=total_pages,
                returned=len(results), parsed=len(parsed), running_total=len(docs),
            )
            page += 1

    if total_pages > _MAX_PAGES:
        # No silent caps -- record that the window exceeded our page limit.
        log_event(
            logger, "federal_register", "ingest_capped", "warn",
            fetched_pages=_MAX_PAGES, total_pages=total_pages,
        )

    return docs


def fetch_document(
    document_number: str,
    settings: Settings | None = None,
    logger=None,
) -> RegulatoryDocument | None:
    """Fetch a single Federal Register document by its document number. Returns None if
    not found. Read-only GET against the API's single-document endpoint -- used by the MCP
    server's get_document_full_text tool so it doesn't have to re-list recent documents to
    resolve one document_number."""
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    url = f"{settings.fr_base_url}/documents/{document_number}.json"
    with httpx.Client(timeout=30.0) as client:
        resp = client.get(url, params=[("fields[]", f) for f in _FIELDS])
        if resp.status_code == 404:
            log_event(logger, "federal_register", "fetch_document", "not_found", doc=document_number)
            return None
        resp.raise_for_status()
        return _map(resp.json())


def fetch_full_text(
    doc: RegulatoryDocument,
    settings: Settings | None = None,
    logger=None,
    max_chars: int = 60000,
) -> str:
    """Fetch a document's full text (XML/HTML), capped at max_chars. Returns '' if unavailable.

    Read-only GET. The raw XML/HTML is fine for caching and analysis -- the model reads the
    regulatory content within it.
    """
    settings = settings or get_settings()
    logger = logger or setup_logging(settings)
    if not doc.full_text_url:
        return ""
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(doc.full_text_url)
            resp.raise_for_status()
            text = resp.text
    except Exception as exc:
        log_event(logger, "federal_register", "fetch_full_text", "warn",
                  doc=doc.document_number, error=str(exc)[:80])
        return ""
    return text[:max_chars]


def _main() -> None:
    settings = get_settings()
    logger = setup_logging(settings)

    log_event(
        logger, "federal_register", "ingest_start", "begin",
        agencies=",".join(settings.fr_agencies),
        types=",".join(settings.fr_document_types),
        lookback_days=settings.fr_lookback_days,
    )
    docs = fetch_recent_documents(settings, logger=logger)
    log_event(logger, "federal_register", "ingest_complete", "ok", document_count=len(docs))

    print()
    print(f"Federal Register ingestion: {len(docs)} document(s) from "
          f"{', '.join(settings.fr_agencies)} over the last {settings.fr_lookback_days} days")
    print("-" * 96)
    print(f"{'Published':10} | {'Type':14} | {'Agency':32} | Title")
    print("-" * 96)
    for d in docs[:25]:
        print(f"{d.publication_date} | {d.document_type[:14]:14} | {d.primary_agency[:32]:32} | {d.title[:60]}")
    if len(docs) > 25:
        print(f"... and {len(docs) - 25} more")


if __name__ == "__main__":
    _main()
