"""
Crowdsourcing and gamification engine for community-driven content annotation.

Module 10: Crowdsourcing Platform
Features:
- Task assignment and distribution
- Quality control and review
- Contributor scoring and leaderboards
- Achievement and reward system
- Progress tracking
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

logger = logging.getLogger(__name__)


class TaskType(Enum):
    """Types of annotation tasks."""

    TRANSLATION = "translation"
    VALIDATION = "validation"
    CULTURAL_CONTEXT = "cultural_context"
    AUDIO_TRANSCRIPTION = "audio_transcription"
    QUALITY_REVIEW = "quality_review"


class TaskStatus(Enum):
    """Task lifecycle status."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"


class DifficultyLevel(Enum):
    """Task difficulty levels."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class AchievementType(Enum):
    """Types of achievements."""

    FIRST_TASK = "first_task"
    STREAK_3 = "streak_3"
    STREAK_7 = "streak_7"
    STREAK_30 = "streak_30"
    QUALITY_MASTER = "quality_master"
    SPEED_DEMON = "speed_demon"
    TEAM_PLAYER = "team_player"
    LANGUAGE_EXPERT = "language_expert"


@dataclass
class Task:
    """Annotation task."""

    id: str = field(default_factory=lambda: str(uuid4()))
    type: TaskType = TaskType.TRANSLATION
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    status: TaskStatus = TaskStatus.PENDING
    content: dict[str, Any] = field(default_factory=dict)
    instructions: str = ""
    estimated_time: int = 5  # minutes
    points: int = 10
    language: str = "zh-TW"
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    submission: Optional[dict[str, Any]] = None
    quality_score: Optional[float] = None
    reviewer_id: Optional[str] = None
    review_feedback: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class Contributor:
    """Community contributor profile."""

    id: str = field(default_factory=lambda: str(uuid4()))
    username: str = ""
    email: str = ""
    level: int = 1
    total_points: int = 0
    completed_tasks: int = 0
    average_quality: float = 0.0
    streak_days: int = 0
    last_activity: Optional[datetime] = None
    achievements: list[AchievementType] = field(default_factory=list)
    languages: list[str] = field(default_factory=list)
    specialties: list[TaskType] = field(default_factory=list)
    reputation: int = 100
    joined_at: datetime = field(default_factory=datetime.now)
    stats: dict[str, Any] = field(default_factory=dict)


@dataclass
class Achievement:
    """Achievement definition."""

    type: AchievementType
    name: str
    description: str
    icon: str
    points: int
    condition: str


@dataclass
class Leaderboard:
    """Leaderboard entry."""

    rank: int
    contributor_id: str
    username: str
    score: int
    metric: str  # points, quality, tasks, etc.
    period: str  # daily, weekly, monthly, all-time


class CrowdsourcingEngine:
    """
    Engine for crowdsourcing and gamification.

    Features:
    - Smart task assignment based on contributor skills
    - Quality control with multi-reviewer validation
    - Dynamic scoring and reputation system
    - Achievement tracking and rewards
    - Leaderboards and competition
    """

    def __init__(self):
        """Initialize crowdsourcing engine."""
        self.tasks: dict[str, Task] = {}
        self.contributors: dict[str, Contributor] = {}
        self.achievements_db: dict[AchievementType, Achievement] = {}
        self._initialize_achievements()
        logger.info("Initialized CrowdsourcingEngine")

    def _initialize_achievements(self) -> None:
        """Initialize achievement definitions."""
        achievements = [
            Achievement(
                type=AchievementType.FIRST_TASK,
                name="新手上路",
                description="完成第一個標註任務",
                icon="🎯",
                points=50,
                condition="completed_tasks >= 1",
            ),
            Achievement(
                type=AchievementType.STREAK_3,
                name="三日連勝",
                description="連續三天完成任務",
                icon="🔥",
                points=100,
                condition="streak_days >= 3",
            ),
            Achievement(
                type=AchievementType.STREAK_7,
                name="七日大師",
                description="連續七天完成任務",
                icon="⚡",
                points=300,
                condition="streak_days >= 7",
            ),
            Achievement(
                type=AchievementType.STREAK_30,
                name="月度傳奇",
                description="連續三十天完成任務",
                icon="👑",
                points=1000,
                condition="streak_days >= 30",
            ),
            Achievement(
                type=AchievementType.QUALITY_MASTER,
                name="品質大師",
                description="平均品質分數達到 0.9 以上",
                icon="💎",
                points=500,
                condition="average_quality >= 0.9",
            ),
            Achievement(
                type=AchievementType.SPEED_DEMON,
                name="速度惡魔",
                description="在一天內完成 20 個任務",
                icon="⚡",
                points=400,
                condition="daily_tasks >= 20",
            ),
            Achievement(
                type=AchievementType.TEAM_PLAYER,
                name="團隊玩家",
                description="協助審核 50 個其他人的任務",
                icon="🤝",
                points=600,
                condition="reviewed_tasks >= 50",
            ),
            Achievement(
                type=AchievementType.LANGUAGE_EXPERT,
                name="語言專家",
                description="精通三種以上語言",
                icon="🌍",
                points=800,
                condition="languages >= 3",
            ),
        ]

        for ach in achievements:
            self.achievements_db[ach.type] = ach

    def create_task(
        self,
        task_type: TaskType,
        content: dict[str, Any],
        difficulty: DifficultyLevel = DifficultyLevel.BEGINNER,
        language: str = "zh-TW",
        instructions: str = "",
        estimated_time: int = 5,
    ) -> Task:
        """
        Create a new annotation task.

        Args:
            task_type: Type of task
            content: Task content (text to translate, etc.)
            difficulty: Task difficulty level
            language: Target language
            instructions: Task instructions
            estimated_time: Estimated completion time in minutes

        Returns:
            Created task
        """
        # Calculate points based on difficulty
        points_map = {
            DifficultyLevel.BEGINNER: 10,
            DifficultyLevel.INTERMEDIATE: 25,
            DifficultyLevel.ADVANCED: 50,
            DifficultyLevel.EXPERT: 100,
        }

        task = Task(
            type=task_type,
            content=content,
            difficulty=difficulty,
            language=language,
            instructions=instructions,
            estimated_time=estimated_time,
            points=points_map[difficulty],
        )

        self.tasks[task.id] = task
        logger.info(f"Created task {task.id}: {task_type.value} ({difficulty.value})")
        return task

    def register_contributor(
        self,
        username: str,
        email: str,
        languages: list[str],
    ) -> Contributor:
        """
        Register a new contributor.

        Args:
            username: Contributor username
            email: Email address
            languages: Languages the contributor knows

        Returns:
            Contributor profile
        """
        contributor = Contributor(
            username=username,
            email=email,
            languages=languages,
        )

        self.contributors[contributor.id] = contributor
        logger.info(f"Registered contributor: {username}")
        return contributor

    def assign_task(
        self,
        task_id: str,
        contributor_id: str,
    ) -> Task:
        """
        Assign a task to a contributor.

        Args:
            task_id: Task ID
            contributor_id: Contributor ID

        Returns:
            Updated task

        Raises:
            ValueError: If task or contributor not found
        """
        task = self.tasks.get(task_id)
        contributor = self.contributors.get(contributor_id)

        if not task:
            raise ValueError(f"Task not found: {task_id}")
        if not contributor:
            raise ValueError(f"Contributor not found: {contributor_id}")

        if task.status != TaskStatus.PENDING:
            raise ValueError(f"Task {task_id} is not available for assignment")

        task.assigned_to = contributor_id
        task.assigned_at = datetime.now()
        task.status = TaskStatus.ASSIGNED

        logger.info(f"Assigned task {task_id} to {contributor.username}")
        return task

    def get_recommended_tasks(
        self,
        contributor_id: str,
        limit: int = 10,
    ) -> list[Task]:
        """
        Get recommended tasks for a contributor based on skills and history.

        Args:
            contributor_id: Contributor ID
            limit: Maximum number of tasks to return

        Returns:
            List of recommended tasks
        """
        contributor = self.contributors.get(contributor_id)
        if not contributor:
            return []

        # Find unassigned tasks matching contributor's languages
        available_tasks = [
            task
            for task in self.tasks.values()
            if task.status == TaskStatus.PENDING
            and task.language in contributor.languages
        ]

        # Sort by difficulty (matching contributor level)
        # Beginners get easier tasks, experts get harder tasks
        difficulty_map = {
            DifficultyLevel.BEGINNER: 1,
            DifficultyLevel.INTERMEDIATE: 2,
            DifficultyLevel.ADVANCED: 3,
            DifficultyLevel.EXPERT: 4,
        }

        target_difficulty = min(contributor.level, 4)

        def score_task(task: Task) -> float:
            diff_score = abs(difficulty_map[task.difficulty] - target_difficulty)
            specialty_bonus = 2.0 if task.type in contributor.specialties else 0.0
            return -diff_score + specialty_bonus

        available_tasks.sort(key=score_task, reverse=True)
        return available_tasks[:limit]

    def submit_task(
        self,
        task_id: str,
        contributor_id: str,
        submission: dict[str, Any],
    ) -> Task:
        """
        Submit a completed task.

        Args:
            task_id: Task ID
            contributor_id: Contributor ID
            submission: Task submission data

        Returns:
            Updated task

        Raises:
            ValueError: If task not found or not assigned to contributor
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        if task.assigned_to != contributor_id:
            raise ValueError(f"Task not assigned to contributor {contributor_id}")

        task.submission = submission
        task.submitted_at = datetime.now()
        task.status = TaskStatus.SUBMITTED

        logger.info(f"Task {task_id} submitted by contributor {contributor_id}")
        return task

    def review_task(
        self,
        task_id: str,
        reviewer_id: str,
        quality_score: float,
        approved: bool,
        feedback: Optional[str] = None,
    ) -> Task:
        """
        Review a submitted task.

        Args:
            task_id: Task ID
            reviewer_id: Reviewer ID
            quality_score: Quality score (0-1)
            approved: Whether to approve the task
            feedback: Optional review feedback

        Returns:
            Updated task
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        if task.status != TaskStatus.SUBMITTED:
            raise ValueError(f"Task {task_id} is not ready for review")

        task.quality_score = quality_score
        task.reviewer_id = reviewer_id
        task.review_feedback = feedback
        task.reviewed_at = datetime.now()
        task.status = TaskStatus.APPROVED if approved else TaskStatus.REJECTED

        # Update contributor stats if approved
        if approved and task.assigned_to:
            self._update_contributor_stats(task)

        logger.info(
            f"Task {task_id} reviewed: {'approved' if approved else 'rejected'} "
            f"(score: {quality_score:.2f})"
        )
        return task

    def _update_contributor_stats(self, task: Task) -> None:
        """Update contributor statistics after task approval."""
        if not task.assigned_to:
            return

        contributor = self.contributors.get(task.assigned_to)
        if not contributor:
            return

        # Update basic stats
        contributor.completed_tasks += 1
        contributor.total_points += task.points

        # Update average quality
        if task.quality_score is not None:
            total_quality = contributor.average_quality * (
                contributor.completed_tasks - 1
            )
            contributor.average_quality = (total_quality + task.quality_score) / (
                contributor.completed_tasks
            )

        # Update streak
        today = datetime.now().date()
        if contributor.last_activity:
            last_date = contributor.last_activity.date()
            days_diff = (today - last_date).days

            if days_diff == 1:
                contributor.streak_days += 1
            elif days_diff > 1:
                contributor.streak_days = 1
        else:
            contributor.streak_days = 1

        contributor.last_activity = datetime.now()

        # Update level (every 100 points = 1 level)
        contributor.level = 1 + (contributor.total_points // 100)

        # Check for achievements
        self._check_achievements(contributor)

        # Update reputation
        if task.quality_score and task.quality_score >= 0.8:
            contributor.reputation += 5
        elif task.quality_score and task.quality_score < 0.5:
            contributor.reputation -= 2

        contributor.reputation = max(0, min(1000, contributor.reputation))

    def _check_achievements(self, contributor: Contributor) -> None:
        """Check and award achievements to contributor."""
        new_achievements = []

        for ach_type, achievement in self.achievements_db.items():
            if ach_type in contributor.achievements:
                continue

            # Check achievement conditions
            awarded = False

            if ach_type == AchievementType.FIRST_TASK:
                awarded = contributor.completed_tasks >= 1
            elif ach_type == AchievementType.STREAK_3:
                awarded = contributor.streak_days >= 3
            elif ach_type == AchievementType.STREAK_7:
                awarded = contributor.streak_days >= 7
            elif ach_type == AchievementType.STREAK_30:
                awarded = contributor.streak_days >= 30
            elif ach_type == AchievementType.QUALITY_MASTER:
                awarded = (
                    contributor.average_quality >= 0.9
                    and contributor.completed_tasks >= 10
                )
            elif ach_type == AchievementType.LANGUAGE_EXPERT:
                awarded = len(contributor.languages) >= 3

            if awarded:
                contributor.achievements.append(ach_type)
                contributor.total_points += achievement.points
                new_achievements.append(achievement)
                logger.info(
                    f"Achievement unlocked for {contributor.username}: "
                    f"{achievement.name}"
                )

    def get_leaderboard(
        self,
        metric: str = "points",
        period: str = "all-time",
        limit: int = 100,
    ) -> list[Leaderboard]:
        """
        Get leaderboard rankings.

        Args:
            metric: Metric to rank by (points, quality, tasks)
            period: Time period (daily, weekly, monthly, all-time)
            limit: Maximum number of entries

        Returns:
            Leaderboard entries
        """
        # Filter contributors by period
        now = datetime.now()
        filtered = list(self.contributors.values())

        if period == "daily":
            cutoff = now - timedelta(days=1)
            filtered = [c for c in filtered if c.last_activity and c.last_activity >= cutoff]
        elif period == "weekly":
            cutoff = now - timedelta(weeks=1)
            filtered = [c for c in filtered if c.last_activity and c.last_activity >= cutoff]
        elif period == "monthly":
            cutoff = now - timedelta(days=30)
            filtered = [c for c in filtered if c.last_activity and c.last_activity >= cutoff]

        # Sort by metric
        if metric == "points":
            filtered.sort(key=lambda c: c.total_points, reverse=True)
            score_fn = lambda c: c.total_points
        elif metric == "quality":
            filtered.sort(key=lambda c: c.average_quality, reverse=True)
            score_fn = lambda c: int(c.average_quality * 100)
        elif metric == "tasks":
            filtered.sort(key=lambda c: c.completed_tasks, reverse=True)
            score_fn = lambda c: c.completed_tasks
        else:
            score_fn = lambda c: c.total_points

        # Create leaderboard entries
        leaderboard = []
        for rank, contributor in enumerate(filtered[:limit], start=1):
            entry = Leaderboard(
                rank=rank,
                contributor_id=contributor.id,
                username=contributor.username,
                score=score_fn(contributor),
                metric=metric,
                period=period,
            )
            leaderboard.append(entry)

        return leaderboard

    def get_contributor_stats(self, contributor_id: str) -> dict[str, Any]:
        """Get detailed statistics for a contributor."""
        contributor = self.contributors.get(contributor_id)
        if not contributor:
            return {}

        # Calculate additional stats
        assigned_tasks = [
            t for t in self.tasks.values() if t.assigned_to == contributor_id
        ]
        pending_tasks = [t for t in assigned_tasks if t.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]]
        submitted_tasks = [t for t in assigned_tasks if t.status == TaskStatus.SUBMITTED]

        achievements_info = [
            {
                "type": ach.value,
                "name": self.achievements_db[ach].name,
                "icon": self.achievements_db[ach].icon,
                "points": self.achievements_db[ach].points,
            }
            for ach in contributor.achievements
        ]

        return {
            "contributor_id": contributor.id,
            "username": contributor.username,
            "level": contributor.level,
            "total_points": contributor.total_points,
            "completed_tasks": contributor.completed_tasks,
            "pending_tasks": len(pending_tasks),
            "submitted_tasks": len(submitted_tasks),
            "average_quality": contributor.average_quality,
            "streak_days": contributor.streak_days,
            "reputation": contributor.reputation,
            "achievements": achievements_info,
            "languages": contributor.languages,
            "joined_at": contributor.joined_at.isoformat(),
            "last_activity": (
                contributor.last_activity.isoformat()
                if contributor.last_activity
                else None
            ),
        }

    def get_platform_stats(self) -> dict[str, Any]:
        """Get overall platform statistics."""
        total_tasks = len(self.tasks)
        completed_tasks = sum(
            1 for t in self.tasks.values() if t.status == TaskStatus.APPROVED
        )
        pending_tasks = sum(
            1 for t in self.tasks.values() if t.status == TaskStatus.PENDING
        )

        return {
            "total_contributors": len(self.contributors),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "completion_rate": (
                completed_tasks / total_tasks if total_tasks > 0 else 0
            ),
            "total_achievements_unlocked": sum(
                len(c.achievements) for c in self.contributors.values()
            ),
            "average_quality": (
                sum(c.average_quality for c in self.contributors.values())
                / len(self.contributors)
                if self.contributors
                else 0
            ),
        }


# Global engine instance
_engine: Optional[CrowdsourcingEngine] = None


def get_crowdsourcing_engine() -> CrowdsourcingEngine:
    """Get or create the global crowdsourcing engine instance."""
    global _engine
    if _engine is None:
        _engine = CrowdsourcingEngine()
    return _engine
