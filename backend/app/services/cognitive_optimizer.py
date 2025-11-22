"""
Cognitive load optimizer with adaptive content adjustment and spaced
repetition.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class CognitiveState(Enum):
    """User's current cognitive state."""

    UNDERLOAD = "underload"  # Too easy, user is bored
    OPTIMAL = "optimal"  # Perfect challenge level
    OVERLOAD = "overload"  # Too difficult, user is stressed


@dataclass
class CognitiveMetrics:
    """Metrics for assessing cognitive load."""

    reading_speed: float  # Words per minute
    error_rate: float  # Percentage of errors
    pause_frequency: float  # Pauses per minute
    heart_rate_variability: float | None = None  # HRV from HealthKit
    session_duration: float = 0.0  # Minutes
    timestamp: datetime | None = None  # type: ignore

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class ContentDifficulty:
    """Difficulty analysis of content."""

    lexical_complexity: float  # Vocabulary difficulty (0-1)
    syntactic_complexity: float  # Sentence structure (0-1)
    concept_density: float  # Ideas per paragraph (0-1)
    cultural_distance: float  # Cultural familiarity (0-1)
    overall_difficulty: float = 0.0

    def __post_init__(self):
        self.overall_difficulty = (
            self.lexical_complexity * 0.3
            + self.syntactic_complexity * 0.25
            + self.concept_density * 0.25
            + self.cultural_distance * 0.2
        )


@dataclass
class AdaptedContent:
    """Content adapted to cognitive load."""

    original_text: str
    adapted_text: str
    simplifications: list[str]
    difficulty_before: float
    difficulty_after: float
    adaptation_strategy: str


@dataclass
class ReviewSchedule:
    """Spaced repetition schedule for content review."""

    content_id: str
    user_id: str
    repetition_number: int
    easiness_factor: float  # SM-2 EF (1.3 - 2.5)
    interval_days: int
    next_review: datetime
    last_reviewed: datetime | None = None
    quality_score: int | None = None  # 0-5 from last review


