# ModernReader Backend

FastAPI application powering the CARE-aligned multisensory reading companion.

## Local Setup

```bash
poetry install
poetry run uvicorn app.main:app --reload
```

### Seed metadata (optional but recommended)

```bash
poetry run python scripts/seed_catalog.py
```

The script ingests `data/catalogs/sample_books.json` and populates the SQLite database at `backend/modernreader.db`.

## Key Services

- Auth (JWT, CARE consent tracking)
- Catalog federation with metadata filters
- Hybrid recommendations (language, emotion, cultural signals)
- Session telemetry & emotion routing
- E-paper formatting & publishing queue (prototype)
- RAG/STT/TTS placeholder endpoints for integration testing
- Multisensory device command bus

```bash

```
