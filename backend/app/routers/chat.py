from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.appointment import Appointment
from app.models.therapist import Therapist
from app.schemas.schemas import (
    ChatSessionCreate, ChatSessionResponse, ChatMessageResponse, ChatSendMessage,
)
from app.services.auth_service import get_current_user, decode_token
from app.services.chat_service import get_ai_response

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# Simple connection manager for websockets
class ConnectionManager:
    def __init__(self):
        # Maps session_id to list of active websockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json(message)

manager = ConnectionManager()

async def verify_chat_access(db: AsyncSession, session_id: str, user_id: str, role: str) -> bool:
    """Verify if a user has access to a chat session."""
    result = await db.execute(
        select(ChatSession).options(selectinload(ChatSession.appointment)).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        return False
    
    if role == "patient" and str(session.user_id) == str(user_id):
        return True
    
    if role == "therapist" and session.appointment:
        # Check if therapist matches the appointment
        therapist_result = await db.execute(select(Therapist).where(Therapist.user_id == user_id))
        therapist = therapist_result.scalar_one_or_none()
        if therapist and str(session.appointment.therapist_id) == str(therapist.id):
            return True
            
    return False

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify appointment
    result = await db.execute(select(Appointment).where(Appointment.id == data.appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "patient" and appointment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "therapist":
        raise HTTPException(status_code=403, detail="Therapists cannot create new sessions, only patients can start them")

    session = ChatSession(
        user_id=appointment.user_id,
        appointment_id=data.appointment_id,
        title=data.title,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return ChatSessionResponse.model_validate(session)

@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session_title(
    session_id: str,
    data: __import__('app.schemas.schemas', fromlist=['ChatSessionUpdate']).ChatSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    has_access = await verify_chat_access(db, session_id, current_user.id, current_user.role)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    session.title = data.title
    await db.commit()
    await db.refresh(session)
    return ChatSessionResponse.model_validate(session)

@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    appointment_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ChatSession).order_by(ChatSession.created_at.desc())

    if appointment_id:
        query = query.where(ChatSession.appointment_id == appointment_id)

    if current_user.role == "patient":
        query = query.where(ChatSession.user_id == current_user.id)
    else:
        # Therapist: Join with appointment and therapist table implicitly or subquery
        therapist_result = await db.execute(select(Therapist).where(Therapist.user_id == current_user.id))
        therapist = therapist_result.scalar_one_or_none()
        if not therapist:
            return []
        
        query = query.join(Appointment, ChatSession.appointment_id == Appointment.id).where(
            Appointment.therapist_id == therapist.id
        )

    result = await db.execute(query)
    sessions = result.scalars().all()
    return [ChatSessionResponse.model_validate(s) for s in sessions]

@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify access
    has_access = await verify_chat_access(db, session_id, current_user.id, current_user.role)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized or session not found")

    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.sent_at.asc())
    )
    messages = messages_result.scalars().all()
    return [ChatMessageResponse.model_validate(m) for m in messages]

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: str,
    data: ChatSendMessage,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """HTTP fallback for non-WebSocket clients."""
    if current_user.role == "therapist":
        raise HTTPException(status_code=403, detail="Therapists can only view chats, not send messages")

    has_access = await verify_chat_access(db, session_id, current_user.id, current_user.role)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized or session not found")

    user_msg = ChatMessage(session_id=session_id, sender="user", content=data.content)
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)

    # Broadcast user msg
    await manager.broadcast({
        "id": str(user_msg.id),
        "sender": "user",
        "content": data.content,
        "sent_at": user_msg.sent_at.isoformat(),
    }, session_id)

    # Get recent messages for context
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.sent_at.desc())
        .limit(20)
    )
    recent_messages = list(reversed(messages_result.scalars().all()))
    history = [{"sender": m.sender, "content": m.content} for m in recent_messages]

    # Generate AI response
    ai_text = await get_ai_response(history)

    # Save AI response
    ai_msg = ChatMessage(session_id=session_id, sender="ai", content=ai_text)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    # Broadcast AI msg
    await manager.broadcast({
        "id": str(ai_msg.id),
        "sender": "ai",
        "content": ai_text,
        "sent_at": ai_msg.sent_at.isoformat(),
    }, session_id)
    
    return ChatMessageResponse.model_validate(ai_msg)

@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """Real-time WebSocket chat between patient and AI."""
    # Authenticate via query param token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        role = payload.get("role")
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    async with AsyncSessionLocal() as db:
        has_access = await verify_chat_access(db, session_id, user_id, role)
        if not has_access:
             await websocket.close(code=4003, reason="Not authorized")
             return

    await manager.connect(websocket, session_id)

    try:
        while True:
            data = await websocket.receive_text()

            if role == "therapist":
                 await websocket.send_json({"error": "Therapists can only view chats, not send messages"})
                 continue

            async with AsyncSessionLocal() as db:
                user_msg = ChatMessage(session_id=session_id, sender="user", content=data)
                db.add(user_msg)
                await db.commit()
                await db.refresh(user_msg)

                # Broadcast to users (including monitoring therapists)
                await manager.broadcast({
                    "id": str(user_msg.id),
                    "sender": "user",
                    "content": data,
                    "sent_at": user_msg.sent_at.isoformat(),
                }, session_id)

                # Get context
                messages_result = await db.execute(
                    select(ChatMessage)
                    .where(ChatMessage.session_id == session_id)
                    .order_by(ChatMessage.sent_at.desc())
                    .limit(20)
                )
                recent = list(reversed(messages_result.scalars().all()))
                history = [{"sender": m.sender, "content": m.content} for m in recent]

                # AI response
                ai_text = await get_ai_response(history)

                ai_msg = ChatMessage(session_id=session_id, sender="ai", content=ai_text)
                db.add(ai_msg)
                await db.commit()
                await db.refresh(ai_msg)

                await manager.broadcast({
                    "id": str(ai_msg.id),
                    "sender": "ai",
                    "content": ai_text,
                    "sent_at": ai_msg.sent_at.isoformat(),
                }, session_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
