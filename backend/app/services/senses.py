"""Multisensory routing service."""
import random
from datetime import datetime

from app.schemas.senses import SenseCommandRequest, SenseCommandResponse


class SenseService:
    async def get_tactile_feedback(self, text_snippet: str) -> str:
        # Simulate tactile feedback description based on text content
        snippet_lower = text_snippet.lower()
        if "smooth" in snippet_lower or "silk" in snippet_lower:
            return "A gentle, flowing sensation, like smooth silk."
        elif "rough" in snippet_lower or "stone" in snippet_lower or "bark" in snippet_lower:
            return "A coarse, uneven vibration, like rough stone."
        elif "soft" in snippet_lower or "fur" in snippet_lower or "velvet" in snippet_lower:
            return "A light, velvety touch, soft and warm."
        elif "vibrate" in snippet_lower or "rumble" in snippet_lower:
            return "A deep, resonant rumble, echoing through."
        elif "gentle" in snippet_lower or "breeze" in snippet_lower:
            return "A subtle, airy caress, barely there."
        elif "sharp" in snippet_lower or "edge" in snippet_lower:
            return "A distinct, precise pressure, with sharp edges."
        elif "warm" in snippet_lower or "heat" in snippet_lower:
            return "A radiating warmth, a slow increase in temperature."
        elif "cool" in snippet_lower or "cold" in snippet_lower:
            return "A refreshing coolness, a crisp chill."
        else:
            options = [
                "A subtle, ambient texture.",
                "A faint, rhythmic pulse.",
                "A gentle, almost imperceptible sensation.",
                "A soft, background vibration.",
            ]
            return random.choice(options)

    async def dispatch(self, request: SenseCommandRequest) -> SenseCommandResponse:
        tactile_feedback_description = None
        if request.modality == "tactile_feedback" and request.text_snippet:
            tactile_feedback_description = await self.get_tactile_feedback(request.text_snippet)
        
        # TODO: Push command to device bridge (MQTT/WebSocket) respecting CARE policies
        return SenseCommandResponse(
            session_id=request.session_id,
            modality=request.modality,
            accepted_at=datetime.utcnow(),
            feedback_description=tactile_feedback_description,
        )
