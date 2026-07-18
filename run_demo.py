"""Riptide RIA -- one-command demo run (cross-platform twin of run_demo.bat).

Runs the full pipeline (batch classify -> specialists -> Evaluator -> Synthesizer) on a
small, cost-bounded number of real, current CMS/FDA documents. Estimated cost is roughly
$0.50-0.75 per document (mostly the Evaluator's Opus calls); the default is 2 documents.

Deliberately does NOT set RIA_EVALUATOR_APPROVED, so nothing writes to Notion or sends a
real escalation email -- the demo shows the governance gate itself working (execute/
escalate correctly reported as blocked) rather than firing real external side effects
unattended. That is the point, not a limitation: see README.md's Governance section.

    python run_demo.py          (2 documents, the default)
    python run_demo.py 5        (override the document count)

run_demo.bat remains the Windows double-click path; this exists so a reviewer on macOS or
Linux can clone, `pip install -r requirements.txt`, add ANTHROPIC_API_KEY to .env, and run.
"""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    limit = 2
    if argv:
        if not argv[0].isdigit() or int(argv[0]) < 1:
            print(f"Usage: python run_demo.py [document_count]  (got {argv[0]!r})", file=sys.stderr)
            return 2
        limit = int(argv[0])

    if not (PROJECT_ROOT / ".env").exists():
        print("No .env found. Copy .env.example to .env and add ANTHROPIC_API_KEY first.",
              file=sys.stderr)
        return 2

    print(f"Riptide RIA demo -- {limit} document(s) through the full pipeline.")
    print("Real API cost will be incurred (Haiku + Sonnet + Opus). No Notion/email side effects fire.")
    print()

    from main import main as pipeline_main

    rc = pipeline_main(["--batch", "--analyze", "--evaluate", "--synthesize", "--limit", str(limit)])
    print()
    print("Done. Briefings are in outputs/docx and outputs/pptx.")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
