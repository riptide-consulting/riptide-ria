# demo-check.ps1: one command to get demo-ready.
#
# Rebuilds both artifacts from source, runs every quality gate, runs the
# offline test suite, checks the tracker connection, and states the demo
# posture. Any failure stops the script loudly; a green run ends with the
# absolute path of the deck to present.
#
# Run from anywhere:  powershell -File presentation\demo-check.ps1

$ErrorActionPreference = "Stop"
$pres = $PSScriptRoot
$repo = Split-Path $pres -Parent
$py = Join-Path $repo ".venv\Scripts\python.exe"

function Step($name, $script) {
    Write-Host ""
    Write-Host "== $name" -ForegroundColor Cyan
    & $script
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $name (exit $LASTEXITCODE). Not demo-ready." -ForegroundColor Red
        exit 1
    }
}

Step "Rebuild diagrams (with collision, spill, and vendor gates)" {
    Set-Location $pres; & $py diagrams\fix_diagrams.py
}
Step "Rebuild the deck" {
    Set-Location $pres; node build\build_master_v6.js
}
Step "Rebuild the technical documentation" {
    Set-Location $pres; node build\build_tech_doc_v2.js
}
Step "Contrast gate (expect failures: 0)" {
    Set-Location $pres; & $py qa\contrast_gate.py out\Riptide-RIA-Master-Deck.pptx
}
Step "Layout gate (expect geometry OK, image aspect OK, text fit OK)" {
    Set-Location $pres; & $py qa\layout_gate.py out\Riptide-RIA-Master-Deck.pptx
}
Step "Offline test suite (expect 117 passed)" {
    Set-Location $repo
    $out = & $py -m pytest tests\unit -q 2>&1 | Select-Object -Last 1
    Write-Host $out
    if ($out -notmatch "117 passed") {
        Write-Host "Test count is not 117 passed. Investigate before demoing." -ForegroundColor Red
        exit 1
    }
    $global:LASTEXITCODE = 0
}
Step "Notion tracker connection" {
    Set-Location $repo; & $py mcp_servers\notion_tracker\verify_connection.py
}

Write-Host ""
Write-Host "== Demo posture" -ForegroundColor Cyan
if ($env:RIA_EVALUATOR_APPROVED) {
    Write-Host "WARNING: RIA_EVALUATOR_APPROVED is SET. The blocked write IS the demo." -ForegroundColor Yellow
    Write-Host "Unset it for the room:  Remove-Item Env:RIA_EVALUATOR_APPROVED" -ForegroundColor Yellow
} else {
    Write-Host "RIA_EVALUATOR_APPROVED is not set. Correct: the refusal is the product." -ForegroundColor Green
}

$deck = Join-Path $pres "out\Riptide-RIA-Master-Deck.pptx"
Write-Host ""
Write-Host "DEMO-READY." -ForegroundColor Green
Write-Host "Deck: $deck"
Write-Host "Doc:  $(Join-Path $pres 'out\Riptide-RIA-Technical-Documentation.docx')"
