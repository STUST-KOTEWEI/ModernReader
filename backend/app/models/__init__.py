"""Aggregate models."""
from app.models.base import Base
from app.models.catalog import Book, CatalogSource
from app.models.consent import ConsentRecord
from app.models.recommendation import RecommendationEvent
from app.models.session import ReadingSession, SessionEvent
from app.models.user import User, UserRole
from app.models.epaper import EPaperJob, EPaperCard
from app.models.prototype import PrototypeInterest

__all__ = [
    "Base",
    "Book",
    "CatalogSource",
    "ConsentRecord",
    "RecommendationEvent",
    "ReadingSession",
    "SessionEvent",
    "User",
    "UserRole",
    "EPaperJob",
    "EPaperCard",
    "PrototypeInterest",
]
