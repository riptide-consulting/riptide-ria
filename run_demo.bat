@echo off
REM Riptide RIA -- one-command demo run.
REM
REM Runs the full pipeline (batch classify -> specialists -> Evaluator -> Synthesizer) on a
REM small, cost-bounded number of real, current CMS/FDA documents. Estimated cost: roughly
REM $0.50-0.75 per document (mostly the Evaluator's Opus calls) -- default is 2 documents.
REM
REM Deliberately does NOT set RIA_EVALUATOR_APPROVED, so nothing writes to Notion or sends a
REM real escalation email -- the demo shows the governance gate itself working (execute/
REM escalate correctly reported as blocked) rather than firing real external side effects
REM unattended. That is the point, not a limitation: see README.md's Governance section.
REM
REM Usage:
REM   run_demo.bat        (2 documents, the default)
REM   run_demo.bat 5      (override the document count)

setlocal
set LIMIT=%1
if "%LIMIT%"=="" set LIMIT=2

cd /d "%~dp0"

REM Fail with a plain reason instead of a stack trace when setup is incomplete.
if not exist ".venv\Scripts\python.exe" (
    echo No .venv found. Run: python -m venv .venv ^&^& .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 2
)
if not exist ".env" (
    echo No .env found. Copy .env.example to .env and add ANTHROPIC_API_KEY first.
    pause
    exit /b 2
)
echo %LIMIT%|findstr /r "^[1-9][0-9]*$" >nul || (
    echo Document count must be a positive number, got "%LIMIT%". Usage: run_demo.bat 5
    pause
    exit /b 2
)

echo Riptide RIA demo -- %LIMIT% document(s) through the full pipeline.
echo Real API cost will be incurred (Haiku + Sonnet + Opus). No Notion/email side effects fire.
echo.
.venv\Scripts\python.exe main.py --batch --analyze --evaluate --synthesize --limit %LIMIT%
echo.
echo Done. Briefings are in outputs\docx and outputs\pptx.
pause
