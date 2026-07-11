"""Domain models for Riptide RIA.

``RegulatoryDocument`` is the canonical shape produced by ingestion and consumed by
the pipeline. ``to_classifier_input()`` emits exactly the Classifier agent's input
schema (see agents/classifier/CLAUDE.md), keeping the ingest -> route contract honest.
"""

from datetime import date

from pydantic import BaseModel, Field


class RegulatoryDocument(BaseModel):
    """A single regulatory document (Federal Register, and later other sources)."""

    document_number: str
    title: str
    document_type: str                      # e.g. "Rule", "Proposed Rule", "Notice"
    agencies: list[str] = Field(default_factory=list)
    publication_date: date
    effective_date: date | None = None
    abstract: str | None = None
    html_url: str
    pdf_url: str | None = None
    full_text_url: str | None = None        # xml/html full text, fetched on demand
    source: str = "federal_register"
    full_text_cached: bool = False          # set True once the body is in the prompt cache

    @property
    def primary_agency(self) -> str:
        # Federal Register lists the parent department first (e.g. "Health and Human
        # Services Department"); prefer the specific sub-agency (CMS / FDA) when present.
        if not self.agencies:
            return "Unknown"
        for agency in self.agencies:
            if "department" not in agency.lower():
                return agency
        return self.agencies[0]

    def summary(self, limit: int = 500) -> str:
        """Short abstract for routing/logging -- never the full body."""
        return (self.abstract or "").strip()[:limit]

    def to_classifier_input(self) -> dict:
        """Emit the Classifier agent's input schema."""
        return {
            "document_id": self.document_number,
            "document_type": self.document_type,
            "agency": self.primary_agency,
            "title": self.title,
            "summary": self.summary(),
            "full_text_cached": self.full_text_cached,
        }

    def log_line(self) -> str:
        """Metadata-only identifier for audit logs (no abstract/body)."""
        return f"{self.document_number} [{self.document_type}] {self.primary_agency}: {self.title[:80]}"
