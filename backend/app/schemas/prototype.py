"""Pydantic schemas for prototype overview + interests."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Sequence

from pydantic import BaseModel, EmailStr, Field


class PrototypeFeature(BaseModel):
    id: str
    title: str
    summary: str
    icon: str
    pillar: str
    metric_label: str | None = None
    metric_value: str | None = None


class PrototypeFlow(BaseModel):
    id: str
    title: str
    bullets: list[str]
    highlight: str


class PrototypeStat(BaseModel):
    label: str
    value: str
    context: str


class PrototypeTimelinePhase(BaseModel):
    phase: str
    weeks: str
    focus: list[str]
    outcome: str


class PrototypeTechStack(BaseModel):
    layer: str
    tools: list[str]


class PrototypePreviewMode(BaseModel):
    id: str
    title: str
    caption: str
    illustration: str
    actions: list[str]


class PrototypeHero(BaseModel):
    headline: str
    subheading: str
    promise: str
    location: str
    hero_stats: list[PrototypeStat]


class PrototypeCallToAction(BaseModel):
    headline: str
    subtitle: str
    contact_email: EmailStr
    discord: str
    deck_url: str | None = None


class PrototypeOverview(BaseModel):
    hero: PrototypeHero
    features: list[PrototypeFeature]
    flows: list[PrototypeFlow]
    preview_modes: list[PrototypePreviewMode]
    timeline: list[PrototypeTimelinePhase]
    tech_stack: list[PrototypeTechStack]
    call_to_action: PrototypeCallToAction


class PrototypeInterestCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    role: str = Field(..., min_length=2, max_length=120)
    organization: str | None = Field(default=None, max_length=255)
    focus_area: str | None = Field(default=None, max_length=255)
    message: str | None = Field(default=None, max_length=2000)


class PrototypeInterestResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    organization: str | None = None
    focus_area: str | None = None
    message: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
