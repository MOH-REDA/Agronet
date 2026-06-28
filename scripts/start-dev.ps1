$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting AgroNet backend on http://127.0.0.1:8000"
Start-Process powershell -WorkingDirectory $backend -ArgumentList @(
  "-NoExit",
  "-Command",
  "php artisan serve --host=127.0.0.1 --port=8000"
)

Write-Host "Starting AgroNet frontend on http://127.0.0.1:5173"
Start-Process powershell -WorkingDirectory $frontend -ArgumentList @(
  "-NoExit",
  "-Command",
  "npx vite --host 127.0.0.1 --port 5173"
)

Write-Host ""
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://127.0.0.1:8000"
