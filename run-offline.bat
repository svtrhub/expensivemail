@echo off
title ExpensiveMail Offline Server
echo ===================================================
echo   ExpensiveMail - Offline Server Launcher
echo ===================================================
echo.
echo Starting production Express server on http://localhost:3000...
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
timeout /t 2 /nobreak >nul
start http://localhost:3000
node dist/server.cjs
