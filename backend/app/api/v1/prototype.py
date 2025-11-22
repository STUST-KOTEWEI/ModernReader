"""Prototype overview + collaborator intake routes."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prototype import PrototypeInterest
from app.schemas.prototype import (
    PrototypeCallToAction,
    PrototypeFeature,
    PrototypeFlow,
    PrototypeHero,
    PrototypeInterestCreate,
    PrototypeInterestResponse,
    PrototypeOverview,
    PrototypePreviewMode,
    PrototypeStat,
    PrototypeTechStack,
    PrototypeTimelinePhase,
)

router = APIRouter()


_HERO = PrototypeHero(
    headline="ModernReader",
    subheading="柔性電子紙 × AI 族語守護 × 多模態觸覺",
    promise="把台灣 16 族語、無障礙閱讀、Podcast 自動生成與 hyRead 等級 DRM 集成於同一個平台。",
    location="南臺科技大學 · 台南 · 2025 Q4",
    hero_stats=[
        PrototypeStat(label="16", value="原民語", context="完整語料庫 + Podcast"),
        PrototypeStat(label="134 週", value="研發期", context="Sweet 流程四階段"),
        PrototypeStat(label="59%", value="硬體投入", context="E Ink + 觸覺模組"),
    ],
)

_FEATURES: list[PrototypeFeature] = [
    PrototypeFeature(
        id="flex-paper",
        title="柔性電子紙控制塔",
        summary="25.3 吋 E Ink Spectra 6，支援 3D 形變、暫存多語教材、觸覺筆觸。",
        icon="📖",
        pillar="See / Experience",
        metric_label="解析度",
        metric_value="300 PPI",
    ),
    PrototypeFeature(
        id="podcast-engine",
        title="Podcast 自動生成",
        summary="8 種聲線、200 種語言，一鍵把書籍章節轉成 Podcast 並在 DRM 保護下分享。",
        icon="🎙️",
        pillar="Enjoy",
        metric_label="產出速度",
        metric_value="10萬字 / 10 分",
    ),
    PrototypeFeature(
        id="drm",
        title="hyRead 級 DRM 金字塔",
        summary="帳密＋生物辨識＋裝置綁定＋浮水印＋離線授權，全流程追蹤內容權益。",
        icon="🛡️",
        pillar="Tell / Rights",
        metric_label="保護層級",
        metric_value="4 層",
    ),
    PrototypeFeature(
        id="ai-companion",
        title="可變人格 AI 伴侶",
        summary="依情境切換族語導師、文化講者、家庭長輩、科技助理，結合觸覺與溫度回饋。",
        icon="🤖",
        pillar="Watch / Experience",
        metric_label="人格模式",
        metric_value="10+",
    ),
    PrototypeFeature(
        id="indigenous-suite",
        title="族語守護工具鏈",
        summary="手寫辨識、發音評測、語音資料庫、文化審查流程，一次到位。",
        icon="🏔️",
        pillar="Culture",
        metric_label="語料",
        metric_value="10k 句/族",
    ),
    PrototypeFeature(
        id="device-cloud",
        title="裝置雲 ×觸覺管線",
        summary="Ultraleap/Tanvas/HaptX API 統一管理，支援溫度、振動、紋理等多模態指令。",
        icon="🌐",
        pillar="Infra",
        metric_label="觸覺節點",
        metric_value="190+",
    ),
]

_FLOWS = [
    PrototypeFlow(
        id="sweet",
        title="Sweet 流程",
        bullets=[
            "See：彩色電子紙展示族語圖騰",
            "Watch：Ultraleap 手勢＋語音命令",
            "Experience：溫度/振動/紋理三層觸覺",
            "Enjoy：遊戲化族語學習 + Podcast 回饋",
            "Tell：社群分享＋QR＋學習報告",
        ],
        highlight="五階段流程成為跨領域 HCI 教學範式。",
    ),
    PrototypeFlow(
        id="podcast",
        title="Auto Podcast",
        bullets=[
            "Meta NLLB-200 多語翻譯",
            "GPT-4 情緒標註 → TTS-1-HD 合成",
            "背景音樂動態混音",
            "MP3 匯出 + hyRead DRM 保護",
        ],
        highlight="10 萬字內容 < 10 分鐘完成，200 種語言互轉。",
    ),
    PrototypeFlow(
        id="drm-flow",
        title="DRM + 內容平台",
        bullets=[
            "帳密 + CAPTCHA + 圖書證整合",
            "Face/Touch ID、聲紋、Windows Hello",
            "最多 3 台裝置 + 異地警示",
            "AES-256 + 浮水印 + 借閱到期回收",
        ],
        highlight="與 hyRead、博客來、UDN、Readmoo 等平台協同。",
    ),
    PrototypeFlow(
        id="ai-companion-flow",
        title="AI 伴侶 + 族語守護",
        bullets=[
            "族語導師、文化講者等人格自動切換",
            "情境觸發：時間/地點/內容/權限",
            "觸覺模組同時變換溫度與振動",
            "LLM + Whisper + TTS 雙向互動",
        ],
        highlight="智慧導覽結合情境觸覺與語音守護。",
    ),
]

_PREVIEW_MODES = [
    PrototypePreviewMode(
        id="device",
        title="柔性電子紙預覽",
        caption="折疊式 25 吋顯示器展示部落繪本 + 寫作共編。",
        illustration="flex-epaper",
        actions=["套用族語主題", "推送到裝置群組", "啟用觸覺波形"],
    ),
    PrototypePreviewMode(
        id="podcast",
        title="Podcast 合成機",
        caption="挑選耆老、親子、冒險、驚悚等 8 種聲線與配樂。",
        illustration="podcast",
        actions=["選擇章節", "調整語速", "下載 MP3"],
    ),
    PrototypePreviewMode(
        id="drm",
        title="DRM 指揮室",
        caption="即時看到授權狀態、異地登入、浮水印追蹤。",
        illustration="drm",
        actions=["核准新裝置", "查詢水印", "匯出審計紀錄"],
    ),
    PrototypePreviewMode(
        id="ai",
        title="AI 伴侶面板",
        caption="快速切換人格、查看情緒遙測、觸覺腳本。",
        illustration="ai",
        actions=["切換人格", "推播觸覺劇本", "產出練習任務"],
    ),
]

_TIMELINE = [
    PrototypeTimelinePhase(
        phase="Phase 1 · 基礎技術",
        weeks="1-26 週",
        focus=[
            "語料庫建置",
            "DRM/安全架構",
            "觸覺模組 Beta",
        ],
        outcome="完成軟硬體原型 + Podcast 引擎 Demo",
    ),
    PrototypeTimelinePhase(
        phase="Phase 2 · 核心整合",
        weeks="27-61 週",
        focus=[
            "3D 變形顯示",
            "AI Chatbot + Podcast",
            "DRM 正式上線",
        ],
        outcome="Sweet 流程 + AI 伴侶首次整合",
    ),
    PrototypeTimelinePhase(
        phase="Phase 3 · 場域驗證",
        weeks="62-96 週",
        focus=[
            "部落教室",
            "圖書館 + 視障單位",
            "技術標準草擬",
        ],
        outcome="Alpha → Beta，完成教育場域驗證",
    ),
    PrototypeTimelinePhase(
        phase="Phase 4 · 產業化",
        weeks="97-134 週",
        focus=[
            "量產規劃",
            "技轉與合作",
            "國際推廣",
        ],
        outcome="正式產品 + 生產線 + 市場策略",
    ),
]

_TECH_STACK = [
    PrototypeTechStack(
        layer="顯示/觸覺",
        tools=[
            "E Ink Spectra 6",
            "友達柔性 TFT",
            "Ultraleap",
            "Tanvas",
            "HaptX",
            "bHaptics",
        ],
    ),
    PrototypeTechStack(
        layer="AI 語言 / 語音",
        tools=[
            "OpenAI GPT-4 / TTS / Whisper",
            "Meta NLLB-200",
            "NVIDIA A100 / 聯發科邊緣 AI",
            "科大訊飛",
            "雅婷逐字稿",
        ],
    ),
    PrototypeTechStack(
        layer="DRM / 內容",
        tools=[
            "hyRead",
            "博客來 / UDN / Readmoo / Pubu",
            "Kobo / Google Play / Springer",
            "AES-256 + 浮水印 + 借閱到期",
        ],
    ),
    PrototypeTechStack(
        layer="場域 / 文化",
        tools=[
            "南臺科大 / 國圖 / 台大成大聯盟",
            "中研院語言所 / ALCD",
            "MI2S 實驗室 / 部落耆老網絡",
        ],
    ),
]

_CTA = PrototypeCallToAction(
    headline="一起把 ModernReader 推向教育與文化現場",
    subtitle="開放徵求：AI / HCI / 族語、內容、硬體、無障礙、營運夥伴。",
    contact_email="hello@modernreader.com",
    discord="https://discord.gg/modernreader",
    deck_url="https://modernreader.com/deck",
)

_OVERVIEW = PrototypeOverview(
    hero=_HERO,
    features=_FEATURES,
    flows=_FLOWS,
    preview_modes=_PREVIEW_MODES,
    timeline=_TIMELINE,
    tech_stack=_TECH_STACK,
    call_to_action=_CTA,
)


@router.get("/overview", response_model=PrototypeOverview)
def get_prototype_overview() -> PrototypeOverview:
    """Return a structured payload for the frontend showcase."""
    return _OVERVIEW


@router.post(
    "/interests",
    response_model=PrototypeInterestResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_interest(
    payload: PrototypeInterestCreate,
    db: Session = Depends(get_db),
) -> PrototypeInterestResponse:
    """Store collaborator interest and return upserted record."""
    existing = (
        db.query(PrototypeInterest)
        .filter(PrototypeInterest.email == payload.email)
        .one_or_none()
    )
    timestamp = datetime.utcnow()
    if existing:
        existing.name = payload.name
        existing.role = payload.role
        existing.organization = payload.organization
        existing.focus_area = payload.focus_area
        existing.message = payload.message
        existing.updated_at = timestamp
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return PrototypeInterestResponse.model_validate(existing)

    record = PrototypeInterest(
        id=uuid.uuid4(),
        name=payload.name,
        email=payload.email,
        role=payload.role,
        organization=payload.organization,
        focus_area=payload.focus_area,
        message=payload.message,
        created_at=timestamp,
        updated_at=timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return PrototypeInterestResponse.model_validate(record)
