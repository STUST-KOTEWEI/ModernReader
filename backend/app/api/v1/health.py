"""Simple health/readiness endpoints for uptime checks."""
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()


def _payload(status: str) -> dict:
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "modernreader-api",
        "version": "1.0.0",
    }


@router.get("/health")
async def health() -> dict:
    """Basic liveness check (no dependencies)."""
    return _payload("ok")


@router.get("/live")
async def live() -> dict:
    """Alias of /health for common probes."""
    return _payload("ok")


@router.get("/ready")
async def ready() -> dict:
    """Readiness check placeholder (extend with DB/pools)."""
    # TODO: add DB connectivity checks if needed
    return _payload("ready")
