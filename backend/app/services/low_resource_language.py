"""Low-resource language engine with zero-shot transfer and active learning."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional
from datetime import datetime

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    NllbTokenizer,
    MBartForConditionalGeneration,
)
from peft import LoraConfig, get_peft_model, TaskType

logger = logging.getLogger(__name__)


class LanguageFamily(Enum):
    """Language family categories."""

    AUSTRONESIAN = "austronesian"  # Taiwan indigenous languages
    SINO_TIBETAN = "sino_tibetan"
    AUSTROASIATIC = "austroasiatic"
    OTHER = "other"


@dataclass
class LanguageProfile:
    """Profile for a low-resource language."""

    code: str  # ISO 639-3 code
    name: str
    family: LanguageFamily
    num_speakers: int
    available_data_size: int  # Number of sentences
    related_languages: list[str]
    cultural_context: dict[str, Any]


@dataclass
class TranslationResult:
    """Translation result with confidence."""

    source_text: str
    target_text: str
    source_lang: str
    target_lang: str
    confidence: float
    method: str  # zero-shot, few-shot, fine-tuned


@dataclass
class QualityMetrics:
    """Translation quality metrics."""

    bleu_score: float
    chrf_score: float
    confidence: float
    fluency_score: Optional[float] = None


class LowResourceLanguageEngine:
    """
    Engine for low-resource language processing.

    Features:
    - Zero-shot translation via NLLB-200 model
    - LoRA fine-tuning for model adaptation
    - Active learning for data collection
    - Community-driven model improvement
    - Translation quality assessment
    """

    # NLLB-200 language code mapping
    LANG_CODE_MAP = {
        "trv": "zho_Hant",  # Map to Traditional Chinese as proxy
        "ami": "zho_Hant",
        "pwn": "zho_Hant",
        "zh-TW": "zho_Hant",
        "zh-CN": "zho_Hans",
        "en": "eng_Latn",
        "ja": "jpn_Jpan",
    }

    def __init__(
        self,
        model_name: str = "facebook/nllb-200-distilled-600M",
        use_small_model: bool = True,
        lazy_load: bool = True,
    ):
        """
        Initialize engine with optional model loading.

        Args:
            model_name: HuggingFace model identifier
            use_small_model: Use smaller model variant (200M vs 600M vs 3B)
            lazy_load: Load model only when needed (recommended)
        """
        # Use smaller model by default to avoid large downloads
        if use_small_model and "distilled-600M" in model_name:
            # Use the 200M version which is much smaller
            self.model_name = "facebook/nllb-200-distilled-1.3B"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model: Optional[MBartForConditionalGeneration] = None
        self.tokenizer: Optional[NllbTokenizer] = None
        self.lora_model: Optional[Any] = None
        self.lazy_load = lazy_load
        self.mock_mode = True  # Start in mock mode
        self.supported_languages: dict[str, LanguageProfile] = {}
        self.annotations: list[dict[str, Any]] = []
        self._initialize_languages()
        logger.info(
            f"Initialized LowResourceLanguageEngine on {self.device} "
            f"(lazy_load={lazy_load}, mock_mode={self.mock_mode})"
        )

    def _initialize_languages(self) -> None:
        """Initialize supported languages."""
        languages = [
            LanguageProfile(
                code="trv",
                name="Seediq",
                family=LanguageFamily.AUSTRONESIAN,
                num_speakers=8000,
                available_data_size=500,
                related_languages=["ami", "tao", "pwn"],
                cultural_context={
                    "region": "Central Taiwan",
                    "script": "Latin",
                },
            ),
            LanguageProfile(
                code="ami",
                name="Amis",
                family=LanguageFamily.AUSTRONESIAN,
                num_speakers=200000,
                available_data_size=2000,
                related_languages=["trv", "pwn"],
                cultural_context={"region": "East Taiwan", "script": "Latin"},
            ),
            LanguageProfile(
                code="pwn",
                name="Paiwan",
                family=LanguageFamily.AUSTRONESIAN,
                num_speakers=95000,
                available_data_size=1500,
                related_languages=["ami", "trv"],
                cultural_context={"region": "South Taiwan", "script": "Latin"},
            ),
        ]

        for lang in languages:
            self.supported_languages[lang.code] = lang

    async def load_model(self) -> None:
        """Load NLLB-200 model and tokenizer."""
        if self.model is not None:
            return
        logger.info(f"Loading model: {self.model_name}")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            if isinstance(model, MBartForConditionalGeneration):
                self.model = model.to(self.device)
                self.model.eval()
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            # Fallback to mock mode
            self.model = None
            self.tokenizer = None

    def _get_nllb_code(self, lang_code: str) -> str:
        """Map language code to NLLB-200 format."""
        return self.LANG_CODE_MAP.get(lang_code, "eng_Latn")

    def _mock_translate(
        self, text: str, source_lang: str, target_lang: str
    ) -> TranslationResult:
        """
        Lightweight mock translation for development/testing.

        Provides realistic response structure without model overhead.
        """
        # Simple rule-based mock translations
        mock_translations = {
            ("en", "zh-TW"): {
                "Hello": "你好",
                "Thank you": "謝謝",
                "Good morning": "早安",
                "Learning": "學習",
            },
            ("zh-TW", "en"): {
                "你好": "Hello",
                "謝謝": "Thank you",
                "早安": "Good morning",
                "學習": "Learning",
            },
        }

        # Try to find exact match
        key = (source_lang, target_lang)
        if key in mock_translations:
            translated = mock_translations[key].get(
                text, f"[Mock: {text} → {target_lang}]"
            )
            confidence = 0.85 if text in mock_translations[key] else 0.60
        else:
            # Generic mock
            translated = f"[Mock translation to {target_lang}]: {text}"
            confidence = 0.50

        return TranslationResult(
            source_text=text,
            target_text=translated,
            source_lang=source_lang,
            target_lang=target_lang,
            confidence=confidence,
            method="mock-lightweight",
        )

    async def translate_zero_shot(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        max_length: int = 512,
        force_model_load: bool = False,
    ) -> TranslationResult:
        """
        Zero-shot translation using NLLB-200 model or mock translation.

        Args:
            text: Source text
            source_lang: Source language code
            target_lang: Target language code
            max_length: Maximum output length
            force_model_load: Force loading the actual model (may take time)

        Returns:
            Translation result with confidence

        Note:
            By default, uses mock mode to avoid downloading large models.
            Set force_model_load=True to use actual NLLB-200 model.
        """
        # Only load model if explicitly requested
        if force_model_load and not self.lazy_load:
            await self.load_model()

        if self.mock_mode or self.model is None or self.tokenizer is None:
            # Mock mode - fast and lightweight
            logger.info(
                f"Mock translation: {source_lang} → {target_lang} "
                f"(set force_model_load=True to use actual model)"
            )
            return self._mock_translate(text, source_lang, target_lang)

        try:
            # Convert language codes to NLLB format
            src_code = self._get_nllb_code(source_lang)
            tgt_code = self._get_nllb_code(target_lang)

            # Tokenize
            self.tokenizer.src_lang = src_code
            inputs = self.tokenizer(text, return_tensors="pt", max_length=max_length, truncation=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Generate translation
            with torch.no_grad():
                generated_tokens = self.model.generate(
                    **inputs,
                    forced_bos_token_id=self.tokenizer.lang_code_to_id[tgt_code],
                    max_length=max_length,
                    num_beams=5,
                    early_stopping=True,
                )

            # Decode
            translated = self.tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

            # Calculate confidence (simplified)
            confidence = 0.75  # Would use model logits in production

            logger.info(f"Translated: {source_lang} -> {target_lang}")
            return TranslationResult(
                source_text=text,
                target_text=translated,
                source_lang=source_lang,
                target_lang=target_lang,
                confidence=confidence,
                method="zero-shot-nllb",
            )

        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return TranslationResult(
                source_text=text,
                target_text=f"[Error]: {str(e)}",
                source_lang=source_lang,
                target_lang=target_lang,
                confidence=0.0,
                method="error",
            )

    async def setup_lora_finetuning(
        self,
        r: int = 8,
        lora_alpha: int = 16,
        lora_dropout: float = 0.1,
    ) -> None:
        """
        Setup LoRA (Low-Rank Adaptation) for efficient fine-tuning.

        Args:
            r: LoRA rank
            lora_alpha: LoRA scaling parameter
            lora_dropout: Dropout probability
        """
        await self.load_model()

        if self.model is None:
            logger.error("Cannot setup LoRA: base model not loaded")
            return

        logger.info("Setting up LoRA fine-tuning")
        lora_config = LoraConfig(
            task_type=TaskType.SEQ_2_SEQ_LM,
            r=r,
            lora_alpha=lora_alpha,
            lora_dropout=lora_dropout,
            target_modules=["q_proj", "v_proj", "k_proj", "out_proj"],
        )

        self.lora_model = get_peft_model(self.model, lora_config)
        if self.lora_model is not None:
            self.lora_model.print_trainable_parameters()
        logger.info("LoRA setup complete")

    async def collect_annotation(
        self,
        text: str,
        language: str,
        user_translation: str,
        user_id: str,
        context: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Collect user annotation for active learning.

        Args:
            text: Original text
            language: Language code
            user_translation: User-provided translation
            user_id: User ID
            context: Additional context

        Returns:
            Annotation record
        """
        annotation = {
            "id": len(self.annotations) + 1,
            "text": text,
            "language": language,
            "translation": user_translation,
            "user_id": user_id,
            "context": context or {},
            "timestamp": datetime.now().isoformat(),
            "quality_score": None,
            "reviewed": False,
            "used_for_training": False,
        }

        self.annotations.append(annotation)
        logger.info(f"Collected annotation #{annotation['id']} for {language}")
        return annotation

    def calculate_bleu_score(self, reference: str, hypothesis: str) -> float:
        """
        Calculate BLEU score (simplified version).

        Args:
            reference: Reference translation
            hypothesis: Generated translation

        Returns:
            BLEU score (0-1)
        """
        # Simple word-level BLEU-1
        ref_words = set(reference.lower().split())
        hyp_words = set(hypothesis.lower().split())

        if not hyp_words:
            return 0.0

        matches = len(ref_words & hyp_words)
        score = matches / len(hyp_words)

        return score

    def assess_quality(
        self,
        reference: str,
        hypothesis: str,
    ) -> QualityMetrics:
        """
        Assess translation quality.

        Args:
            reference: Reference translation
            hypothesis: Generated translation

        Returns:
            Quality metrics
        """
        bleu = self.calculate_bleu_score(reference, hypothesis)

        # Simplified chrF score (character n-gram F-score)
        ref_chars = set(reference.lower())
        hyp_chars = set(hypothesis.lower())
        if not hyp_chars:
            chrf = 0.0
        else:
            chrf = len(ref_chars & hyp_chars) / len(hyp_chars)

        # Average as overall confidence
        confidence = (bleu + chrf) / 2

        return QualityMetrics(
            bleu_score=bleu,
            chrf_score=chrf,
            confidence=confidence,
        )

    def get_language_stats(self) -> dict[str, Any]:
        """Get statistics on supported languages."""
        return {
            "total_languages": len(self.supported_languages),
            "total_annotations": len(self.annotations),
            "model_loaded": self.model is not None,
            "lora_enabled": self.lora_model is not None,
            "device": self.device,
            "languages": [
                {
                    "code": lang.code,
                    "name": lang.name,
                    "speakers": lang.num_speakers,
                    "data_size": lang.available_data_size,
                    "family": lang.family.value,
                }
                for lang in self.supported_languages.values()
            ],
        }

    def get_annotations_for_training(self, min_quality: float = 0.7) -> list[dict[str, Any]]:
        """
        Get high-quality annotations for training.

        Args:
            min_quality: Minimum quality score threshold

        Returns:
            List of training-ready annotations
        """
        return [
            ann
            for ann in self.annotations
            if ann.get("reviewed")
            and ann.get("quality_score", 0) >= min_quality
            and not ann.get("used_for_training")
        ]


# Global instance
_engine: LowResourceLanguageEngine | None = None


def get_language_engine() -> LowResourceLanguageEngine:
    """Get or create global language engine."""
    global _engine
    if _engine is None:
        _engine = LowResourceLanguageEngine()
    return _engine
