"""
認知負荷優化器 API
========================================

基於認知科學的學習優化 REST API
實現 Sweller 認知負荷理論 + SM-2 間隔重複

端點:
- POST /assess-load - 評估認知負荷
- POST /adapt-content - 自適應內容調整
- POST /schedule-review - 生成複習排程
- POST /adaptive-scaffold - 動態支架建議
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

from app.db.database import get_db
from app.services.cognitive_optimizer import (
    CognitiveLoadEstimator,
    ContentAdaptationEngine,
    SpacedRepetitionScheduler,
    CognitiveMetrics,
    ContentDifficulty,
    CognitiveState
)

router = APIRouter()


class AssessLoadRequest(BaseModel):
    """認知負荷評估請求"""
    user_id: str = Field(..., description="用戶 ID")
    reading_speed: float = Field(..., ge=0, description="閱讀速度 (字/分鐘)")
    error_rate: float = Field(..., ge=0, le=1, description="錯誤率 (0-1)")
    pause_frequency: float = Field(..., ge=0, description="暫停頻率 (次/分鐘)")
    heart_rate_variability: Optional[float] = Field(
        None,
        description="心率變異性 (HRV from Apple Watch)"
    )
    session_duration: float = Field(0, ge=0, description="會話時長 (分鐘)")
    content_difficulty: Dict[str, float] = Field(
        ...,
        description="內容難度指標"
    )


class AssessLoadResponse(BaseModel):
    """認知負荷評估回應"""
    cognitive_load: float = Field(..., description="認知負荷 (0-1)")
    state: str = Field(..., description="認知狀態")
    recommendations: List[str]
    timestamp: datetime


class AdaptContentRequest(BaseModel):
    """內容調整請求"""
    content: str = Field(..., description="原始內容")
    target_load: float = Field(0.7, ge=0, le=1, description="目標認知負荷")
    current_load: float = Field(..., ge=0, le=1, description="當前認知負荷")
    user_level: str = Field("intermediate", description="用戶水平")


class AdaptContentResponse(BaseModel):
    """內容調整回應"""
    original_content: str
    adapted_content: str
    simplifications: List[str]
    difficulty_before: float
    difficulty_after: float
    strategy: str


class ScheduleReviewRequest(BaseModel):
    """複習排程請求"""
    content_id: str
    user_id: str
    quality_score: int = Field(..., ge=0, le=5, description="複習品質 (0-5)")
    repetition_number: int = Field(0, ge=0, description="複習次數")
    easiness_factor: float = Field(2.5, ge=1.3, le=2.5, description="容易度")


class ScheduleReviewResponse(BaseModel):
    """複習排程回應"""
    content_id: str
    next_review: datetime
    interval_days: int
    new_easiness_factor: float
    repetition_number: int
    algorithm: str = "supermemo_sm2"


class AdaptiveScaffoldRequest(BaseModel):
    """動態支架請求"""
    current_load: float = Field(..., ge=0, le=1)
    target_load: float = Field(0.7, ge=0, le=1)
    learning_context: Dict[str, Any] = Field(default_factory=dict)


class AdaptiveScaffoldResponse(BaseModel):
    """動態支架回應"""
    action: str
    recommendations: List[str]
    support_level: str
    reasoning: str


@router.post("/assess-load", response_model=AssessLoadResponse)
async def assess_cognitive_load(
    request: AssessLoadRequest,
    db: Session = Depends(get_db)
):
    """
    評估當前認知負荷
    
    基於多維度指標:
    - 行為指標 (閱讀速度、錯誤率、暫停頻率)
    - 生理指標 (心率變異性 from Apple Watch)
    - 內容難度
    
    返回 0-1 的負荷值:
    - < 0.4: 負荷不足 (too easy)
    - 0.4-0.8: 最佳負荷 (optimal)
    - > 0.8: 負荷過高 (overload)
    """
    try:
        # 構建認知指標
        metrics = CognitiveMetrics(
            reading_speed=request.reading_speed,
            error_rate=request.error_rate,
            pause_frequency=request.pause_frequency,
            heart_rate_variability=request.heart_rate_variability,
            session_duration=request.session_duration
        )
        
        # 構建內容難度
        difficulty = ContentDifficulty(
            lexical_complexity=request.content_difficulty.get(
                "lexical", 0.5
            ),
            syntactic_complexity=request.content_difficulty.get(
                "syntactic", 0.5
            ),
            concept_density=request.content_difficulty.get("concept", 0.5),
            cultural_distance=request.content_difficulty.get(
                "cultural", 0.5
            )
        )
        
        # 評估負荷
        estimator = CognitiveLoadEstimator()
        load = estimator.estimate_load(
            user_id=request.user_id,
            metrics=metrics,
            content_difficulty=difficulty
        )
        
        # 判斷狀態
        if load < 0.4:
            state = CognitiveState.UNDERLOAD.value
            recommendations = [
                "增加內容複雜度",
                "引入挑戰性問題",
                "減少提示與支架"
            ]
        elif load > 0.8:
            state = CognitiveState.OVERLOAD.value
            recommendations = [
                "簡化內容呈現",
                "增加視覺輔助",
                "分段學習",
                "提供更多範例"
            ]
        else:
            state = CognitiveState.OPTIMAL.value
            recommendations = ["保持當前學習節奏"]
        
        return AssessLoadResponse(
            cognitive_load=load,
            state=state,
            recommendations=recommendations,
            timestamp=datetime.now()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"認知負荷評估失敗: {str(e)}"
        )


@router.post("/adapt-content", response_model=AdaptContentResponse)
async def adapt_content(
    request: AdaptContentRequest,
    db: Session = Depends(get_db)
):
    """
    自適應內容調整
    
    根據當前認知負荷自動調整內容難度:
    - 負荷過高 → 簡化內容
    - 負荷過低 → 增加挑戰
    """
    try:
        adapter = ContentAdaptationEngine()
        
        # 執行內容調整
        result = await adapter.adapt_to_load(
            content=request.content,
            current_load=request.current_load,
            target_load=request.target_load,
            user_level=request.user_level
        )
        
        return AdaptContentResponse(
            original_content=result.original_text,
            adapted_content=result.adapted_text,
            simplifications=result.simplifications,
            difficulty_before=result.difficulty_before,
            difficulty_after=result.difficulty_after,
            strategy=result.adaptation_strategy
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"內容調整失敗: {str(e)}"
        )


@router.post("/schedule-review", response_model=ScheduleReviewResponse)
async def schedule_review(
    request: ScheduleReviewRequest,
    db: Session = Depends(get_db)
):
    """
    生成間隔重複排程
    
    使用 SuperMemo SM-2 演算法優化複習時間:
    - 根據複習品質動態調整間隔
    - 自動計算下次複習時間
    - 追蹤容易度因子
    """
    try:
        scheduler = SpacedRepetitionScheduler()
        
        # 計算下次複習時間
        schedule = scheduler.calculate_next_review(
            content_id=request.content_id,
            user_id=request.user_id,
            quality_score=request.quality_score,
            current_repetition=request.repetition_number,
            current_easiness=request.easiness_factor
        )
        
        return ScheduleReviewResponse(
            content_id=schedule.content_id,
            next_review=schedule.next_review,
            interval_days=schedule.interval_days,
            new_easiness_factor=schedule.easiness_factor,
            repetition_number=schedule.repetition_number
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"排程生成失敗: {str(e)}"
        )


@router.post("/adaptive-scaffold", response_model=AdaptiveScaffoldResponse)
async def adaptive_scaffold(
    request: AdaptiveScaffoldRequest,
    db: Session = Depends(get_db)
):
    """
    動態支架建議
    
    基於認知負荷提供實時學習支持:
    - 負荷過高 → 增加支架
    - 負荷適中 → 維持
    - 負荷過低 → 減少支架,增加挑戰
    """
    load_diff = request.current_load - request.target_load
    
    if load_diff > 0.1:
        # 負荷過高
        return AdaptiveScaffoldResponse(
            action="increase_support",
            recommendations=[
                "提供分步指導",
                "增加視覺輔助 (圖表、動畫)",
                "簡化專業術語",
                "提供具體範例",
                "啟用即時提示"
            ],
            support_level="high",
            reasoning="當前認知負荷過高,需要更多支持"
        )
    elif load_diff < -0.1:
        # 負荷過低
        return AdaptiveScaffoldResponse(
            action="increase_challenge",
            recommendations=[
                "引入複雜概念",
                "減少提示頻率",
                "提出開放性問題",
                "鼓勵獨立探索",
                "連結到進階資源"
            ],
            support_level="low",
            reasoning="當前任務過於簡單,需要增加挑戰"
        )
    else:
        # 負荷適中
        return AdaptiveScaffoldResponse(
            action="maintain",
            recommendations=["保持當前支架水平", "持續監測學習狀態"],
            support_level="optimal",
            reasoning="當前認知負荷處於最佳範圍"
        )


@router.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "service": "cognitive_optimizer",
        "features": [
            "cognitive_load_assessment",
            "adaptive_content",
            "spaced_repetition_sm2",
            "dynamic_scaffolding",
            "healthkit_integration"
        ],
        "theory": "Sweller Cognitive Load Theory (1988)"
    }
