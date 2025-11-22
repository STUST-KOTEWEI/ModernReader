"""Purchase and unlock endpoints."""
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.content import (
    PurchaseRequest,
    PurchaseResponse,
    UnlockCheckResponse,
)
from app.models.content import Purchase, UnlockCode
from app.models.catalog import Book
from app.api.v1.users import get_current_user
from app.models.user import User
from app.core.security import rate_limit_dependency


router = APIRouter()


def _gen_code(n: int = 10) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(n))


@router.post("/purchase", response_model=PurchaseResponse)
async def create_purchase(
    req: PurchaseRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
):
    book = db.query(Book).filter(Book.id == req.book_id).one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    # demo: create unlock code and mark purchase completed
    code = UnlockCode(
        code=_gen_code(),
        book_id=book.id,
        max_uses=1,
    )
    db.add(code)
    db.flush()
    purchase = Purchase(
        user_id=user.id,
        book_id=book.id,
        amount=req.amount,
        currency=req.currency or "TWD",
        status="completed",
        unlock_code_id=code.id,
    )
    db.add(purchase)
    db.commit()
    return PurchaseResponse(status="ok", unlock_code=code.code)


@router.get("/unlock", response_model=UnlockCheckResponse)
async def redeem_unlock(
    book_id: str,
    code: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
):
    uc = (
        db.query(UnlockCode)
        .filter(UnlockCode.book_id == book_id)
        .filter(UnlockCode.code == code)
        .one_or_none()
    )
    if not uc:
        return UnlockCheckResponse(
            status="invalid", book_id=book_id, unlocked=False
        )
    # check usage
    if uc.expires_at and uc.expires_at < datetime.now(timezone.utc):
        return UnlockCheckResponse(
            status="expired", book_id=book_id, unlocked=False
        )
    if uc.max_uses is not None and uc.current_uses >= uc.max_uses:
        return UnlockCheckResponse(
            status="exhausted", book_id=book_id, unlocked=False
        )
    # mark used
    uc.current_uses += 1
    if uc.max_uses and uc.current_uses >= uc.max_uses:
        uc.is_used = True
    # mark who used it
    uc.used_by_user_id = user.id
    uc.used_at = datetime.now(timezone.utc)
    db.add(uc)
    db.commit()
    return UnlockCheckResponse(status="ok", book_id=book_id, unlocked=True)
