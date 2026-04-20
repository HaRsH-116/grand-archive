#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "  =========================================="
echo "    THE GRAND ARCHIVE — Startup Sequence"
echo "  =========================================="
echo ""

# ── Dependency checks ──────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || { echo "[ERROR] python3 not found."; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "[ERROR] node not found.";    exit 1; }
command -v npm     >/dev/null 2>&1 || { echo "[ERROR] npm not found.";     exit 1; }
echo "  [OK] python3, node, npm detected."

# ── Backend ────────────────────────────────────────────────────────────────
cd "$ROOT/backend"

if [ ! -d "venv" ]; then
    echo "  [1/5] Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate

echo "  [2/5] Installing Python dependencies..."
pip install -r requirements.txt -q

echo "  [3/5] Seeding database..."
python3 seed.py

# ── Frontend ───────────────────────────────────────────────────────────────
cd "$ROOT/frontend"

echo "  [4/5] Installing Node dependencies..."
[ ! -d "node_modules" ] && npm install --silent

# ── Launch ─────────────────────────────────────────────────────────────────
echo "  [5/5] Starting servers..."
echo ""
echo "  =========================================="
echo "    Backend  → http://localhost:8000"
echo "    Frontend → http://localhost:5173"
echo "    API Docs → http://localhost:8000/docs"
echo "    Login    → admin / password"
echo "  =========================================="
echo ""

cd "$ROOT/backend"
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

# Open browser (macOS / Linux)
sleep 5
if command -v open >/dev/null 2>&1; then
    open "http://localhost:5173"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173"
fi

echo "  PIDs: backend=$BACKEND_PID  frontend=$FRONTEND_PID"
echo "  Press Ctrl+C to stop both."
wait $BACKEND_PID $FRONTEND_PID