class CognitiveLoadEstimator:
    """
    Estimate user's cognitive load from behavioral and physiological signals.

    Based on cognitive load theory (Sweller, 1988) and extended with
    modern ML approaches.
    """

    def __init__(self):
        """Initialize estimator."""
        self.baseline_metrics: dict[str, CognitiveMetrics] = {}

    def estimate_load(
        self,
        user_id: str,
        metrics: CognitiveMetrics,
        content_difficulty: ContentDifficulty,
    ) -> float:
        """
        Estimate current cognitive load (0-1).

        Args:
            user_id: User ID
            metrics: Current behavioral metrics
            content_difficulty: Content difficulty analysis

        Returns:
            Estimated cognitive load (0=low, 1=high)
        """
        # Get baseline for user
        baseline = self.baseline_metrics.get(user_id)

        # Calculate load factors
        speed_factor = self._calculate_speed_factor(metrics, baseline)
        error_factor = metrics.error_rate
        pause_factor = self._calculate_pause_factor(metrics, baseline)
        hrv_factor = self._calculate_hrv_factor(metrics, baseline)
        difficulty_factor = content_difficulty.overall_difficulty

        # Weighted combination
        load = (
            speed_factor * 0.25
            + error_factor * 0.25
            + pause_factor * 0.20
            + hrv_factor * 0.15
            + difficulty_factor * 0.15
        )

        return max(0.0, min(1.0, load))

    def _calculate_speed_factor(
        self,
        metrics: CognitiveMetrics,
        baseline: CognitiveMetrics | None,
    ) -> float:
        """Calculate reading speed factor (slow = high load)."""
        if baseline is None:
            return 0.5  # No baseline, assume medium

        # Slower than baseline = higher load
        speed_ratio = baseline.reading_speed / max(metrics.reading_speed, 1.0)
        return min(speed_ratio - 1.0, 1.0) if speed_ratio > 1.0 else 0.0

    def _calculate_pause_factor(
        self,
        metrics: CognitiveMetrics,
        baseline: CognitiveMetrics | None,
    ) -> float:
        """Calculate pause frequency factor (more pauses = higher load)."""
        if baseline is None:
            return min(metrics.pause_frequency / 5.0, 1.0)

        pause_ratio = metrics.pause_frequency / max(
            baseline.pause_frequency, 0.1
        )
        return min(pause_ratio / 2.0, 1.0)

    def _calculate_hrv_factor(
        self,
        metrics: CognitiveMetrics,
        baseline: CognitiveMetrics | None,
    ) -> float:
        """Calculate HRV factor (lower HRV = higher load)."""
        if metrics.heart_rate_variability is None:
            return 0.5  # No HRV data

        if baseline is None or baseline.heart_rate_variability is None:
            # Assume 50ms as normal HRV
            return 1.0 - min(metrics.heart_rate_variability / 100.0, 1.0)

        hrv_ratio = baseline.heart_rate_variability / max(
            metrics.heart_rate_variability, 1.0
        )
        return min(hrv_ratio - 1.0, 1.0) if hrv_ratio > 1.0 else 0.0

    def classify_state(self, cognitive_load: float) -> CognitiveState:
        """
        Classify cognitive state from load.

        Optimal zone: 0.4 - 0.7 (Yerkes-Dodson law)
        """
        if cognitive_load < 0.4:
            return CognitiveState.UNDERLOAD
        elif cognitive_load > 0.7:
            return CognitiveState.OVERLOAD
        else:
            return CognitiveState.OPTIMAL

    def update_baseline(
        self,
        user_id: str,
        metrics: CognitiveMetrics,
    ) -> None:
        """Update user's baseline metrics (during low-stress sessions)."""
        if user_id not in self.baseline_metrics:
            self.baseline_metrics[user_id] = metrics
        else:
            # Exponential moving average
            old = self.baseline_metrics[user_id]
            alpha = 0.1

            self.baseline_metrics[user_id] = CognitiveMetrics(
                reading_speed=old.reading_speed * (1 - alpha)
                + metrics.reading_speed * alpha,
                error_rate=old.error_rate * (1 - alpha)
                + metrics.error_rate * alpha,
                pause_frequency=old.pause_frequency * (1 - alpha)
                + metrics.pause_frequency * alpha,
                heart_rate_variability=(
                    old.heart_rate_variability * (1 - alpha)
                    + metrics.heart_rate_variability * alpha
                    if (
                        metrics.heart_rate_variability
                        and old.heart_rate_variability
                    )
                    else metrics.heart_rate_variability or old.heart_rate_variability
                ),
            )


