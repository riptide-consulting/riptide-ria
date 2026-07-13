"""Unit tests for the governance hook scripts in .claude/hooks/.

The hooks are stdlib-only scripts, so we load them by file path and exercise their
pure decision functions -- no .env, network, or Claude Code runtime required.
"""

import importlib.util
from pathlib import Path

_HOOKS = Path(__file__).resolve().parents[2] / ".claude" / "hooks"


def _load(name):
    spec = importlib.util.spec_from_file_location(name, _HOOKS / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


guard_secrets = _load("guard_secrets")
guard_side_effects = _load("guard_side_effects")
audit_log = _load("audit_log")

SECRET = "ntn_supersecretvalue12345"


# --- secrets guard ---

def test_secrets_blocks_write_to_tracked_file():
    assert guard_secrets.scan("Write", {"file_path": "README.md", "content": f"k={SECRET}"}, {SECRET})


def test_secrets_allows_write_to_env():
    assert guard_secrets.scan("Write", {"file_path": ".env", "content": f"NOTION_API_KEY={SECRET}"}, {SECRET}) is None


def test_secrets_allows_clean_write():
    assert guard_secrets.scan("Write", {"file_path": "app.py", "content": "print('hi')"}, {SECRET}) is None


def test_secrets_blocks_echo_in_command():
    assert guard_secrets.scan("Bash", {"command": f"echo {SECRET}"}, {SECRET})


def test_secrets_blocks_force_add_env():
    assert guard_secrets.scan("Bash", {"command": "git add -f .env"}, set())


# --- side-effects guard ---

def test_side_effect_blocks_git_push():
    assert guard_side_effects.is_side_effect("Bash", {"command": "git push origin main"})


def test_side_effect_allows_git_status():
    assert guard_side_effects.is_side_effect("Bash", {"command": "git status"}) is None


def test_side_effect_blocks_mcp_write():
    assert guard_side_effects.is_side_effect("mcp__notion__create_page", {})


def test_side_effect_allows_mcp_read():
    assert guard_side_effects.is_side_effect("mcp__notion__retrieve_page", {}) is None


# --- audit log ---

def test_audit_summarize_is_secret_free():
    summary = audit_log.summarize("Write", {"file_path": "x.py", "content": "SUPERSECRET"})
    assert "SUPERSECRET" not in summary
    assert "x.py" in summary


# --- hook routing configuration ---

def test_settings_json_routes_multiedit_through_secrets_guard():
    """guard_secrets.scan() handles MultiEdit, but the tool only runs if settings.json's
    matcher routes it there -- this pins the configuration, not just the function."""
    import json
    import re

    settings_path = _HOOKS.parent / "settings.json"
    config = json.loads(settings_path.read_text(encoding="utf-8"))
    secrets_matchers = [
        entry["matcher"] for entry in config["hooks"]["PreToolUse"]
        if any("guard_secrets" in h["command"] for h in entry["hooks"])
    ]
    assert secrets_matchers, "secrets guard is not registered in settings.json"
    assert any(re.fullmatch(m, "MultiEdit") for m in secrets_matchers)
