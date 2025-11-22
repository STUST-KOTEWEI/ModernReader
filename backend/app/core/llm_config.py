"""LLM configuration and provider management."""
from enum import Enum

from pydantic import BaseModel, Field

from app.core.config import settings


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    GPT_OSS = "gpt_oss"


class LLMConfig(BaseModel):
    """Configuration for LLM providers."""

    # API Keys (from environment)
    openai_api_key: str | None = Field(
        default=None, description="OpenAI API key"
    )
    anthropic_api_key: str | None = Field(
        default=None, description="Anthropic API key"
    )
    google_api_key: str | None = Field(
        default=None, description="Google AI API key"
    )
    oss_api_base: str | None = Field(
        default=None, description="Self-hosted OpenAI compatible API base"
    )
    oss_api_key: str | None = Field(
        default=None, description="Self-hosted API key (optional)"
    )
    oss_text_model: str | None = Field(
        default=None, description="Default OSS text model"
    )
    oss_vision_model: str | None = Field(
        default=None, description="Default OSS vision model"
    )
    oss_transcribe_model: str | None = Field(
        default=None, description="OSS transcription model"
    )

    # Default models
    default_text_model: str = "gpt-4o"
    default_vision_model: str = "gpt-4o"
    default_embedding_model: str = "text-embedding-3-large"

    # Provider preferences (fallback order)
    provider_priority: list[LLMProvider] = [
        LLMProvider.OPENAI,
        LLMProvider.ANTHROPIC,
        LLMProvider.GOOGLE,
        LLMProvider.GPT_OSS,
    ]

    # Rate limits
    max_tokens: int = 4096
    temperature: float = 0.7
    timeout: int = 30

    # Cost tracking
    enable_cost_tracking: bool = True

    class Config:
        """Pydantic config."""

        use_enum_values = True


def get_llm_config() -> LLMConfig:
    """Get LLM configuration from settings."""
    provider_priority: list[LLMProvider] = [
        LLMProvider.OPENAI,
        LLMProvider.ANTHROPIC,
        LLMProvider.GOOGLE,
        LLMProvider.GPT_OSS,
    ]

    if settings.LLM_PROVIDER_PRIORITY:
        overrides: list[LLMProvider] = []
        for item in settings.LLM_PROVIDER_PRIORITY.split(","):
            name = item.strip()
            if not name:
                continue
            try:
                overrides.append(LLMProvider(name))
            except ValueError:
                continue
        if overrides:
            provider_priority = overrides

    return LLMConfig(
        openai_api_key=getattr(settings, "OPENAI_API_KEY", None),
        anthropic_api_key=getattr(settings, "ANTHROPIC_API_KEY", None),
        google_api_key=getattr(settings, "GOOGLE_API_KEY", None),
        oss_api_base=getattr(settings, "OSS_API_BASE", None),
        oss_api_key=getattr(settings, "OSS_API_KEY", None),
        oss_text_model=getattr(settings, "OSS_TEXT_MODEL", None),
        oss_vision_model=getattr(settings, "OSS_VISION_MODEL", None),
        oss_transcribe_model=getattr(settings, "OSS_TRANSCRIBE_MODEL", None),
        provider_priority=provider_priority,
    )
