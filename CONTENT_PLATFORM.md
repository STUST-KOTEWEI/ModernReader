# ModernReader Content Platform

This document outlines the ingestion, TTS podcast generation, unlocking, and scaling plan to 100k items.

## Ingestion

- Sources: provider-based crawlers under `data/ingestion/providers` (OpenLibrary, NDL, etc.) orchestrated by `auto_crawl.py` and `sources.yaml`.
- Upload API: `POST /api/v1/catalog/upload-content` accepts `{ book_id, text, format }` and stores `BookContent` + `BookChapter` by simple splitting rules.
- Roadmap: add EPUB/PDF parsing using `ebooklib` and `pypdf` (optional deps) and OCR for images.

## TTS Podcast Generation

- Service: `PodcastService` uses Azure Speech if configured via env:
  - `TTS_PROVIDER=azure`
  - `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, optional `AZURE_SPEECH_VOICE`
- Endpoints:
  - `POST /api/v1/catalog/chapters/{chapter_id}/generate-podcast` → creates WAV and sets `podcast_url`.
  - `GET /api/v1/catalog/chapters/{chapter_id}/audio` → streams audio.
- Fallback: local provider intentionally omitted to avoid platform-specific deps; plug in later if needed.

## Purchase & Unlock

- `POST /api/v1/purchase` creates a demo purchase and returns an unlock code.
- `GET /api/v1/unlock` redeems a code; marks usages and returns `unlocked=true` if valid.
- Future: integrate Stripe/TapPay and attach webhooks to mark purchases complete.

## Frontend Player

- Recommendations modal displays chapter list, plays audio via `<audio>` tag, and includes unlock UI.
- Uses `catalogClient.listChapters`, `catalogClient.generateChapterPodcast`, and `purchaseClient.unlock`.

## Scaling to 100k

- Batch crawling with dedup fingerprints (title+author+ISBN normalized).
- Store content in object storage (S3/Azure Blob) instead of local disk; keep DB rows for metadata.
- Use background workers/queues for TTS generation and ingestion (e.g., Celery/RQ/GH Actions).
- Shard chapter generation, cache audio via CDN, and add retries/backoff for provider APIs.

## Notes

- Remember to install `azure-cognitiveservices-speech` in backend environment when using Azure TTS.
- For PDFs/EPUBs, add optional dependencies and a safer parser with size limits and validation.
