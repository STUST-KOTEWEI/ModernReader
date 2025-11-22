"""Application configuration primitives."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    PROJECT_NAME: str = "ModernReader"
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "sqlite:///./modernreader.db"
    VECTOR_DB_URL: str = "chroma://./vectors"
    CARE_DATA_RETENTION_DAYS: int = 30

    # LLM API Keys
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None

    # OAuth (Google/SheerID)
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    # e.g. https://<host>/api/v1/auth/oauth/google/callback
    OAUTH_REDIRECT_URL: str | None = None
    FRONTEND_REDIRECT_URL: str | None = None  # e.g. https://<host>/login
    SHEERID_CLIENT_ID: str | None = None
    SHEERID_CLIENT_SECRET: str | None = None

    # CORS/Hosts
    CORS_ALLOW_ORIGINS: str | None = None  # Comma-separated origins
    TRUSTED_HOSTS: str | None = None  # Comma-separated hosts

    # Pydantic v2: use model_config = ConfigDict(...)
    # instead of inner Config class
    model_config = SettingsConfigDict(env_file=".env")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
