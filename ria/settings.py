"""Typed configuration loader for Riptide RIA.

Merges two sources into one immutable ``Settings`` object:
  - ``.env``                     secrets, model routing, log config (runtime, gitignored)
  - ``config/pipeline_config.json``  federal register, autonomy tiers, pipeline knobs

Secrets are never rendered by ``repr()`` (operator rule: no keys in logs/outputs).
Access via ``get_settings()`` which caches a single instance for the process.
"""

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# ria/ is one level below the repo root.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
_ENV_PATH = PROJECT_ROOT / ".env"
_PIPELINE_CONFIG = PROJECT_ROOT / "config" / "pipeline_config.json"


def _redact(value: str | None) -> str:
    """Render a secret as presence + length only -- never the value itself."""
    return f"<set:{len(value)} chars>" if value else "<missing>"


def _require(name: str, value: str | None) -> str:
    if not value:
        raise RuntimeError(
            f"Required environment variable {name} is missing or empty. Check {_ENV_PATH}."
        )
    return value


@dataclass(frozen=True)
class Settings:
    # --- secrets (never logged) ---
    anthropic_api_key: str
    notion_api_key: str
    notion_database_id: str
    notion_data_source_id: str | None
    # --- model routing (operator policy, sourced from .env) ---
    models: dict          # role -> model id
    max_tokens: dict      # role -> max output tokens
    # --- federal register ingestion ---
    fr_base_url: str
    fr_agencies: list     # agency slugs
    fr_document_types: list
    fr_lookback_days: int
    # --- governance / pipeline ---
    autonomy: dict
    pipeline: dict
    # --- logging ---
    log_level: str
    log_path: str

    def model_for(self, role: str) -> str:
        """Model id for a pipeline role (classifier/specialist/evaluator/synthesizer)."""
        return self.models[role]

    def max_tokens_for(self, role: str) -> int:
        return self.max_tokens[role]

    def __repr__(self) -> str:  # redacts secrets
        return (
            "Settings("
            f"anthropic_api_key={_redact(self.anthropic_api_key)}, "
            f"notion_api_key={_redact(self.notion_api_key)}, "
            f"notion_database_id={self.notion_database_id!r}, "
            f"notion_data_source_id={self.notion_data_source_id!r}, "
            f"models={self.models!r}, max_tokens={self.max_tokens!r}, "
            f"fr_agencies={self.fr_agencies!r}, fr_document_types={self.fr_document_types!r}, "
            f"fr_lookback_days={self.fr_lookback_days}, "
            f"log_level={self.log_level!r}, log_path={self.log_path!r})"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load and cache settings for the process."""
    load_dotenv(_ENV_PATH)

    # utf-8-sig tolerates a UTF-8 BOM (Windows tools often add one) and plain UTF-8 alike.
    cfg = json.loads(_PIPELINE_CONFIG.read_text(encoding="utf-8-sig")) if _PIPELINE_CONFIG.exists() else {}
    fr = cfg.get("federal_register", {})

    models = {
        "classifier": os.getenv("MODEL_CLASSIFIER", ""),
        "specialist": os.getenv("MODEL_SPECIALIST", ""),
        "evaluator": os.getenv("MODEL_EVALUATOR", ""),
        "synthesizer": os.getenv("MODEL_SYNTHESIZER", ""),
    }
    max_tokens = {
        "classifier": int(os.getenv("MAX_TOKENS_CLASSIFIER", "1024")),
        "specialist": int(os.getenv("MAX_TOKENS_SPECIALIST", "4096")),
        "evaluator": int(os.getenv("MAX_TOKENS_EVALUATOR", "2048")),
        "synthesizer": int(os.getenv("MAX_TOKENS_SYNTHESIZER", "8192")),
    }

    env_agencies = [a.strip() for a in os.getenv("FEDERAL_REGISTER_AGENCIES", "").split(",") if a.strip()]

    return Settings(
        anthropic_api_key=_require("ANTHROPIC_API_KEY", os.getenv("ANTHROPIC_API_KEY")),
        notion_api_key=_require("NOTION_API_KEY", os.getenv("NOTION_API_KEY")),
        notion_database_id=_require("NOTION_DATABASE_ID", os.getenv("NOTION_DATABASE_ID")),
        notion_data_source_id=os.getenv("NOTION_DATA_SOURCE_ID") or None,
        models=models,
        max_tokens=max_tokens,
        fr_base_url=os.getenv("FEDERAL_REGISTER_API_URL", "https://www.federalregister.gov/api/v1"),
        fr_agencies=fr.get("agencies") or env_agencies,
        fr_document_types=fr.get("document_types") or ["RULE", "PRORULE", "NOTICE"],
        fr_lookback_days=int(fr.get("lookback_days", 7)),
        autonomy=cfg.get("autonomy", {}),
        pipeline=cfg.get("pipeline", {}),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        log_path=os.getenv("LOG_PATH", "logs/ria.log"),
    )
