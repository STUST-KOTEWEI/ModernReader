"""User model."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON # For generic JSON type

from app.models.base import Base


class UserRole(enum.Enum):
    LEARNER = "learner"
    MENTOR = "mentor"
    RESEARCHER = "researcher"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole),
        default=UserRole.LEARNER,
        nullable=False
    )
    language_goal: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    cultural_preferences: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False) # Gamification points
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False) # Gamification level
    username: Mapped[str | None] = mapped_column(
        String(64), unique=True, nullable=True, index=True
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
