"""LLM configuration and provider management."""
from enum import Enum

from pydantic import BaseModel, Field

from app.core.config import settings


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"


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

    # Default models
    default_text_model: str = "gpt-4o"
    default_vision_model: str = "gpt-4o"
    default_embedding_model: str = "text-embedding-3-large"

    # Provider preferences (fallback order)
    provider_priority: list[LLMProvider] = [
        LLMProvider.OPENAI,
        LLMProvider.ANTHROPIC,
        LLMProvider.GOOGLE,
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
    return LLMConfig(
        openai_api_key=getattr(settings, "OPENAI_API_KEY", None),
        anthropic_api_key=getattr(settings, "ANTHROPIC_API_KEY", None),
        google_api_key=getattr(settings, "GOOGLE_API_KEY", None),
    )
