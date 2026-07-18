"""Operator-compliant logging for Riptide RIA.

Uses the config-driven setup in ``config/logging.conf`` (console + file handlers on
the ``ria`` logger). ``log_event`` emits the audit line the root CLAUDE.md requires --
every tool call / decision logged with timestamp, agent, action, and outcome. The
timestamp comes from the formatter; callers pass agent/action/outcome.

Data-handling rule: pass metadata only. Never pass full regulatory document text or
PII through the logger -- summaries and identifiers only.
"""

import logging
import logging.config

from ria.settings import PROJECT_ROOT, Settings, get_settings

_LOGGING_CONF = PROJECT_ROOT / "config" / "logging.conf"
_configured = False


def setup_logging(settings: Settings | None = None) -> logging.Logger:
    """Configure logging once and return the ``ria`` logger."""
    global _configured
    settings = settings or get_settings()

    # Ensure the log directory exists before the FileHandler opens it.
    (PROJECT_ROOT / settings.log_path).parent.mkdir(parents=True, exist_ok=True)

    if not _configured:
        try:
            # defaults feeds %(logpath)s interpolation in logging.conf's FileHandler args,
            # so the file lands at settings.log_path under the project root regardless of
            # CWD. as_posix() matters: the args line is eval()'d by fileConfig, and a raw
            # Windows path ("C:\Users\...") inside that string literal is a \U escape error.
            logging.config.fileConfig(
                str(_LOGGING_CONF),
                disable_existing_loggers=False,
                defaults={"logpath": (PROJECT_ROOT / settings.log_path).as_posix()},
            )
        except Exception as exc:
            # This exact failure (a UTF-8 BOM in logging.conf breaking configparser) went
            # unnoticed for the whole project, since the fallback below still logs to
            # console -- everything LOOKED like it was working. Print loudly rather than
            # silently degrade to console-only logging a second time.
            print(f"WARNING: config/logging.conf failed to load ({exc!r}); "
                  f"falling back to console-only logging -- logs/ria.log will NOT be written.")
            logging.basicConfig(
                level=settings.log_level,
                format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        _configured = True

    logger = logging.getLogger("ria")
    logger.setLevel(settings.log_level)
    return logger


def log_event(logger: logging.Logger, agent: str, action: str, outcome: str, **fields) -> None:
    """Emit a structured audit line: ``agent=.. action=.. outcome=.. k=v ...``.

    Governance requirement: log every agent call / tool invocation / decision.
    Keep fields to identifiers and counts -- no document bodies, no PII.
    """
    msg = f"agent={agent} action={action} outcome={outcome}"
    if fields:
        msg += " " + " ".join(f"{k}={v}" for k, v in fields.items())
    logger.info(msg)
