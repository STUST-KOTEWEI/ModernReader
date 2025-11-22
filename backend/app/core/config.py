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
    OSS_API_BASE: str | None = None
    OSS_API_KEY: str | None = None
    OSS_TEXT_MODEL: str | None = None
    OSS_VISION_MODEL: str | None = None
    OSS_TRANSCRIBE_MODEL: str | None = None
    LLM_PROVIDER_PRIORITY: str | None = None

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

    # TTS / Podcast
    TTS_PROVIDER: str | None = None  # azure|local
    AZURE_SPEECH_KEY: str | None = None
    AZURE_SPEECH_REGION: str | None = None
    AZURE_SPEECH_VOICE: str | None = None  # e.g., zh-TW-HsiaoChenNeural

    # CAPTCHA
    CAPTCHA_PROVIDER: str | None = None  # turnstile|recaptcha
    CAPTCHA_REQUIRED: bool = False
    TURNSTILE_SECRET_KEY: str | None = None
    RECAPTCHA_SECRET_KEY: str | None = None

    # Email verification (optional)
    EMAIL_VERIFICATION_REQUIRED: bool = False
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None

    # Pydantic v2: use model_config = ConfigDict(...)
    # instead of inner Config class
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
