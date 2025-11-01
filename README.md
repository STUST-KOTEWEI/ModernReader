# ModernReader Platform (Prototype)

This repository houses the ModernReader research platform spanning backend services, web frontend, Apple clients, and data/ops toolchains. The current prototype demonstrates:

- Persistent metadata catalog with multi-source ingestion and search filters
- Hybrid recommendation engine that considers learner language goals, emotional signals, and cultural metadata
- Session telemetry logging for emotion-aware adaptation
- Web dashboard (Vite + React) with catalog metasearch and recommendation panels
- E-paper publishing console with card preview & device queue
- Swift Package workspace (iOS/iPadOS/macOS/watchOS) ready to consume the same API stack
- CARE governance scaffolding across data, compliance, and ops directories

> For the full research blueprint and device roadmap see `Reader.me`.

## Quick Start

### Backend API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r <(poetry export --without-hashes)  # or `poetry install`
python scripts/seed_catalog.py  # optional sample data
uvicorn app.main:app --reload
```

Key endpoints will appear at `http://127.0.0.1:8000/docs`.

### Web Dashboard

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173` (Vite auto-shifts to the next free port if 5173 is busy).

Key tabs:
- **Dashboard**：推薦與情緒遙測視圖
- **Catalog**：多來源搜尋
- **E-Paper**：格式化內容、預覽卡片、發佈至電子紙裝置群組

### Apple Clients

Open `clients/apple/Package.swift` in Xcode and attach the provided libraries (`ModernReaderUI`, `ModernReaderServices`, `ModernReaderWatch`) to your multi-platform targets.

## Directory Map

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI services, SQLAlchemy models, ingestion scripts |
| `frontend/` | React/Vite dashboard with recommendation + catalog views |
| `clients/apple/` | Swift Package for Apple platforms |
| `data/` | Corpus ingestion, augmentation, LoRA artifacts |
| `ops/` | Deployment, observability, CARE compliance docs |
| `Reader.me` | Full bilingual blueprint of the research vision |

## Next Steps

- Integrate actual STT/TTS pipelines (Whisper + expressive TTS)
- Expand RAG pipeline with vector embeddings and LLM integration
- Hook emotion sensing signals from Apple Watch and other wearables
- Build CARE governance dashboards and consent management flows

Contributions welcome—prioritize community co-design and ethical safeguards while extending functionality.
