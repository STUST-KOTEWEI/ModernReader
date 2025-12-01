"""Book utilities: generate summaries with LLM fallback."""
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_engine import MultimodalInput, WorldClassAIEngine
from app.core.llm_config import LLMProvider

router = APIRouter()


class BookSummaryRequest(BaseModel):
    title: str
    author: str | None = None
    description: str | None = None
    subjects: list[str] | None = None
    language: str | None = "en"


class BookSummaryResponse(BaseModel):
    summary: str
    provider: str
    model: str | None = None
    latency_ms: float | None = None
    is_mock: bool = False


@router.post("/books/summary", response_model=BookSummaryResponse)
async def summarize_book(req: BookSummaryRequest) -> BookSummaryResponse:
    """Generate a short, spoiler-light summary for a book."""
    system_prompt = (
        "You are a concise, spoiler-averse book summarizer. "
        "Write 2-3 short paragraphs that explain what the book is about, "
        "highlight themes and audience fit, but avoid major spoilers. "
        "Keep it clear, warm, and culturally respectful."
    )

    user_prompt = (
        f"Title: {req.title}\n"
        f"Author: {req.author or 'Unknown'}\n"
        f"Subjects: {', '.join(req.subjects) if req.subjects else 'Not provided'}\n"
        f"Language: {req.language or 'en'}\n"
        f"Given description (may be empty): {req.description or 'N/A'}\n\n"
        "Write a reader-friendly summary. Avoid spoilers. "
        "Suggest who might enjoy it."
    )

    # Try configured LLMs
    try:
        engine = WorldClassAIEngine()
        resp = await engine.understand(
            MultimodalInput(text=user_prompt),
            system_prompt=system_prompt,
        )
        provider = (
            resp.provider.value
            if isinstance(resp.provider, LLMProvider)
            else str(resp.provider)
        )
        return BookSummaryResponse(
            summary=resp.content.strip(),
            provider=provider,
            model=resp.model,
            latency_ms=resp.latency_ms,
            is_mock=False,
        )
    except Exception as e:
        # Fallback: return a mock summary so UI can still render
        fallback = (
            f"“{req.title}” explores its themes with a reader-friendly voice. "
            "Based on the provided metadata, expect a concise overview and approachable storytelling. "
            "Ideal for readers curious about this topic while waiting for full content."
        )
        return BookSummaryResponse(
            summary=fallback,
            provider="mock",
            model=None,
            latency_ms=None,
            is_mock=True,
        )
