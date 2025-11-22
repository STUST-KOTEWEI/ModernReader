"""Prototype API contract tests."""
from __future__ import annotations

import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1 import prototype as prototype_router
from app.db.database import engine
from app.models import Base

app = FastAPI()
app.include_router(
    prototype_router.router,
    prefix="/api/v1/prototype",
    tags=["prototype"],
)

Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_overview_payload_shape() -> None:
    response = client.get("/api/v1/prototype/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["hero"]["headline"] == "ModernReader"
    assert len(data["features"]) >= 4
    assert data["timeline"]


def test_submit_interest_creates_record() -> None:
    payload = {
        "name": "Demo Collaborator",
        "email": f"demo-{uuid.uuid4()}@example.com",
        "role": "AI Researcher",
        "organization": "Prototype Lab",
        "focus_area": "Podcast Engine",
        "message": "Excited to contribute TTS stack.",
    }
    response = client.post("/api/v1/prototype/interests", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == payload["role"]
