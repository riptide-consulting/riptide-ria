#!/usr/bin/env python3
"""PreToolUse secrets guard (Riptide RIA).

Blocks any Write/Edit/Bash/PowerShell that would place a real .env secret VALUE
anywhere except .env itself -- enforcing the operator rule: never expose API keys,
credentials, or PII in logs or outputs. Also blocks force-adding .env to git.

Stdlib only. Denies by exiting 2 with a reason on stderr. Fails open on any internal
error so a bug can never lock the session.
"""

import json
import os
import re
import sys
from pathlib import Path

MIN_SECRET_LEN = 12
_SENSITIVE = re.compile(r"(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)", re.I)


def _project_dir(data: dict) -> Path:
    for cand in (os.environ.get("CLAUDE_PROJECT_DIR"), data.get("cwd")):
        if cand:
            return Path(cand)
    return Path(__file__).resolve().parents[2]


def load_secret_values(env_path: Path) -> set[str]:
    """Return the set of secret VALUES from .env (keys that look sensitive)."""
    secrets: set[str] = set()
    try:
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            val = val.strip().strip('"').strip("'")
            if len(val) >= MIN_SECRET_LEN and _SENSITIVE.search(key):
                secrets.add(val)
    except Exception:
        pass
    return secrets


def scan(tool_name: str, tool_input: dict | None, secret_values: set[str]) -> str | None:
    """Return a block reason if this call would leak a secret, else None."""
    ti = tool_input or {}
    if tool_name in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        target = ti.get("file_path") or ti.get("notebook_path") or ""
        if Path(str(target)).name == ".env":
            return None  # secrets belong in .env
        blob = " ".join(str(ti.get(k, "")) for k in ("content", "new_string", "new_str", "new_source"))
        if any(s and s in blob for s in secret_values):
            return f"write to {target or '?'} contains a real .env secret value"
        return None
    if tool_name in ("Bash", "PowerShell"):
        cmd = ti.get("command") or ""
        low = cmd.lower()
        if any(s and s in cmd for s in secret_values):
            return "command echoes a real .env secret value"
        if "git add" in low and ".env" in low and ("-f" in low or "--force" in low):
            return "attempts to force-add .env (secrets must stay untracked)"
        return None
    return None


def main() -> int:
    try:
        data = json.load(sys.stdin)
        secrets = load_secret_values(_project_dir(data) / ".env")
        reason = scan(data.get("tool_name", ""), data.get("tool_input"), secrets)
        if reason:
            sys.stderr.write(
                f"[RIA secrets-guard] Blocked: {reason}. "
                "Never write credentials outside .env or echo them in commands.\n"
            )
            return 2
    except Exception:
        return 0  # fail open
    return 0


if __name__ == "__main__":
    sys.exit(main())
