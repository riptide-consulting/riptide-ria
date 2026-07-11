#!/usr/bin/env python3
"""PostToolUse audit hook (Riptide RIA).

Appends one redacted JSONL line per tool call to logs/audit.jsonl, satisfying the
operator rule: log every tool call with timestamp, agent, action, outcome.

Stdlib only (runs under any Python). Reads the hook JSON from stdin; never blocks
(always exits 0). Metadata only -- never logs file contents, full command bodies,
or secrets.
"""

import datetime
import json
import os
import sys
from pathlib import Path

_MAX = 160  # cap any free-text field


def _project_dir(data: dict) -> Path:
    for cand in (os.environ.get("CLAUDE_PROJECT_DIR"), data.get("cwd")):
        if cand:
            return Path(cand)
    return Path(__file__).resolve().parents[2]


def summarize(tool_name: str, tool_input: dict | None) -> str:
    """Compact, secret-free description of a tool call (never the values)."""
    ti = tool_input or {}
    if tool_name in ("Write", "Edit", "MultiEdit", "Read", "NotebookEdit"):
        return f"file={ti.get('file_path') or ti.get('notebook_path') or '?'}"
    if tool_name in ("Bash", "PowerShell"):
        cmd = (ti.get("command") or "").strip()
        first = cmd.splitlines()[0] if cmd else ""
        return f"cmd={first[:_MAX]}"
    if tool_name in ("Grep", "Glob"):
        return f"pattern={str(ti.get('pattern'))[:_MAX]}"
    if tool_name.startswith("mcp__"):
        return "mcp_call"
    return ("keys=" + ",".join(sorted(ti.keys())))[:_MAX]


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    tool = data.get("tool_name", "unknown")
    resp = data.get("tool_response")
    is_err = isinstance(resp, dict) and (resp.get("error") or resp.get("success") is False)
    line = {
        "ts": datetime.datetime.now().isoformat(timespec="seconds"),
        "session": str(data.get("session_id") or "")[:8],
        "tool": tool,
        "action": summarize(tool, data.get("tool_input")),
        "outcome": "error" if is_err else "ok",
    }
    try:
        log = _project_dir(data) / "logs" / "audit.jsonl"
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    except Exception:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
