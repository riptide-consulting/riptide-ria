"""Test isolation for the unit suite.

get_settings() calls load_dotenv(_ENV_PATH) at the point of load, which is
right for the runtime and wrong for tests: on a developer machine with a
real .env, values like NOTION_API_KEY leak into tests that assert the
unconfigured behavior, so the suite passes in CI (no .env) and fails
locally. The fixture below no-ops dotenv loading for every unit test;
tests supply exactly the environment they mean via monkeypatch.setenv,
and only that environment is in force.
"""

import pytest


@pytest.fixture(autouse=True)
def _no_dotenv(monkeypatch):
    monkeypatch.setattr("ria.settings.load_dotenv", lambda *args, **kwargs: None)
    # The variables a real .env would have exported into this process are
    # also cleared, so a shell that sourced them cannot leak either.
    for var in ("ANTHROPIC_API_KEY", "NOTION_API_KEY", "NOTION_DATABASE_ID",
                "NOTION_DATA_SOURCE_ID", "GOOGLE_CREDENTIALS_PATH", "RIA_EVALUATOR_APPROVED"):
        monkeypatch.delenv(var, raising=False)
