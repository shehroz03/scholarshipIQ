# backend/app/api/chatbot.py

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from app.services.chatbot import get_ai_response
from app.db.session import get_db
from app.db.models import ChatMessage, User
from app.api.deps import get_current_user # Auth dependency

router = APIRouter()

# 1. Chat History Get Karne Ka Route
@router.get("/history")
async def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Sirf is user ke messages laao, purane se naye tartib mein
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    # Return serializable data
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "file_name": m.file_name,
            "timestamp": m.timestamp.isoformat() if m.timestamp else None
        } for m in messages
    ]

# 2. Message Send Karne Ka Route (Updated to Save in DB)
@router.post("/")
async def chat_endpoint(
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Login zaroori hai
):
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    file_data = None
    file_type = None
    file_name = None

    if file:
        file_data = await file.read()
        file_type = file.content_type
        file_name = file.filename

    # --- A. User ka Message DB mein Save Karein ---
    user_msg_db = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=message,
        file_name=file_name
    )
    db.add(user_msg_db)
    db.commit()

    # --- B. AI se Jawab Lein ---
    ai_reply_text = get_ai_response(message, file_data, file_type)
    
    # --- C. AI ka Jawab DB mein Save Karein ---
    ai_msg_db = ChatMessage(
        user_id=current_user.id,
        role="ai",
        content=ai_reply_text
    )
    db.add(ai_msg_db)
    db.commit()
    
    return {"reply": ai_reply_text}
