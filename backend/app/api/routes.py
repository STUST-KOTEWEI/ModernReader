"""Route registration for modular API routers."""
from fastapi import APIRouter, FastAPI

from app.api.v1 import (
    ai,
    audio,
    auth,
    catalog,
    purchase,
    health,
    cognitive,
    crowdsourcing,
    epaper,
    indigenous,
    indigenous_chat,
    prototype,
    users,
    docs,
    books,
    rag,
    rag_extended,
    recommend,
    recommender,
    senses,
    sessions,
    chat, # Import the new chat router
    gamification, # Import the new gamification router
    academic, # Import the new academic router
)


def register(app: FastAPI) -> None:
    router = APIRouter(prefix="/api")
    router.include_router(auth.router, prefix="/v1/auth", tags=["auth"])
    router.include_router(
        catalog.router, prefix="/v1/catalog", tags=["catalog"]
    )
    router.include_router(
        purchase.router, prefix="/v1", tags=["purchase"]
    )
    router.include_router(
        health.router, prefix="/v1", tags=["health"]
    )
    router.include_router(
        recommend.router, prefix="/v1/recommend", tags=["recommend"]
    )
    router.include_router(
        sessions.router, prefix="/v1/sessions", tags=["sessions"]
    )
    router.include_router(
        epaper.router, prefix="/v1/epaper", tags=["epaper"]
    )
    router.include_router(rag.router, prefix="/v1/rag", tags=["rag"])
    router.include_router(
        rag_extended.router, prefix="/v1/rag", tags=["rag"]
    )
    router.include_router(
        recommender.router,
        prefix="/v1/recommender",
        tags=["recommender"]
    )
    router.include_router(
        cognitive.router, prefix="/v1/cognitive", tags=["cognitive"]
    )
    router.include_router(audio.router, prefix="/v1/audio", tags=["audio"])
    router.include_router(
        senses.router, prefix="/v1/senses", tags=["senses"]
    )
    router.include_router(ai.router, prefix="/v1/ai", tags=["ai"])
    router.include_router(users.router, prefix="/v1/users", tags=["users"])
    router.include_router(books.router, prefix="/v1", tags=["books"])
    router.include_router(
        indigenous.router,
        prefix="/v1/indigenous",
        tags=["indigenous"]
    )
    router.include_router(
        indigenous_chat.router,
        prefix="/v1",
        tags=["indigenous-chat"]
    )
    router.include_router(
        docs.router,
        prefix="/v1",
        tags=["docs"]
    )
    router.include_router(
        prototype.router,
        prefix="/v1/prototype",
        tags=["prototype"],
    )
    router.include_router(chat.router, prefix="/v1", tags=["chat"])
    router.include_router(gamification.router, prefix="/v1/gamification", tags=["gamification"]) # Add the new gamification router
    router.include_router(academic.router, prefix="/v1/academic", tags=["academic"])
    app.include_router(router)
    # Crowdsourcing router has its own prefix, register directly
    app.include_router(crowdsourcing.router)
