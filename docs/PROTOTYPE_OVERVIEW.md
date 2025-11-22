# ModernReader Prototype Showcase

This repository now ships a recruit-ready prototype that demos the flexible e-paper experience, Podcast automation, hyRead-grade DRM, and multi-persona AI companion from the research blueprint.

## Components

| Layer | What’s New | Path |
| --- | --- | --- |
| REST API | `/api/v1/prototype/overview` serves a structured payload (hero copy, features, timeline, tech stack). `/api/v1/prototype/interests` upserts collaborator submissions into SQLite. | `backend/app/api/v1/prototype.py` |
| Data Model | `prototype_interests` table stores signups with name, email, role, focus area, message & timestamps. | `backend/app/models/prototype.py` |
| Frontend | `/prototype` public route renders a cinematic showcase with interactive previews + waitlist form. Submissions call the API above with graceful offline fallback. | `frontend/src/pages/PrototypeShowcasePage.tsx` |
| Navigation | Home hero CTA + sidebar link drive traffic to the prototype. | `frontend/src/pages/HomePage.tsx`, `frontend/src/components/Sidebar.tsx` |

## Running the demo

```bash
# 1. Start backend + frontend (uses start-simple.sh helper)
./start-simple.sh

# Backend REST docs
open http://localhost:8001/docs

# Frontend UI
open http://localhost:5173           # public home + /prototype
open http://localhost:5173/prototype # direct deep-link
```

If you’re offline (or opening `index.html` via `file://`), the frontend auto-falls-back to demo data while still wiring the full flows.

## Suggested demo flow

1. Visit `/prototype` without logging in. Walk through:
   - Hero copy + stats (16 languages, 134-week plan, hardware split)
   - “核心模組” cards (flex e-paper, auto podcast, DRM, AI companion, indigenous toolchain, device cloud)
   - Interactive preview tabs (device, podcast, DRM, AI) with actions
   - Sweet / Podcast / DRM / AI flows & 134-week timeline
   - Tech stack + CTA (email, Discord, deck link)
2. Submit interest via the form. Records land in `backend/modernreader.db` (`prototype_interests` table). Re-submit with same email to test upsert.
3. Login (or sign up) and jump into `/app/tour` or other tabs for deeper system view.

## Extending

- Edit `backend/app/api/v1/prototype.py` to tweak copy, stats, or add additional preview modes.
- Style / restructure `frontend/src/pages/PrototypeShowcasePage.tsx` for branded pitch decks (all sections rely on the API payload).
- Query stored interests using any SQLite tool:  
  `sqlite3 backend/modernreader.db 'select * from prototype_interests order by created_at desc;'`

Happy demoing ✨
