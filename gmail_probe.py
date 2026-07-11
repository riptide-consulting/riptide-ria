"""Prove the Gmail escalation-email send works end to end, now that Google OAuth setup is
complete. First run opens a browser for a one-time consent click; the refresh token (an
Internal Workspace app) shouldn't need it again after that.

    RIA_EVALUATOR_APPROVED=1 python gmail_probe.py
"""

from __future__ import annotations

from mcp_servers.gmail.client import send_escalation_email
from ria.settings import get_settings


def main() -> int:
    settings = get_settings()
    message_id = send_escalation_email(
        subject="[RIA] Test: Gmail integration live-proof",
        body="This is a real test send proving the Synthesizer's escalation-email path works "
             "end to end (gmail_probe.py). Safe to ignore/delete -- not a real regulatory escalation.",
        settings=settings,
    )
    print(f"Sent. Message id: {message_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
