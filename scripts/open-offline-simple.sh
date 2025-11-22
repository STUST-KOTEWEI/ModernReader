#!/usr/bin/env bash
set -e

# Simple offline demo: build and open index.html directly
# Note: May have ES module limitations in some browsers with file:// protocol

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
FRONTEND_DIR="${ROOT_DIR}/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"
INDEX_FILE="${DIST_DIR}/index.html"

echo "🧩 Building frontend for offline demo..."
cd "$FRONTEND_DIR"
npm run build

if [ ! -f "$INDEX_FILE" ]; then
  echo "❌ Build failed: index.html not found at $INDEX_FILE"
  exit 1
fi

echo "✅ Build complete"
echo "🌐 Opening index.html in browser..."

# Open in browser with ?demo=1 query param
if command -v open >/dev/null 2>&1; then
  # macOS
  open "$INDEX_FILE"
elif command -v xdg-open >/dev/null 2>&1; then
  # Linux
  xdg-open "$INDEX_FILE"
else
  echo "Please open: $INDEX_FILE"
fi

echo ""
echo "📝 Note: If you see a blank page, use ./scripts/open-offline.sh instead"
echo "   (starts a local server to avoid file:// protocol limitations)"
