"""
神經符號推薦引擎 API
========================================

多目標優化推薦系統 REST API
基於知識圖譜與 Pareto 最優解

端點:
- POST /recommend - 多目標推薦
- GET  /objectives - 可用目標列表
- POST /explain - 推薦理由解釋
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.advanced_recommender import (
    MultiObjectiveRecommender,
    RecommendationObjective,
    AdvancedRecommendation
)
from app.services.knowledge_graph import get_knowledge_graph

router = APIRouter()


class ObjectiveWeight(BaseModel):
    """單個目標權重"""
    name: str = Field(..., description="目標名稱")
    weight: float = Field(..., ge=0.0, le=1.0, description="權重 (0-1)")
    maximize: bool = Field(True, description="是否最大化")


class RecommendRequest(BaseModel):
    """推薦請求"""
    user_id: str = Field(..., description="用戶 ID")
    candidate_ids: List[str] = Field(..., description="候選內容 ID 列表")
    top_k: int = Field(10, ge=1, le=50, description="返回推薦數量")
    objectives: Optional[List[ObjectiveWeight]] = Field(
        None,
        description="自定義目標權重,不提供則使用預設"
    )
    user_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="用戶上下文 (閱讀歷史、偏好等)"
    )


class RecommendationResult(BaseModel):
    """推薦結果"""
    content_id: str
    overall_score: float
    objective_scores: Dict[str, float]
    explanation: Dict[str, Any]
    confidence: float
    rank: int


class RecommendResponse(BaseModel):
    """推薦回應"""
    recommendations: List[RecommendationResult]
    total_candidates: int
    objectives_used: List[str]
    algorithm: str = "multi_objective_pareto"


class ExplainRequest(BaseModel):
    """解釋請求"""
    user_id: str
    content_id: str
    user_context: Dict[str, Any] = Field(default_factory=dict)


class ExplainResponse(BaseModel):
    """解釋回應"""
    content_id: str
    explanation: Dict[str, Any]
    reasoning: str
    counterfactuals: List[str]


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_content(
    request: RecommendRequest,
    db: Session = Depends(get_db)
):
    """
    多目標優化推薦
    
    使用 Pareto 最優解進行推薦,支援自定義目標權重。
    
    預設目標:
    - relevance (35%): 相關性
    - difficulty_match (25%): 難度匹配
    - novelty (20%): 新穎性
    - engagement (20%): 參與度
    """
    try:
        # 構建目標列表
        objectives = None
        if request.objectives:
            objectives = [
                RecommendationObjective(
                    name=obj.name,
                    weight=obj.weight,
                    maximize=obj.maximize
                )
                for obj in request.objectives
            ]
        
        # 初始化推薦器
        kg = get_knowledge_graph()
        recommender = MultiObjectiveRecommender(
            knowledge_graph=kg,
            objectives=objectives
        )
        
        # 執行推薦
        recommendations = recommender.recommend(
            user_id=request.user_id,
            user_context=request.user_context,
            candidate_ids=request.candidate_ids,
            top_k=request.top_k
        )
        
        # 格式化結果
        results = [
            RecommendationResult(
                content_id=rec.content_id,
                overall_score=rec.overall_score,
                objective_scores=rec.objective_scores,
                explanation=rec.explanation,
                confidence=rec.confidence,
                rank=i + 1
            )
            for i, rec in enumerate(recommendations)
        ]
        
        objectives_used = [obj.name for obj in recommender.objectives]
        
        return RecommendResponse(
            recommendations=results,
            total_candidates=len(request.candidate_ids),
            objectives_used=objectives_used
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"推薦失敗: {str(e)}"
        )


@router.get("/objectives")
async def list_objectives():
    """
    列出可用的推薦目標
    
    返回所有支援的優化目標及其描述
    """
    return {
        "objectives": [
            {
                "name": "relevance",
                "description": "內容相關性 - 與用戶興趣的匹配度",
                "default_weight": 0.35,
                "maximize": True
            },
            {
                "name": "difficulty_match",
                "description": "難度匹配 - 內容難度與用戶能力的適配度",
                "default_weight": 0.25,
                "maximize": True
            },
            {
                "name": "novelty",
                "description": "新穎性 - 內容的新鮮度與探索價值",
                "default_weight": 0.20,
                "maximize": True
            },
            {
                "name": "engagement",
                "description": "參與度 - 預期的用戶互動與投入程度",
                "default_weight": 0.20,
                "maximize": True
            },
            {
                "name": "cultural_resonance",
                "description": "文化共鳴 - 與用戶文化背景的契合度",
                "default_weight": 0.0,
                "maximize": True
            }
        ],
        "total": 5,
        "algorithm": "pareto_multi_objective_optimization"
    }


@router.post("/explain", response_model=ExplainResponse)
async def explain_recommendation(
    request: ExplainRequest,
    db: Session = Depends(get_db)
):
    """
    解釋推薦理由
    
    提供可解釋的推薦理由,包含:
    - 為何推薦此內容
    - 各項指標得分
    - 反事實解釋 (如何讓推薦更好)
    """
    try:
        kg = get_knowledge_graph()
        recommender = MultiObjectiveRecommender(knowledge_graph=kg)
        
        # 執行單個內容的推薦分析
        recommendations = recommender.recommend(
            user_id=request.user_id,
            user_context=request.user_context,
            candidate_ids=[request.content_id],
            top_k=1
        )
        
        if not recommendations:
            raise HTTPException(
                status_code=404,
                detail="無法分析該內容"
            )
        
        rec = recommendations[0]
        
        # 生成人類可讀的解釋
        reasoning_parts = []
        for obj_name, score in rec.objective_scores.items():
            if score > 0.7:
                reasoning_parts.append(f"{obj_name} 得分高 ({score:.2f})")
            elif score < 0.3:
                reasoning_parts.append(f"{obj_name} 得分較低 ({score:.2f})")
        
        reasoning = "推薦原因: " + ", ".join(reasoning_parts) if reasoning_parts else "綜合評估推薦"
        
        # 反事實解釋 (如何改進)
        counterfactuals = []
        for obj_name, score in rec.objective_scores.items():
            if score < 0.5:
                counterfactuals.append(
                    f"提升 {obj_name} 可增強推薦效果"
                )
        
        return ExplainResponse(
            content_id=request.content_id,
            explanation=rec.explanation,
            reasoning=reasoning,
            counterfactuals=counterfactuals
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"解釋生成失敗: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """健康檢查"""
    kg = get_knowledge_graph()
    return {
        "status": "healthy",
        "service": "recommender",
        "knowledge_graph": {
            "nodes": kg.graph.number_of_nodes(),
            "edges": kg.graph.number_of_edges()
        },
        "features": [
            "multi_objective_optimization",
            "pareto_optimal",
            "explainable_ai",
            "cultural_resonance"
        ]
    }
