"""Schemas for content upload, purchase and unlock flows"""
from pydantic import BaseModel, Field
from typing import Optional


class UploadContentRequest(BaseModel):
    book_id: str = Field(
        ...,
        description=(
            "Existing Book ID to attach content to"
        ),
    )

    text: str = Field(
        ...,
        description=(
            "Plain extracted text or a small content sample"
        ),
    )

    format: Optional[str] = Field(
        None,
        description="pdf|epub|txt",
    )


class UploadContentResponse(BaseModel):
    status: str
    content_id: Optional[str]


class PurchaseRequest(BaseModel):
    book_id: str
    amount: float
    currency: Optional[str] = "TWD"


class PurchaseResponse(BaseModel):
    status: str
    unlock_code: Optional[str]


class UnlockCheckResponse(BaseModel):
    status: str
    book_id: Optional[str]
    unlocked: bool
