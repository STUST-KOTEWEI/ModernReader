"""User settings model."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    default_language: Mapped[str | None] = mapped_column(
        String(16), nullable=True
    )
    tts_voice: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    romanization_scheme: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    autoplay_tts: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    learning_opt_in: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    preferences: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )

    user = relationship("User")