class ContentAdapter:
    """
    Adapt content difficulty to user's cognitive load.

    Strategies:
    - Simplify vocabulary
    - Break down complex sentences
    - Add explanatory notes
    - Adjust information density
    """

    def adapt_content(
        self,
        text: str,
        current_load: float,
        target_load: float,
        difficulty: ContentDifficulty,
    ) -> AdaptedContent:
        """
        Adapt content to target cognitive load.

        Args:
            text: Original text
            current_load: Current cognitive load
            target_load: Target cognitive load
            difficulty: Content difficulty analysis

        Returns:
            Adapted content with explanations
        """
        if current_load <= target_load:
            # No adaptation needed or increase difficulty
            return AdaptedContent(
                original_text=text,
                adapted_text=text,
                simplifications=[],
                difficulty_before=difficulty.overall_difficulty,
                difficulty_after=difficulty.overall_difficulty,
                adaptation_strategy="none",
            )

        # Calculate adaptation intensity
        intensity = current_load - target_load
        simplifications: list[str] = []

        adapted_text = text

        # Strategy 1: Simplify vocabulary (if lexical complexity high)
        if difficulty.lexical_complexity > 0.6 and intensity > 0.2:
            adapted_text = self._simplify_vocabulary(adapted_text)
            simplifications.append("Simplified complex vocabulary")

        # Strategy 2: Break down sentences (if syntactic complexity high)
        if difficulty.syntactic_complexity > 0.6 and intensity > 0.3:
            adapted_text = self._break_sentences(adapted_text)
            simplifications.append("Split complex sentences")

        # Strategy 3: Add cultural context (if cultural distance high)
        if difficulty.cultural_distance > 0.5 and intensity > 0.2:
            adapted_text = self._add_cultural_notes(adapted_text)
            simplifications.append("Added cultural context notes")

        # Strategy 4: Reduce information density
        if difficulty.concept_density > 0.7 and intensity > 0.4:
            adapted_text = self._add_explanations(adapted_text)
            simplifications.append("Added concept explanations")

        # Estimate new difficulty
        new_difficulty = difficulty.overall_difficulty * (1 - intensity * 0.5)

        return AdaptedContent(
            original_text=text,
            adapted_text=adapted_text,
            simplifications=simplifications,
            difficulty_before=difficulty.overall_difficulty,
            difficulty_after=new_difficulty,
            adaptation_strategy=f"Applied {len(simplifications)} adaptations",
        )

    def _simplify_vocabulary(self, text: str) -> str:
        """Replace complex words with simpler alternatives."""
        # Placeholder: In production, use NLP models
        replacements = {
            "utilize": "use",
            "demonstrate": "show",
            "subsequently": "then",
            "numerous": "many",
            "facilitate": "help",
        }

        simplified = text
        for complex_word, simple_word in replacements.items():
            simplified = simplified.replace(complex_word, simple_word)

        return simplified

    def _break_sentences(self, text: str) -> str:
        """Break long sentences into shorter ones."""
        # Placeholder: In production, use NLP parsing
        sentences = text.split(". ")
        broken: list[str] = []

        for sent in sentences:
            if len(sent.split()) > 20:  # Long sentence
                # Simple heuristic: break at conjunctions
                parts = sent.replace(", and ", ". ").replace(", but ", ". ")
                broken.append(parts)
            else:
                broken.append(sent)

        return ". ".join(broken)

    def _add_cultural_notes(self, text: str) -> str:
        """Add cultural context explanations."""
        # Placeholder: In production, detect cultural references
        return text + "\n\n[Cultural Note: This text references traditional practices.]"

    def _add_explanations(self, text: str) -> str:
        """Add explanatory notes for dense concepts."""
        # Placeholder: In production, use knowledge graph
        return text + "\n\n[Explanation: Key concepts explained here.]"


