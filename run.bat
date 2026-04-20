@echo off
title The Grand Archive — Launcher
color 0B

echo.
echo  ==========================================
echo    THE GRAND ARCHIVE — Startup Sequence
echo  ==========================================
echo.

:: ── Check Python ────────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ from https://python.org
    pause & exit /b 1
)

:: ── Check Node ───────────────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install Node 18+ from https://nodejs.org
    pause & exit /b 1
)

echo  [OK] Python and Node.js detected.
echo.

:: ── Backend Setup ────────────────────────────────────────────────────────────
echo  [1/5] Setting up Python virtual environment...
cd /d "%~dp0backend"

if not exist "venv" (
    python -m venv venv
    echo  [OK] Virtual environment created.
) else (
    echo  [OK] Virtual environment already exists.
)

call venv\Scripts\activate.bat

echo  [2/5] Installing Python dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo  [ERROR] pip install failed. Check your internet connection.
    pause & exit /b 1
)
echo  [OK] Python dependencies installed.

echo  [3/5] Seeding database with admin account...
python seed.py
echo  [OK] Database ready.

:: ── Frontend Setup ───────────────────────────────────────────────────────────
echo  [4/5] Installing Node.js dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    npm install --silent
    if errorlevel 1 (
        echo  [ERROR] npm install failed. Check your internet connection.
        pause & exit /b 1
    )
    echo  [OK] Node dependencies installed.
) else (
    echo  [OK] Node modules already installed.
)

:: ── Launch Both Servers ──────────────────────────────────────────────────────
echo  [5/5] Launching servers...
echo.
echo  ==========================================
echo    Backend  → http://localhost:8000
echo    Frontend → http://localhost:5173
echo    API Docs → http://localhost:8000/docs
echo.
echo    Default login: admin / password
echo  ==========================================
echo.

:: Start backend in new window
start "Grand Archive — Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000"
:: Wait a moment then start frontend
timeout /t 3 /nobreak >nul

start "Grand Archive — Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Open browser after brief delay
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
