"""Gamification endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.services.gamification import GamificationService
from app.api.v1.users import get_current_user
from app.models.user import User

router = APIRouter()

class ActivityRequest(BaseModel):
    activity_type: str

@router.post("/activity")
def log_user_activity(
    request: ActivityRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = GamificationService(db)
    updated_user = service.log_activity(user.id, request.activity_type)
    return {"points": updated_user.points, "level": updated_user.level}

@router.get("/status")
def get_user_status(
    user: User = Depends(get_current_user),
):
    return {"points": user.points, "level": user.level}

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    top_users = db.query(User).order_by(User.points.desc()).limit(10).all()
    return [
        {"username": user.username, "points": user.points, "level": user.level}
        for user in top_users
    ]
