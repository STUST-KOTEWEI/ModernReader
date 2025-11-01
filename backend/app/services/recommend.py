"""Recommendation orchestration."""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.catalog import Book
from app.models.recommendation import RecommendationEvent
from app.models.session import ReadingSession, SessionEvent
from app.models.user import User
from app.schemas.recommend import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendedBook,
)


EMOTION_TOPIC_HINTS: dict[str, set[str]] = {
    "curious": {"science", "history", "knowledge"},
    "reflective": {"culture", "identity", "oral history"},
    "excited": {"festival", "adventure", "myth"},
    "calm": {"nature", "ecology", "wellbeing"},
}


@dataclass
class Candidate:
    book: Book
    score: float
    rationale: list[str]


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    async def recommend_books(
        self, request: RecommendationRequest
    ) -> RecommendationResponse:
        user = self._get_user(request.user_id)
        context_book = (
            self._get_book(request.context_book_id)
            if request.context_book_id
            else None
        )
        emotion = request.emotion_state or self._latest_emotion(
            request.user_id
        )

        candidates = self._initial_candidates(user)
        scored = [
            self._score_candidate(candidate, context_book, emotion, user)
            for candidate in candidates
        ]
        scored.sort(key=lambda c: c.score, reverse=True)

        top = scored[: request.limit]
        response = RecommendationResponse(
            recommendations=[
                RecommendedBook(
                    book_id=str(c.book.id),
                    title=c.book.title,
                    rationale="; ".join(c.rationale),
                    confidence=min(0.99, max(0.05, c.score)),
                )
                for c in top
            ]
        )

        self._log_event(str(user.id) if user else None, request, response)
        return response

    def _get_user(self, user_id: str | None) -> User | None:
        if not user_id:
            return None
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return None
        return self.db.get(User, uid)

    def _get_book(self, book_id: str | None) -> Book | None:
        if not book_id:
            return None
        try:
            bid = uuid.UUID(book_id)
        except ValueError:
            return None
        return self.db.get(Book, bid)

    def _latest_emotion(self, user_id: str | None) -> str | None:
        if not user_id:
            return None
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return None

        event = (
            self.db.query(SessionEvent)
            .join(ReadingSession)
            .filter(ReadingSession.user_id == user_uuid)
            .filter(SessionEvent.emotion.isnot(None))
            .order_by(SessionEvent.created_at.desc())
            .first()
        )
        return event.emotion if event else None

    def _initial_candidates(self, user: User | None) -> list[Candidate]:
        stmt = self.db.query(Book)
        if user and user.language_goal:
            stmt = stmt.filter(Book.language == user.language_goal)
        books = stmt.all()
        return [
            Candidate(book=b, score=0.1, rationale=["Core catalog pick"])
            for b in books
        ]

    def _score_candidate(
        self,
        candidate: Candidate,
        context_book: Book | None,
        emotion: str | None,
        user: User | None,
    ) -> Candidate:
        book = candidate.book
        score = candidate.score
        rationale = list(candidate.rationale)

        if user and user.language_goal and book.language == user.language_goal:
            score += 0.25
            rationale.append(f"Matches language goal {user.language_goal}")

        if context_book:
            overlap = set(book.topics) & set(context_book.topics)
            if overlap:
                boost = 0.2 + 0.05 * len(overlap)
                score += boost
                rationale.append(f"Shares themes: {', '.join(overlap)}")

        if emotion:
            hints = EMOTION_TOPIC_HINTS.get(emotion.lower())
            if hints:
                if set(book.topics) & hints:
                    score += 0.15
                    rationale.append(f"Aligns with {emotion} mood")

        if book.extra_metadata:
            metadata = book.extra_metadata

            if metadata.get("award_winning"):
                score += 0.05
                rationale.append("Award winning")

            epaper_score = self._epaper_adaptability(metadata)
            if epaper_score:
                score += epaper_score
                rationale.append("適合電子紙呈現")

        candidate.score = score
        candidate.rationale = rationale
        return candidate

    def _epaper_adaptability(self, metadata: dict[str, Any]) -> float:
        layout = metadata.get("layout", "text")
        length = metadata.get("reading_level", "intermediate")
        score = 0.0
        if layout == "text":
            score += 0.08
        if length == "beginner":
            score += 0.05
        return score

    def _log_event(
        self,
        user_id: str | None,
        request: RecommendationRequest,
        response: RecommendationResponse,
    ) -> None:
        if not user_id:
            return
        if isinstance(user_id, uuid.UUID):
            user_uuid = user_id
        else:
            try:
                user_uuid = uuid.UUID(user_id)
            except (ValueError, TypeError):
                return

        event = RecommendationEvent(
            user_id=user_uuid,
            request_payload=request.model_dump(),
            response_payload=response.model_dump(),
        )
        self.db.add(event)
        self.db.commit()
