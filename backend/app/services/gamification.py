"""Gamification service for tracking user points and levels."""
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.gamification import UserActivity

POINTS_MAP = {
    "CHAT_MESSAGE_SENT": 1,
    "LEARNING_PATH_COMPLETED": 25,
    "BOOK_READ": 50,
    "PROFILE_UPDATED": 10,
}

LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 300,
    4: 600,
    5: 1000,
}

class GamificationService:
    def __init__(self, db: Session):
        self.db = db

    def log_activity(self, user_id: str, activity_type: str) -> User:
        user = self.db.query(User).filter(User.id == user_id).one()
        points = POINTS_MAP.get(activity_type, 0)

        if points > 0:
            activity = UserActivity(
                user_id=user.id,
                activity_type=activity_type,
                points_earned=points,
            )
            self.db.add(activity)

            user.points += points
            
            # Check for level up
            new_level = user.level
            for level, threshold in sorted(LEVEL_THRESHOLDS.items(), reverse=True):
                if user.points >= threshold:
                    new_level = level
                    break
            
            if new_level > user.level:
                user.level = new_level

            self.db.commit()
            self.db.refresh(user)

        return user
