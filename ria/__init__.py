"""Riptide RIA core runtime package.

Cross-cutting building blocks shared across the pipeline:
  - settings:      typed configuration loaded from .env + config/pipeline_config.json
  - models:        domain models (RegulatoryDocument, ...)
  - logging_setup: operator-compliant structured logging

Integrations live under ``mcp_servers/``; agent behavior/schemas under ``agents/``.
"""
