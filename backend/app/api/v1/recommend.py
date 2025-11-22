"""Recommendation endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.recommend import RecommendationRequest, RecommendationResponse
from app.services.knowledge_graph import get_knowledge_graph
from app.services.recommend import RecommendationService


def get_recommender():
    """
    Lazy-load the advanced recommender to avoid hard import errors during
    analysis.
    Returns a recommender instance with 'recommend' and
    'counterfactual_explain'.
    """
    try:
        from app.services.advanced_recommender import get_recommender as _get
        return _get()
    except Exception:
        class _StubRecommender:
            def recommend(self, user_id, user_context, candidate_ids, top_k):
                return []

            def counterfactual_explain(self, content_id, user_id, user_context):
                raise HTTPException(status_code=501, detail="Advanced recommender not available")
        return _StubRecommender()

router = APIRouter()


def get_recommendation_service(
    db: Session = Depends(get_db),
) -> RecommendationService:
    return RecommendationService(db)


class AdvancedRecommendRequest(BaseModel):
    user_id: str
    user_context: dict[str, Any]
    candidate_ids: list[str]
    top_k: int = 10


class CounterfactualRequest(BaseModel):
    content_id: str
    user_id: str
    user_context: dict[str, Any]


@router.post("/books", response_model=RecommendationResponse)
async def recommend_books(
    request: RecommendationRequest,
    service: RecommendationService = Depends(get_recommendation_service),
) -> RecommendationResponse:
    return await service.recommend_books(request)


@router.post("/advanced")
async def recommend_advanced(
    request: AdvancedRecommendRequest,
) -> dict[str, Any]:
    """
    Advanced recommendations with multi-objective optimization.

    Features:
    - Multi-objective scoring (relevance, difficulty, novelty, engagement)
    - Explainable recommendations
    - Confidence scores
    """
    recommender = get_recommender()

    recommendations = recommender.recommend(
        user_id=request.user_id,
        user_context=request.user_context,
        candidate_ids=request.candidate_ids,
        top_k=request.top_k,
    )

    return {
        "recommendations": [
            {
                "content_id": rec.content_id,
                "overall_score": rec.overall_score,
                "objective_scores": rec.objective_scores,
                "explanation": rec.explanation,
                "confidence": rec.confidence,
            }
            for rec in recommendations
        ],
        "total": len(recommendations),
    }


@router.post("/counterfactual")
async def counterfactual_explanation(
    request: CounterfactualRequest,
) -> dict[str, Any]:
    """
    Generate counterfactual explanation for why content was not recommended.
    
    Answers: "What would need to change for this to be recommended?"
    """
    recommender = get_recommender()
    
    explanation = recommender.counterfactual_explain(
        content_id=request.content_id,
        user_id=request.user_id,
        user_context=request.user_context,
    )
    
    return explanation


@router.get("/knowledge-graph/stats")
async def knowledge_graph_stats() -> dict[str, Any]:
    """Get knowledge graph statistics."""
    kg = get_knowledge_graph()
    return kg.get_statistics()


@router.get("/knowledge-graph/path/{start_id}/{end_id}")
async def find_learning_path(start_id: str, end_id: str) -> dict[str, Any]:
    """Find optimal learning path between two content items."""
    kg = get_knowledge_graph()
    path = kg.find_learning_path(start_id, end_id)
    
    return {
        "start": start_id,
        "end": end_id,
        "path": path,
        "length": len(path) - 1 if len(path) > 1 else 0,
    }


@router.get("/knowledge-graph/related/{content_id}")
async def find_related_content(
    content_id: str,
    max_hops: int = 2,
    limit: int = 10,
) -> dict[str, Any]:
    """Find related content using multi-hop graph traversal."""
    kg = get_knowledge_graph()
    related = kg.find_related_content(
        content_id=content_id,
        max_hops=max_hops,
        limit=limit,
    )
    
    return {
        "content_id": content_id,
        "related": [
            {"content_id": cid, "relevance_score": score}
            for cid, score in related
        ],
        "total": len(related),
    }
