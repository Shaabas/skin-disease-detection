#!/bin/bash
# ============================================================
# DermAI — Skin Disease Classifier Startup Script
# ============================================================

set -e

echo ""
echo "🔬 DermAI — Skin Disease Classifier"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Determine Python command
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION found"

# Setup/Activate virtual environment at root
VENV_DIR="$ROOT_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment at $VENV_DIR..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activation (Handle Windows/Bash vs Linux/Unix)
if [ -f "$VENV_DIR/Scripts/activate" ]; then
    source "$VENV_DIR/Scripts/activate"
elif [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
else
    echo "❌ Could not find venv activation script."
    exit 1
fi

echo "✅ Virtual environment activated"

# Install dependencies if requirements.txt exists in backend
if [ -f "backend/requirements.txt" ]; then
    echo "📥 Checking dependencies..."
    pip install --quiet --upgrade pip
    pip install --quiet -r backend/requirements.txt
    echo "✅ Dependencies ready"
fi

# Create uploads directory in backend
mkdir -p backend/uploads
echo "✅ Upload directory ready"

# Start Flask server
echo ""
echo "🚀 Starting Flask API server..."
echo "   → API: http://localhost:5000"
echo "   → Frontend: Open frontend/index.html in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$ROOT_DIR/backend"
python app.py

