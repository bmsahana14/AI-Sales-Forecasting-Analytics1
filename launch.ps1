# ForecastIQ Launch Script (Windows PowerShell)
# Run this from the project root folder

Write-Host ""
Write-Host "-----------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   FORECAST IQ - NEURAL BUSINESS INTELLIGENCE PLATFORM v2.0" -ForegroundColor Cyan
Write-Host "-----------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Check .env
$envPath = Join-Path $PSScriptRoot "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "!! WARNING: backend/.env not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item (Join-Path $PSScriptRoot "backend\.env.example") $envPath
    Write-Host "   -> Please edit backend/.env and add your GEMINI_API_KEY" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Select what to launch:" -ForegroundColor White
Write-Host "  [1] Backend only  (FastAPI on port 8000)" -ForegroundColor Gray
Write-Host "  [2] Frontend only (React on port 5173)" -ForegroundColor Gray
Write-Host "  [3] Both          (Recommended)" -ForegroundColor Green
Write-Host ""
$Action = Read-Host "Enter choice (1/2/3)"

if ($Action -eq "1" -or $Action -eq "3") {
    Write-Host ""
    Write-Host ">> Starting FastAPI backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 127.0.0.1 --port 8000"
    )
}

if ($Action -eq "2" -or $Action -eq "3") {
    Start-Sleep -Milliseconds 1000
    Write-Host ">> Starting React frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$PSScriptRoot\frontend'; npm run dev"
    )
}

Write-Host ""
Write-Host "Launch triggered!" -ForegroundColor Green
Write-Host "   Backend  : http://127.0.0.1:8000" -ForegroundColor DarkGray
Write-Host "   Frontend : http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
