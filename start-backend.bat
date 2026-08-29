@echo off
echo ============================================
echo  TRAC-FAI Voting System - Backend Startup
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/3] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies...
pip install -r requirements.txt --quiet

echo.
echo [3/3] Seeding database (first run only)...
python seed.py

echo.
echo ============================================
echo  Starting Flask API server on port 5000...
echo  API: http://localhost:5000/api
echo ============================================
echo.
python app.py
pause
