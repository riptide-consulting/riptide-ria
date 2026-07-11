#!/usr/bin/env python3
"""PreToolUse governance guard (Riptide RIA).

Enforces the operator rule: never execute an action with external side effects
without Evaluator approval. External side effects = mutations to external services
(Notion/Gmail/Drive MCP write tools) and outbound mutating network calls (git push,
curl/wget/Invoke-WebRequest with POST/PUT/DELETE/PATCH).

Approval is granted by setting RIA_EVALUATOR_APPROVED=1 in the environment for the
approved action. Denies by exiting 2. Fails open on internal error.
"""

import json
import os
import re
import sys

# MCP tool-name fragments that mutate external state.
_MCP_WRITE = re.compile(
    r"mcp__.*__(create|update|delete|send|append|write|move|upload|label|draft|revoke|complete|respond|remove)",
    re.I,
)


def is_side_effect(tool_name: str, tool_input: dict | None) -> str | None:
    """Return a short label if the call has an external side effect, else None."""
    ti = tool_input or {}
    if tool_name.startswith("mcp__"):
        return f"external MCP mutation ({tool_name})" if _MCP_WRITE.search(tool_name) else None
    if tool_name in ("Bash", "PowerShell"):
        low = (ti.get("command") or "").lower()
        if re.search(r"\bgit\s+push\b", low):
            return "git push"
        is_fetch = re.search(r"\b(curl|wget|invoke-webrequest|invoke-restmethod|iwr)\b", low)
        is_mutate = re.search(
            r"-x\s*(post|put|delete|patch)|-method\s+(post|put|delete|patch)|\b(post|put|delete|patch)\b",
            low,
        )
        if is_fetch and is_mutate:
            return "outbound mutating HTTP request"
        return None
    return None


def main() -> int:
    try:
        data = json.load(sys.stdin)
        label = is_side_effect(data.get("tool_name", ""), data.get("tool_input"))
        if label:
            approved = os.environ.get("RIA_EVALUATOR_APPROVED", "").strip().lower() in ("1", "true", "yes", "on")
            if not approved:
                sys.stderr.write(
                    f"[RIA evaluator-gate] Blocked external side effect: {label}. "
                    "Operator policy requires Evaluator approval. To proceed, set "
                    "RIA_EVALUATOR_APPROVED=1 for this action.\n"
                )
                return 2
    except Exception:
        return 0  # fail open
    return 0


if __name__ == "__main__":
    sys.exit(main())
