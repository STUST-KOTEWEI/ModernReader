from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
import json
from typing import List, Optional
from jose import jwt, JWTError
import uuid

from app.db.database import get_db
from app.core.config import settings
from app.models.user import User

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

async def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> User:
    if token is None:
        raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        sub = payload.get("sub")
        if not sub:
            raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token payload")
        
        user_uuid = uuid.UUID(str(sub))
        user = db.query(User).filter(User.id == user_uuid).one_or_none()
        if not user:
            raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
        return user
    except (JWTError, ValueError) as exc:
        raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason=f"Invalid token: {exc}")


@router.websocket("/ws/chat/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    user: User = Depends(get_current_user_ws)
):
    await manager.connect(websocket, room_id)
    # Announce user has joined
    join_msg = {"user": user.username or "Anonymous", "text": "has joined the chat"}
    await manager.broadcast(json.dumps(join_msg), room_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = {"user": user.username or "Anonymous", "text": data}
            await manager.broadcast(json.dumps(message), room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        # Announce user has left
        leave_msg = {"user": user.username or "Anonymous", "text": "has left the chat"}
        await manager.broadcast(json.dumps(leave_msg), room_id)
