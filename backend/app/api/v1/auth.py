"""Authentication endpoints."""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.services.auth import AuthService
from app.db.database import get_db

router = APIRouter()


def get_auth_service(db: Annotated[Session, Depends(get_db)]) -> AuthService:
    return AuthService(db)


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignupRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await service.signup(request)


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await service.login(request)
