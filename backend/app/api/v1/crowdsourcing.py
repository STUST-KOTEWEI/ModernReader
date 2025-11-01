"""
API routes for crowdsourcing and gamification features.

Endpoints:
- /api/v1/crowdsourcing/tasks - Task management
- /api/v1/crowdsourcing/contributors - Contributor management
- /api/v1/crowdsourcing/leaderboard - Leaderboards
- /api/v1/crowdsourcing/achievements - Achievement tracking
"""
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.crowdsourcing import (
    TaskType,
    DifficultyLevel,
    TaskStatus,
    get_crowdsourcing_engine,
)

router = APIRouter(prefix="/api/v1/crowdsourcing", tags=["crowdsourcing"])


# ============================================================================
# Pydantic Models (Request/Response)
# ============================================================================


class TaskCreate(BaseModel):
    """Request model for creating a task."""

    type: TaskType
    content: dict[str, Any]
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    language: str = "zh-TW"
    instructions: str = ""
    estimated_time: int = Field(default=5, ge=1, le=120)


class TaskResponse(BaseModel):
    """Response model for a task."""

    id: str
    type: str
    difficulty: str
    status: str
    content: dict[str, Any]
    instructions: str
    estimated_time: int
    points: int
    language: str
    assigned_to: Optional[str] = None
    quality_score: Optional[float] = None


class TaskSubmit(BaseModel):
    """Request model for submitting a task."""

    submission: dict[str, Any]


class TaskReview(BaseModel):
    """Request model for reviewing a task."""

    quality_score: float = Field(ge=0.0, le=1.0)
    approved: bool
    feedback: Optional[str] = None


class ContributorCreate(BaseModel):
    """Request model for registering a contributor."""

    username: str = Field(min_length=3, max_length=50)
    email: str
    languages: list[str] = Field(min_length=1)


class ContributorResponse(BaseModel):
    """Response model for a contributor."""

    id: str
    username: str
    level: int
    total_points: int
    completed_tasks: int
    average_quality: float
    streak_days: int
    reputation: int
    achievements: list[dict[str, Any]]
    languages: list[str]


# ============================================================================
# Task Endpoints
# ============================================================================


@router.post("/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate) -> TaskResponse:
    """
    Create a new annotation task.

    - **type**: Type of task (translation, validation, etc.)
    - **content**: Task content (text, images, etc.)
    - **difficulty**: Task difficulty level
    - **language**: Target language
    - **instructions**: Task instructions for contributors
    - **estimated_time**: Estimated completion time in minutes
    """
    engine = get_crowdsourcing_engine()

    task = engine.create_task(
        task_type=task_data.type,
        content=task_data.content,
        difficulty=task_data.difficulty,
        language=task_data.language,
        instructions=task_data.instructions,
        estimated_time=task_data.estimated_time,
    )

    return TaskResponse(
        id=task.id,
        type=task.type.value,
        difficulty=task.difficulty.value,
        status=task.status.value,
        content=task.content,
        instructions=task.instructions,
        estimated_time=task.estimated_time,
        points=task.points,
        language=task.language,
        assigned_to=task.assigned_to,
        quality_score=task.quality_score,
    )


@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[TaskStatus] = None,
    difficulty: Optional[DifficultyLevel] = None,
    language: Optional[str] = None,
    limit: int = Query(default=50, le=200),
) -> list[TaskResponse]:
    """
    List tasks with optional filters.

    - **status**: Filter by task status
    - **difficulty**: Filter by difficulty level
    - **language**: Filter by language
    - **limit**: Maximum number of tasks to return
    """
    engine = get_crowdsourcing_engine()

    tasks = list(engine.tasks.values())

    # Apply filters
    if status:
        tasks = [t for t in tasks if t.status == status]
    if difficulty:
        tasks = [t for t in tasks if t.difficulty == difficulty]
    if language:
        tasks = [t for t in tasks if t.language == language]

    # Limit results
    tasks = tasks[:limit]

    return [
        TaskResponse(
            id=t.id,
            type=t.type.value,
            difficulty=t.difficulty.value,
            status=t.status.value,
            content=t.content,
            instructions=t.instructions,
            estimated_time=t.estimated_time,
            points=t.points,
            language=t.language,
            assigned_to=t.assigned_to,
            quality_score=t.quality_score,
        )
        for t in tasks
    ]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str) -> TaskResponse:
    """Get a specific task by ID."""
    engine = get_crowdsourcing_engine()

    task = engine.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse(
        id=task.id,
        type=task.type.value,
        difficulty=task.difficulty.value,
        status=task.status.value,
        content=task.content,
        instructions=task.instructions,
        estimated_time=task.estimated_time,
        points=task.points,
        language=task.language,
        assigned_to=task.assigned_to,
        quality_score=task.quality_score,
    )


