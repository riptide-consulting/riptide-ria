"""Live prompt-quality eval suite -- see evaluations/test_*.py's module docstrings.

Distinct from tests/unit/: these hit the real Anthropic API and cost real money/time. Run
manually with `pytest evaluations -q`; CI runs them automatically only once the
ANTHROPIC_API_KEY secret is configured (see .github/workflows/ci.yml) -- otherwise it skips
them gracefully rather than failing every push with no key available.
"""
