"""Multisensory routing service."""
from datetime import datetime

from app.schemas.senses import SenseCommandRequest, SenseCommandResponse


class SenseService:
    async def dispatch(self, request: SenseCommandRequest) -> SenseCommandResponse:
        # TODO: Push command to device bridge (MQTT/WebSocket) respecting CARE policies
        return SenseCommandResponse(
            session_id=request.session_id,
            modality=request.modality,
            accepted_at=datetime.utcnow(),
        )
