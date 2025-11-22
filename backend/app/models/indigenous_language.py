"""Custom indigenous language registry model."""
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, JSON, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class IndigenousLanguageProfile(Base):
    __tablename__ = "indigenous_languages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    region: Mapped[str | None] = mapped_column(String(128))
    family: Mapped[str | None] = mapped_column(String(64))
    script: Mapped[str | None] = mapped_column(String(64))
    aliases: Mapped[list[str] | None] = mapped_column(JSON)
    lang_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    is_custom: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
