# ExpensiveMail One-Click Offline Launcher
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location $PSScriptRoot
Write-Host "Starting ExpensiveMail Offline Server on http://localhost:3000..." -ForegroundColor Green
Start-Process "http://localhost:3000"
node dist/server.cjs