@router.post("/tasks/{task_id}/assign/{contributor_id}")
async def assign_task(task_id: str, contributor_id: str) -> dict[str, Any]:
    """Assign a task to a contributor."""
    engine = get_crowdsourcing_engine()

    try:
        task = engine.assign_task(task_id, contributor_id)
        return {
            "success": True,
            "task_id": task.id,
            "contributor_id": contributor_id,
            "status": task.status.value,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/submit")
async def submit_task(
    task_id: str,
    contributor_id: str,
    submission: TaskSubmit,
) -> dict[str, Any]:
    """Submit a completed task."""
    engine = get_crowdsourcing_engine()

    try:
        task = engine.submit_task(task_id, contributor_id, submission.submission)
        return {
            "success": True,
            "task_id": task.id,
            "status": task.status.value,
            "submitted_at": task.submitted_at.isoformat() if task.submitted_at else None,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/review")
async def review_task(
    task_id: str,
    reviewer_id: str,
    review: TaskReview,
) -> dict[str, Any]:
    """Review a submitted task."""
    engine = get_crowdsourcing_engine()

    try:
        task = engine.review_task(
            task_id=task_id,
            reviewer_id=reviewer_id,
            quality_score=review.quality_score,
            approved=review.approved,
            feedback=review.feedback,
        )
        return {
            "success": True,
            "task_id": task.id,
            "status": task.status.value,
            "quality_score": task.quality_score,
            "approved": review.approved,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Contributor Endpoints
# ============================================================================


@router.post("/contributors", response_model=ContributorResponse)
async def register_contributor(
    contributor_data: ContributorCreate,
) -> ContributorResponse:
    """
    Register a new contributor.

    - **username**: Unique username (3-50 characters)
    - **email**: Email address
    - **languages**: List of languages the contributor knows
    """
    engine = get_crowdsourcing_engine()

    contributor = engine.register_contributor(
        username=contributor_data.username,
        email=contributor_data.email,
        languages=contributor_data.languages,
    )

    stats = engine.get_contributor_stats(contributor.id)

    return ContributorResponse(
        id=contributor.id,
        username=contributor.username,
        level=contributor.level,
        total_points=contributor.total_points,
        completed_tasks=contributor.completed_tasks,
        average_quality=contributor.average_quality,
        streak_days=contributor.streak_days,
        reputation=contributor.reputation,
        achievements=stats["achievements"],
        languages=contributor.languages,
    )


@router.get("/contributors/{contributor_id}", response_model=ContributorResponse)
async def get_contributor(contributor_id: str) -> ContributorResponse:
    """Get contributor profile and statistics."""
    engine = get_crowdsourcing_engine()

    contributor = engine.contributors.get(contributor_id)
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")

    stats = engine.get_contributor_stats(contributor_id)

    return ContributorResponse(
        id=contributor.id,
        username=contributor.username,
        level=contributor.level,
        total_points=contributor.total_points,
        completed_tasks=contributor.completed_tasks,
        average_quality=contributor.average_quality,
        streak_days=contributor.streak_days,
        reputation=contributor.reputation,
        achievements=stats["achievements"],
        languages=contributor.languages,
    )


@router.get("/contributors/{contributor_id}/recommended-tasks")
async def get_recommended_tasks(
    contributor_id: str,
    limit: int = Query(default=10, le=50),
) -> list[TaskResponse]:
    """Get recommended tasks for a contributor."""
    engine = get_crowdsourcing_engine()

    if contributor_id not in engine.contributors:
        raise HTTPException(status_code=404, detail="Contributor not found")

    tasks = engine.get_recommended_tasks(contributor_id, limit=limit)

    return [
        TaskResponse(
            id=t.id,
            type=t.type.value,
            difficulty=t.difficulty.value,
            status=t.status.value,
            content=t.content,
            instructions=t.instructions,
            estimated_time=t.estimated_time,
            points=t.points,
            language=t.language,
            assigned_to=t.assigned_to,
            quality_score=t.quality_score,
        )
        for t in tasks
    ]


@router.get("/contributors/{contributor_id}/stats")
async def get_contributor_stats(contributor_id: str) -> dict[str, Any]:
    """Get detailed contributor statistics."""
    engine = get_crowdsourcing_engine()

    stats = engine.get_contributor_stats(contributor_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Contributor not found")

    return stats


# ============================================================================
# Leaderboard Endpoints
# ============================================================================


@router.get("/leaderboard")
async def get_leaderboard(
    metric: str = Query(
        default="points",
        description="Metric to rank by (points, quality, tasks)",
    ),
    period: str = Query(
        default="all-time",
        description="Time period (daily, weekly, monthly, all-time)",
    ),
    limit: int = Query(default=100, le=500),
) -> list[dict[str, Any]]:
    """
    Get leaderboard rankings.

    - **metric**: Ranking metric (points, quality, tasks)
    - **period**: Time period (daily, weekly, monthly, all-time)
    - **limit**: Maximum number of entries
    """
    engine = get_crowdsourcing_engine()

    leaderboard = engine.get_leaderboard(
        metric=metric,
        period=period,
        limit=limit,
    )

    return [
        {
            "rank": entry.rank,
            "contributor_id": entry.contributor_id,
            "username": entry.username,
            "score": entry.score,
            "metric": entry.metric,
            "period": entry.period,
        }
        for entry in leaderboard
    ]


# ============================================================================
# Achievement Endpoints
# ============================================================================


@router.get("/achievements")
async def list_achievements() -> list[dict[str, Any]]:
    """List all available achievements."""
    engine = get_crowdsourcing_engine()

    return [
        {
            "type": ach.type.value,
            "name": ach.name,
            "description": ach.description,
            "icon": ach.icon,
            "points": ach.points,
            "condition": ach.condition,
        }
        for ach in engine.achievements_db.values()
    ]


# ============================================================================
# Platform Statistics Endpoints
# ============================================================================


@router.get("/stats")
async def get_platform_stats() -> dict[str, Any]:
    """Get overall platform statistics."""
    engine = get_crowdsourcing_engine()
    return engine.get_platform_stats()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "crowdsourcing"}
