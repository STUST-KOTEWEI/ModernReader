"""E-paper formatting and publishing service."""
from __future__ import annotations

import math
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.epaper import EPaperCard, EPaperJob
from app.schemas.epaper import (
    EPaperFormatRequest,
    EPaperFormatResponse,
    EPaperPublishRequest,
    EPaperPublishResponse,
    EPaperQueueResponse,
    EPaperSegment,
)


class EPaperService:
    def __init__(self, db: Session):
        self.db = db

    async def format_text(
        self, request: EPaperFormatRequest
    ) -> EPaperFormatResponse:
        raw_paragraphs = [
            p.strip() for p in request.text.split("\n") if p.strip()
        ]
        cards: list[EPaperSegment] = []
        card_index = 0
        for paragraph in raw_paragraphs:
            segments = self._split_paragraph(
                paragraph, request.max_chars_per_card
            )
            for segment in segments:
                heading = f"卡片 {card_index + 1}"
                highlights = self._extract_highlights(segment)
                cards.append(
                    EPaperSegment(
                        heading=heading,
                        body=segment,
                        highlights=highlights,
                        metadata={"contrast": "high", "layout": "text"},
                    )
                )
                card_index += 1
        return EPaperFormatResponse(
            title=request.title,
            cards=cards,
        )

    async def publish(
        self, request: EPaperPublishRequest
    ) -> EPaperPublishResponse:
        job = EPaperJob(
            title=request.title,
            device_group=request.device_group,
            valid_until=request.valid_until,
            status="queued",
        )
        self.db.add(job)
        self.db.flush()

        for index, card in enumerate(request.cards):
            db_card = EPaperCard(
                job=job,
                order_index=index,
                heading=card.heading,
                body=card.body,
                highlights=card.highlights,
                props=card.metadata,
            )
            self.db.add(db_card)

        self.db.commit()
        return EPaperPublishResponse(
            job_id=str(job.id),
            card_count=len(request.cards),
            status=job.status,
        )

    async def queue(
        self, device_id: str, since: datetime | None = None
    ) -> list[EPaperQueueResponse]:
        stmt = self.db.query(EPaperJob).order_by(EPaperJob.created_at.desc())
        jobs = stmt.all()
        responses: list[EPaperQueueResponse] = []
        for job in jobs:
            if since and job.created_at <= since:
                continue
            cards = [
                EPaperSegment(
                    heading=card.heading,
                    body=card.body,
                    highlights=card.highlights,
                    metadata=card.props,
                )
                for card in sorted(job.cards, key=lambda c: c.order_index)
            ]
            responses.append(
                EPaperQueueResponse(
                    job_id=str(job.id),
                    version=job.created_at.isoformat(),
                    cards=cards,
                )
            )
        return responses

    def _split_paragraph(self, paragraph: str, max_chars: int) -> list[str]:
        if len(paragraph) <= max_chars:
            return [paragraph]
        words = paragraph.split()
        segments: list[str] = []
        current: list[str] = []
        length = 0
        for word in words:
            if length + len(word) + (1 if current else 0) > max_chars:
                segments.append(" ".join(current))
                current = [word]
                length = len(word)
            else:
                current.append(word)
                length += len(word) + (1 if current[:-1] else 0)
        if current:
            segments.append(" ".join(current))
        return segments

    def _extract_highlights(self, text: str) -> list[str]:
        sentences = [s.strip() for s in text.split("。") if s.strip()]
        if not sentences:
            return []
        max_highlights = min(2, len(sentences))
        interval = max(1, math.floor(len(sentences) / max_highlights))
        return [
            sentences[i]
            for i in range(0, len(sentences), interval)
        ][:max_highlights]
