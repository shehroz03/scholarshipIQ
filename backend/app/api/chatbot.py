# backend/app/api/chatbot.py

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.services.chatbot import get_ai_response
from app.db.session import get_db
from app.db.models import ChatMessage, User, ChatSession
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/history")
async def get_chat_history(
    mode: str = "student",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tool_type = "teacher_chat" if mode == "teacher" else "general_chat"
    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id, ChatSession.tool_type == tool_type, ChatSession.is_active == True)
        .order_by(ChatSession.created_at.desc())
        .first()
    )
    if not chat_session:
        return []

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == chat_session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "file_name": m.file_name,
            "timestamp": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.post("/")
async def chat_endpoint(
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    file_data: Optional[bytes] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None

    if file:
        file_data = await file.read()
        file_type = file.content_type
        file_name = file.filename

    # Ensure active ChatSession exists
    chat_session = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == current_user.id, 
            ChatSession.tool_type == "general_chat", 
            ChatSession.is_active == True
        )
        .order_by(ChatSession.created_at.desc())
        .first()
    )
    if not chat_session:
        chat_session = ChatSession(
            user_id=current_user.id,
            tool_type="general_chat",
            is_active=True,
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)

    # Save user message
    user_msg_db = ChatMessage(
        session_id=chat_session.id,
        user_id=current_user.id,
        role="user",
        content=message,
        file_name=file_name,
    )
    db.add(user_msg_db)
    db.commit()

    # Fetch last 8 messages for conversation history (4 turns)
    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == chat_session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(8)
        .all()
    )
    history = [(m.role, m.content) for m in reversed(recent) if m.role in ("user", "ai")]

    # Build user profile dict for RAG personalisation
    user_profile = {
        "name": current_user.full_name,
        "cgpa": current_user.cgpa,
        "target_country": current_user.target_country,
        "target_degree": current_user.target_degree,
        "major": current_user.major or current_user.field_of_interest,
        "ielts_overall": current_user.ielts_overall,
        "nationality": current_user.nationality,
    }

    # Determine mode by role
    mode_map = {"teacher": "teacher", "admin": "admin"}
    mode = mode_map.get(current_user.role, "student")

    # Get AI response with RAG + history + profile
    ai_reply_text = get_ai_response(
        user_message=message,
        file_data=file_data,
        file_type=file_type,
        mode=mode,
        db=db,
        user_profile=user_profile,
        history=history,
    )

    # Save AI reply
    ai_msg_db = ChatMessage(
        session_id=chat_session.id,
        user_id=current_user.id,
        role="ai",
        content=ai_reply_text,
    )
    db.add(ai_msg_db)
    db.commit()

    return {"reply": ai_reply_text}