class SpacedRepetitionScheduler:
    """
    Improved SM-2 algorithm for spaced repetition.

    Enhancements:
    - Difficulty-aware intervals
    - Cultural context consideration
    - Adaptive easiness factor
    """

    def __init__(self):
        """Initialize scheduler."""
        self.schedules: dict[tuple[str, str], ReviewSchedule] = {}

    def schedule_review(
        self,
        content_id: str,
        user_id: str,
        quality: int,
        content_difficulty: float = 0.5,
    ) -> ReviewSchedule:
        """
        Schedule next review using modified SM-2.

        Args:
            content_id: Content ID
            user_id: User ID
            quality: Quality of recall (0-5)
                0: Complete blackout
                1: Incorrect, familiar
                2: Incorrect, seemed easy
                3: Correct, difficult
                4: Correct, hesitation
                5: Perfect recall
            content_difficulty: Inherent difficulty (0-1)

        Returns:
            Updated review schedule
        """
        key = (user_id, content_id)
        now = datetime.now()

        # Get existing schedule or create new
        if key in self.schedules:
            schedule = self.schedules[key]
        else:
            schedule = ReviewSchedule(
                content_id=content_id,
                user_id=user_id,
                repetition_number=0,
                easiness_factor=2.5,
                interval_days=1,
                next_review=now,
            )

        # Update based on quality
        schedule.last_reviewed = now
        schedule.quality_score = quality

        if quality < 3:
            # Reset on failure
            schedule.repetition_number = 0
            schedule.interval_days = 1
        else:
            # SM-2 algorithm with difficulty adjustment
            schedule.repetition_number += 1

            # Update easiness factor
            ef = schedule.easiness_factor
            ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            ef = max(1.3, min(ef, 2.5))  # Clamp to valid range

            # Adjust for content difficulty
            difficulty_factor = 1.0 + (content_difficulty - 0.5) * 0.4
            ef *= difficulty_factor

            schedule.easiness_factor = ef

            # Calculate interval
            if schedule.repetition_number == 1:
                schedule.interval_days = 1
            elif schedule.repetition_number == 2:
                schedule.interval_days = 6
            else:
                prev_interval = schedule.interval_days
                schedule.interval_days = math.ceil(prev_interval * ef)

        # Set next review date
        schedule.next_review = now + timedelta(days=schedule.interval_days)

        self.schedules[key] = schedule
        return schedule

    def calculate_next_review(
        self,
        content_id: str,
        user_id: str,
        quality_score: int,
        current_repetition: int,
        current_easiness: float,
        content_difficulty: float = 0.5,
    ) -> ReviewSchedule:
        """
        API-friendly wrapper to compute next review schedule.

        This method aligns with the expected interface used by the
        REST layer, seeding the internal schedule state with the
        provided repetition number and easiness factor before
        delegating to the core SM-2 update logic.

        Args:
            content_id: Content identifier
            user_id: User identifier
            quality_score: Recall quality (0-5)
            current_repetition: Current repetition count prior to this review
            current_easiness: Current EF prior to this review (1.3-2.5)
            content_difficulty: Optional difficulty scalar (0-1)

        Returns:
            Updated ReviewSchedule after applying this review
        """
        key = (user_id, content_id)
        now = datetime.now()

        # Seed or update internal state to reflect the provided current values
        existing = self.schedules.get(key)
        if existing is None:
            self.schedules[key] = ReviewSchedule(
                content_id=content_id,
                user_id=user_id,
                repetition_number=current_repetition,
                easiness_factor=current_easiness,
                interval_days=1,
                next_review=now,
                last_reviewed=None,
                quality_score=None,
            )
        else:
            existing.repetition_number = current_repetition
            existing.easiness_factor = current_easiness
            existing.last_reviewed = now
            self.schedules[key] = existing

        # Reuse core logic to compute next schedule
        return self.schedule_review(
            content_id=content_id,
            user_id=user_id,
            quality=quality_score,
            content_difficulty=content_difficulty,
        )

    def get_due_reviews(
        self,
        user_id: str,
        current_time: datetime | None = None,
    ) -> list[ReviewSchedule]:
        """
        Get content due for review.

        Args:
            user_id: User ID
            current_time: Current time (defaults to now)

        Returns:
            List of schedules due for review
        """
        if current_time is None:
            current_time = datetime.now()

        due: list[ReviewSchedule] = []
        for key, schedule in self.schedules.items():
            if key[0] == user_id and schedule.next_review <= current_time:
                due.append(schedule)

        # Sort by due date (most overdue first)
        due.sort(key=lambda s: s.next_review)
        return due

    def get_optimal_study_time(
        self,
        user_id: str,
        session_duration_minutes: int = 30,
    ) -> list[ReviewSchedule]:
        """
        Get optimal set of reviews for a study session.

        Uses difficulty curve optimization to prevent cognitive overload.

        Args:
            user_id: User ID
            session_duration_minutes: Available study time

        Returns:
            Ordered list of content to review
        """
        due = self.get_due_reviews(user_id)

        if not due:
            return []

        # Estimate time per item (3-5 minutes)
        max_items = session_duration_minutes // 4

        # Optimize difficulty curve (easy -> hard -> easy)
        # Get difficulties (mock for now, should come from DB)
        items_with_diff = [
            (schedule, self._get_content_difficulty(schedule.content_id))
            for schedule in due[: max_items * 2]
        ]

        # Sort: start easy, peak in middle, end easy
        items_with_diff.sort(key=lambda x: x[1])
        easy_items = items_with_diff[: len(items_with_diff) // 3]
        hard_items = items_with_diff[len(items_with_diff) // 3:]

        # Arrange: easy -> hard -> easy
        optimal_order = (
            [x[0] for x in easy_items[: max_items // 3]]
            + [x[0] for x in hard_items[: max_items // 3]]
            + [x[0] for x in easy_items[max_items // 3:max_items]]
        )

        return optimal_order[:max_items]

    def _get_content_difficulty(self, content_id: str) -> float:
        """Get content difficulty (mock for now)."""
        # TODO: Fetch from knowledge graph or database
        return 0.5


# Global instances
_load_estimator: CognitiveLoadEstimator | None = None
_content_adapter: ContentAdapter | None = None
_scheduler: SpacedRepetitionScheduler | None = None


def get_load_estimator() -> CognitiveLoadEstimator:
    """Get or create global load estimator."""
    global _load_estimator
    if _load_estimator is None:
        _load_estimator = CognitiveLoadEstimator()
    return _load_estimator


def get_content_adapter() -> ContentAdapter:
    """Get or create global content adapter."""
    global _content_adapter
    if _content_adapter is None:
        _content_adapter = ContentAdapter()
    return _content_adapter


def get_scheduler() -> SpacedRepetitionScheduler:
    """Get or create global scheduler."""
    global _scheduler
    if _scheduler is None:
        _scheduler = SpacedRepetitionScheduler()
    return _scheduler


class ContentAdaptationEngine:
    """
    High-level content adaptation engine that orchestrates
    cognitive load estimation and content transformation.

    Exposes an async method `adapt_to_load` as used by the API layer.
    """

    def __init__(self) -> None:
        self._adapter = get_content_adapter()
        self._estimator = get_load_estimator()

    async def adapt_to_load(
        self,
        content: str,
        current_load: float,
        target_load: float,
        user_level: str = "intermediate",
    ) -> AdaptedContent:
        """
        Adapt the provided content to move cognitive load toward a target.

        Args:
            content: Original text content
            current_load: Observed cognitive load (0-1)
            target_load: Desired target load (0-1)
            user_level: User proficiency hint (beginner/intermediate/advanced)

        Returns:
            AdaptedContent describing changes and difficulty deltas
        """
        # Estimate content difficulty with lightweight heuristics
        difficulty = self._estimate_content_difficulty(content, user_level)

        # Delegate actual transformation to ContentAdapter
        result = self._adapter.adapt_content(
            text=content,
            current_load=current_load,
            target_load=target_load,
            difficulty=difficulty,
        )
        return result

    def _estimate_content_difficulty(
        self, text: str, user_level: str
    ) -> ContentDifficulty:
        """
        Simple heuristic difficulty estimator.

        Uses sentence length, word length, and rudimentary density
        proxies, then adjusts by the user's declared level.
        """
        words = [w for w in text.replace("\n", " ").split(" ") if w]
        sentences = [s for s in text.split(".") if s.strip()]

        avg_word_len = (
            sum(len(w.strip(" ,;:!?")) for w in words) / max(len(words), 1)
            if words
            else 1.0
        )
        avg_sent_len = (
            sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
            if sentences
            else 10.0
        )

        # Normalize to 0-1 ranges with rough caps
        lexical_complexity = min(avg_word_len / 8.0, 1.0)
        syntactic_complexity = min(avg_sent_len / 25.0, 1.0)
        # Use punctuation ratio and paragraph breaks as a proxy for
        # concept density
        punctuation = sum(text.count(p) for p in [",", ";", ":"])
        concept_density = min(
            (punctuation / max(len(sentences), 1)) / 4.0, 1.0
        )
        cultural_distance = 0.4  # default; derive from locale/NER

        # Adjust by user level: beginners perceive higher difficulty
        level_adjust = {
            "beginner": 0.15,
            "intermediate": 0.0,
            "advanced": -0.1,
        }.get(user_level.lower(), 0.0)

        cd = ContentDifficulty(
            lexical_complexity=max(
                0.0, min(1.0, lexical_complexity + level_adjust)
            ),
            syntactic_complexity=max(
                0.0, min(1.0, syntactic_complexity + level_adjust)
            ),
            concept_density=max(
                0.0, min(1.0, concept_density + level_adjust / 2)
            ),
            cultural_distance=max(
                0.0, min(1.0, cultural_distance + level_adjust / 3)
            ),
        )
        return cd
