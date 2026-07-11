"""Hand-crafted document fixtures for the live prompt-quality evals.

These are NOT real Federal Register documents -- they're minimal, purpose-built scenarios
that isolate one behavior each (urgent vs. routine, enforcement language, a PHI-adjacent gap)
so an eval can assert the actual prompt+model combination discriminates correctly, rather
than just that the code parses whatever comes back.
"""

from datetime import date

from ria.models import RegulatoryDocument


def urgent_enforcement_document() -> RegulatoryDocument:
    return RegulatoryDocument(
        document_number="EVAL-0001",
        title="Immediate Suspension of Manufacturing Authorization for Failure to Correct "
              "Critical Sterility Violations",
        document_type="Rule",
        agencies=["Food and Drug Administration"],
        publication_date=date(2026, 1, 1),
        html_url="https://example.gov/eval-0001",
        abstract=(
            "FDA is immediately suspending the manufacturing authorization of a sterile "
            "injectable drug facility after repeated failed inspections found critical "
            "sterility assurance violations. Firms found in violation face civil monetary "
            "penalties up to $1,000,000 per violation and referral for criminal prosecution "
            "under 21 U.S.C. 333. Affected manufacturers must cease production immediately "
            "and submit a corrective action plan within 15 days or face permanent revocation "
            "of their establishment registration."
        ),
    )


def urgent_enforcement_full_text() -> str:
    return (
        "This rule is effective immediately upon publication. FDA has determined that "
        "continued operation of the affected facility presents an imminent hazard to public "
        "health. Firms that fail to submit a corrective action plan within 15 days of this "
        "notice will be subject to civil monetary penalties of up to $1,000,000 per "
        "violation under 21 U.S.C. 333(f), referral to the Department of Justice for "
        "criminal prosecution, and permanent revocation of establishment registration under "
        "21 CFR Part 207. This is an enforcement action, not a proposed rule -- it is "
        "binding and effective immediately."
    )


def routine_renewal_document() -> RegulatoryDocument:
    return RegulatoryDocument(
        document_number="EVAL-0002",
        title="Medicare Program; Continued Approval of an Existing Accrediting "
              "Organization's Home Health Agency Accreditation Program",
        document_type="Notice",
        agencies=["Centers for Medicare & Medicaid Services"],
        publication_date=date(2026, 1, 1),
        html_url="https://example.gov/eval-0002",
        abstract=(
            "This notice announces CMS's decision to approve the continued deeming "
            "authority of an existing national accrediting organization for home health "
            "agencies for a routine 6-year renewal term. This is an administrative renewal "
            "of an existing, already-approved program with no changes to accreditation "
            "requirements, standards, or procedures."
        ),
    )


def routine_renewal_full_text() -> str:
    return (
        "CMS has completed its routine review of the accrediting organization's Medicare "
        "home health agency accreditation program and is renewing its deeming authority for "
        "a standard 6-year term, consistent with its prior approval. No changes to the "
        "accreditation standards, survey procedures, or requirements are being made as part "
        "of this renewal. This is a routine administrative continuation with no new "
        "obligations for accredited providers."
    )


def phi_adjacent_gap_document() -> RegulatoryDocument:
    return RegulatoryDocument(
        document_number="EVAL-0003",
        title="Clarification of PHI Access Logging Expectations Under the HIPAA Security Rule",
        document_type="Notice",
        agencies=["Centers for Medicare & Medicaid Services"],
        publication_date=date(2026, 1, 1),
        html_url="https://example.gov/eval-0003",
        abstract=(
            "HHS clarifies existing expectations that covered entities log all access to "
            "systems storing protected health information (PHI), consistent with the HIPAA "
            "Security Rule."
        ),
    )


def phi_adjacent_gap_full_text() -> str:
    return (
        "Covered entities must implement access controls for systems that store or "
        "transmit protected health information (PHI), including audit logging of all PHI "
        "access events, consistent with existing HIPAA Security Rule requirements at 45 CFR "
        "164.312. This document does not create new enforcement mechanisms; it clarifies "
        "existing expectations for PHI access logging that many organizations currently "
        "lack a documented control for."
    )
