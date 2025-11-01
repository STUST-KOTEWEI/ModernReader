"""Database engine and session management."""
from typing import Generator as _Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=(
        {"check_same_thread": False}
        if settings.DATABASE_URL.startswith("sqlite")
        else {}
    ),
    future=True,
)

# SessionLocal produces sqlalchemy.orm.Session instances
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


def get_db() -> _Generator[Session, None, None]:
    """Yield a SQLAlchemy Session, closing it after use.

    The return type is annotated as Generator[Session, None, None] so type
    checkers (mypy/IDE) know the yielded value is a Session instance.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
