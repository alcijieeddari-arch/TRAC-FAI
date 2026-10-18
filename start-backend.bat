@echo off
setlocal enabledelayedexpansion
echo ============================================
echo  TRA-FAI Voting System - Backend Startup
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
python --version

echo.
echo [2/4] Checking if backend is already running on port 5000...
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo  Backend is already running on port 5000. Nothing to do.
    echo  API: http://127.0.0.1:5000/api
    pause
    exit /b 0
)

echo.
echo [3/4] Installing / verifying dependencies...
pip install -r requirements.txt --quiet

echo.
echo [4/4] Starting Flask backend...
echo  API:     http://127.0.0.1:5000/api
echo  Health:  http://127.0.0.1:5000/api/health
echo ============================================
echo.
python app.py
pause
