@echo off
:: Auto-start script — runs silently in background at Windows login
:: Registered by setup-autostart.bat

cd /d "%~dp0backend"

:: Wait 10 seconds for network/services to stabilize
timeout /t 10 /nobreak >nul

:: Kill any old stuck instance on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Start Flask silently
start /b python app.py > "%~dp0backend\server.log" 2>&1
