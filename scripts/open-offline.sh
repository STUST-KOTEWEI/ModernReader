#!/usr/bin/env bash
set -euo pipefail

# Build the frontend and serve it via local preview server for offline demo.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo "🧩 Building frontend for offline demo..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm ci || npm install
fi
# Clean old build to avoid stale hashed assets
rm -rf dist
npm run build

# Use vite preview to serve dist over http for ES modules to work in browsers.
# Try multiple ports in case of conflicts
PORT_CANDIDATES=("${PORT:-5174}" 5175 5176)
for PORT in "${PORT_CANDIDATES[@]}"; do
  echo "🗂  Attempting to start preview server on port ${PORT}..."
  
  # Check if port is already in use
  if lsof -Pi :"${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port ${PORT} already in use, trying next..."
    continue
  fi
  
  # Start preview server in background
  # Start with strictPort so we know which port we got, and disable caching in URL to bust browser cache
  npx vite preview --port "${PORT}" --strictPort --host 127.0.0.1 > /tmp/vite-preview-${PORT}.log 2>&1 &
  PREVIEW_PID=$!
  
  echo "⏳ Waiting for server to be ready..."
  # Wait for server to start (max 10 seconds)
  for i in {1..20}; do
    if curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
      echo "✅ Server ready at http://localhost:${PORT}"
      break
    fi
    sleep 0.5
  done
  
  # Verify server is actually running
  if ! curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
    echo "❌ Server failed to start on port ${PORT}"
  kill "$PREVIEW_PID" 2>/dev/null || true
    continue
  fi
  
  # Open browser
  TS=$(date +%s)
  URL="http://localhost:${PORT}/?demo=1&v=${TS}"
  echo "🌐 Opening browser at ${URL}"
  if command -v open >/dev/null 2>&1; then
    open "${URL}"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${URL}"
  else
    echo "Please open ${URL} in your browser"
  fi
  
  echo ""
  echo "✅ Preview server running (PID: ${PREVIEW_PID})"
  echo "📝 Log: /tmp/vite-preview-${PORT}.log"
  echo "🛑 Press Ctrl+C to stop the server"
  echo ""
  
  # Keep script running and handle cleanup on exit
  trap "echo ''; echo '🛑 Stopping server...'; kill \"${PREVIEW_PID}\" 2>/dev/null || true; echo '✅ Offline demo closed.'; exit 0" INT TERM EXIT
  
  # Wait for the preview server process
  wait "$PREVIEW_PID"
  exit 0
done

echo "❌ Failed to start preview server on any candidate port."
echo "   You can try: PORT=8080 $0"
exit 1
