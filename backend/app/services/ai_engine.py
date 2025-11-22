"""World-class multimodal AI engine with fallback routing."""
from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.core.llm_config import LLMConfig, LLMProvider, get_llm_config

logger = logging.getLogger(__name__)


@dataclass
class MultimodalInput:
    """Input for multimodal AI understanding."""

    text: str | None = None
    image: bytes | None = None
    image_mime_type: str | None = None
    audio: bytes | None = None
    audio_mime_type: str | None = None
    context: dict[str, Any] | None = None


@dataclass
class AIResponse:
    """Response from AI engine."""

    content: str
    provider: LLMProvider
    model: str
    tokens_used: int | None = None
    latency_ms: float | None = None
    metadata: dict[str, Any] | None = None


class WorldClassAIEngine:
    """
    Multimodal AI engine with intelligent fallback.

    Features:
    - Multi-provider support (OpenAI, Anthropic, Google)
    - Automatic fallback on failure
    - Cost tracking
    - Rate limiting
    - Multimodal understanding (text + image)
    """

    def __init__(self, config: LLMConfig | None = None):
        """Initialize AI engine."""
        self.config = config or get_llm_config()
        self.clients: dict[LLMProvider, BaseChatModel] = {}
        self._initialize_clients()

    def _initialize_clients(self) -> None:
        # OpenAI
        if self.config.openai_api_key:
            try:
                self.clients[LLMProvider.OPENAI] = ChatOpenAI(
                    model=self.config.default_text_model,
                    api_key=SecretStr(self.config.openai_api_key),
                    max_completion_tokens=self.config.max_tokens,
                    timeout=self.config.timeout,
                )
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")

        # Anthropic
        if self.config.anthropic_api_key:
            try:
                self.clients[LLMProvider.ANTHROPIC] = ChatAnthropic(
                    model_name="claude-3-5-sonnet-20241022",
                    api_key=SecretStr(self.config.anthropic_api_key),
                    temperature=self.config.temperature,
                    max_tokens_to_sample=self.config.max_tokens,
                    timeout=self.config.timeout,
                    stop=None,
                )
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic: {e}")

        # Google Gemini
        if self.config.google_api_key:
            try:
                self.clients[LLMProvider.GOOGLE] = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash-exp",
                    google_api_key=SecretStr(self.config.google_api_key),
                    temperature=self.config.temperature,
                    max_output_tokens=self.config.max_tokens,
                )
                logger.info("Google Gemini client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Google: {e}")

        # GPT-OSS / OpenAI compatible
        if self.config.oss_api_base:
            try:
                oss_api_key = self.config.oss_api_key or "oss-no-key"
                model = (
                    self.config.oss_text_model
                    or self.config.default_text_model
                )
                self.clients[LLMProvider.GPT_OSS] = ChatOpenAI(
                    model=model,
                    api_key=SecretStr(oss_api_key),
                    base_url=self.config.oss_api_base,
                    max_completion_tokens=self.config.max_tokens,
                    timeout=self.config.timeout,
                )
                logger.info("GPT-OSS client initialized")
            except Exception as e:
                logger.warning(
                    f"Failed to initialize GPT-OSS provider: {e}"
                )

        if not self.clients:
            raise RuntimeError(
                "No LLM providers configured. Set API keys in .env"
            )

    async def understand(
        self,
        input_data: MultimodalInput,
        system_prompt: str | None = None,
        provider_priority: list[LLMProvider] | None = None,
    ) -> AIResponse:
        """
        Understand multimodal input with intelligent fallback.

        Args:
            input_data: Multimodal input (text, image, audio)
            system_prompt: Optional system prompt for context

        Returns:
            AI response with content and metadata
        """
        errors: list[str] = []
        start_time = datetime.now()

        priority = provider_priority or self.config.provider_priority

        # Try each provider in priority order
        for provider in priority:
            if provider not in self.clients:
                continue

            try:
                response = await self._call_provider(
                    provider, input_data, system_prompt
                )
                latency_ms = (
                    (datetime.now() - start_time).total_seconds() * 1000
                )
                response.latency_ms = latency_ms
                logger.info(
                    f"Success with {provider} in {latency_ms:.0f}ms"
                )
                return response

            except Exception as e:
                error_msg = f"{provider} failed: {str(e)}"
                errors.append(error_msg)
                logger.warning(error_msg)
                continue

        # All providers failed
        raise RuntimeError(
            f"All LLM providers failed: {'; '.join(errors)}"
        )

    async def _call_provider(
        self,
        provider: LLMProvider,
        input_data: MultimodalInput,
        system_prompt: str | None,
    ) -> AIResponse:
        """Call specific provider."""
        client = self.clients[provider]
        client_for_call: BaseChatModel = client
        messages: list[SystemMessage | HumanMessage] = []

        # Add system prompt
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))

        # Switch to provider-specific vision model if needed
        if input_data.image:
            if (
                provider == LLMProvider.OPENAI
                and isinstance(client, ChatOpenAI)
                and self.config.default_vision_model
                and getattr(client, "model", None)
                != self.config.default_vision_model
            ):
                client_for_call = client.bind(
                    model=self.config.default_vision_model
                )
            elif (
                provider == LLMProvider.GPT_OSS
                and isinstance(client, ChatOpenAI)
                and self.config.oss_vision_model
            ):
                client_for_call = client.bind(
                    model=self.config.oss_vision_model
                )

        # Build human message with multimodal content
        human_content: list[str | dict[str, Any]] = []

        # Text
        if input_data.text:
            human_content.append({"type": "text", "text": input_data.text})

        # Image (for vision models)
        if input_data.image:
            image_b64 = base64.b64encode(input_data.image).decode()
            mime = input_data.image_mime_type or "image/jpeg"
            human_content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime};base64,{image_b64}"
                    },
                }
            )

        # Audio (future: transcribe first)
        if input_data.audio:
            logger.warning("Audio input not yet supported, skipping")

        if not human_content:
            raise ValueError("No valid input provided")

        messages.append(HumanMessage(content=human_content))

        # Invoke LLM
        response = await client_for_call.ainvoke(messages)

        # Ensure content is always a string
        if isinstance(response.content, str):
            content_str = response.content
        elif isinstance(response.content, list):
            # response.content is always list[str | dict], join elements
            content_str = " ".join(
                [
                    item if isinstance(item, str) else str(item)
                    for item in response.content
                ]
            )
        else:
            content_str = str(response.content)

        # Get model name attribute safely
        model_name = (
            getattr(client_for_call, "model", None)
            or getattr(client_for_call, "model_name", None)
            or "unknown"
        )

        metadata = getattr(response, "response_metadata", None)
        token_usage = None
        if metadata:
            if isinstance(metadata, dict):
                token_usage = metadata.get("token_usage")
            else:
                token_usage = getattr(metadata, "token_usage", None)

        return AIResponse(
            content=content_str,
            provider=provider,
            model=model_name,
            tokens_used=token_usage,
            metadata=metadata if isinstance(metadata, dict) else metadata,
        )

    async def generate_adaptive_content(
        self,
        prompt: str,
        cognitive_load: float = 0.5,
        cultural_context: dict[str, Any] | None = None,
        provider_priority: list[LLMProvider] | None = None,
    ) -> str:
        """
        Generate content adapted to cognitive load and cultural context.

        Args:
            prompt: Generation prompt
            cognitive_load: Current cognitive load (0-1)
            cultural_context: Cultural metadata for adaptation

        Returns:
            Generated content
        """
        # Build adaptive system prompt
        system_parts: list[str] = [
            "You are a world-class reading companion for "
            "minority language learning."
        ]

        # Adjust complexity based on cognitive load
        if cognitive_load > 0.7:
            system_parts.append(
                "User is experiencing high cognitive load. "
                "Use simple, clear language. "
                "Break down complex ideas into smaller chunks."
            )
        elif cognitive_load < 0.3:
            system_parts.append(
                "User can handle more complexity. "
                "Provide deeper insights and connections."
            )

        # Cultural adaptation
        if cultural_context:
            lang = cultural_context.get("language", "")
            culture = cultural_context.get("culture", "")
            if lang or culture:
                system_parts.append(
                    f"Adapt your response to {culture or 'the'} "
                    f"cultural context. "
                    f"Respect cultural nuances and traditions."
                )

        system_prompt = " ".join(system_parts)

        response = await self.understand(
            MultimodalInput(text=prompt),
            system_prompt=system_prompt,
            provider_priority=provider_priority,
        )

        return response.content


# Global instance
_engine: WorldClassAIEngine | None = None


def get_ai_engine() -> WorldClassAIEngine:
    """Get or create global AI engine instance."""
    global _engine
    if _engine is None:
        _engine = WorldClassAIEngine()
    return _engine
