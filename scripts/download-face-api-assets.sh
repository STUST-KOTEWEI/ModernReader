#!/usr/bin/env bash
set -euo pipefail

# Downloads face-api.js ESM bundle and minimal weights to frontend/public/models
# Usage: run from repo root
#   chmod +x scripts/download-face-api-assets.sh
#   ./scripts/download-face-api-assets.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PUB_DIR="$ROOT_DIR/frontend/public/models/face-api"
WEIGHTS_DIR="$PUB_DIR/weights"

mkdir -p "$WEIGHTS_DIR"

# Use @vladmandic/face-api (fork with better packaging & models)
CDN_BASE="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12"

# Files to download
UMD_FILE="dist/face-api.js"
TINY_MANIFEST="model/tiny_face_detector_model-weights_manifest.json"
TINY_BIN="model/tiny_face_detector_model.bin"
EXP_MANIFEST="model/face_expression_model-weights_manifest.json"
EXP_BIN="model/face_expression_model.bin"

fetch() {
  local url="$1"; shift
  local dest="$1"; shift
  echo "Downloading $url -> $dest"
  curl -fsSL "$url" -o "$dest"
}

# UMD bundle
fetch "$CDN_BASE/$UMD_FILE" "$PUB_DIR/face-api.js"

# Weights
fetch "$CDN_BASE/$TINY_MANIFEST" "$WEIGHTS_DIR/$(basename "$TINY_MANIFEST")"
fetch "$CDN_BASE/$TINY_BIN" "$WEIGHTS_DIR/$(basename "$TINY_BIN")"
fetch "$CDN_BASE/$EXP_MANIFEST" "$WEIGHTS_DIR/$(basename "$EXP_MANIFEST")"
fetch "$CDN_BASE/$EXP_BIN" "$WEIGHTS_DIR/$(basename "$EXP_BIN")"

echo "Done. Local assets placed under frontend/public/models/face-api"
