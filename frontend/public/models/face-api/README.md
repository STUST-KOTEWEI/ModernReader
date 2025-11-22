# face-api.js local assets

This app prefers using locally hosted face-api.js ESM bundle and model weights to avoid CDN/network instability.

Structure expected by the app (served via Vite static `public/`):

- public/models/face-api/
  - face-api.js (UMD bundle from @vladmandic/face-api)
  - weights/
    - tiny_face_detector_model-weights_manifest.json
    - tiny_face_detector_model.bin
    - face_expression_model-weights_manifest.json
    - face_expression_model.bin

How to download these files (recommended):

1) Use the helper script from repo root:
   ./scripts/download-face-api-assets.sh

2) Restart the Vite dev server and open /app/emotion again.

Notes:

- If files are missing, the app will attempt to fall back to CDN: <https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12>
- Local hosting improves reliability and avoids CORS/CDN issues.
- Using @vladmandic/face-api fork which has better model packaging than original justadudewhohacks version.
