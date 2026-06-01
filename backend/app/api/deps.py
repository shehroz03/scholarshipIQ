# pyright: reportMissingModuleSource=false
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

# App local imports
from app.core import security
from app.core.config import settings
from app.db import models, schemas
from app.db.session import get_db


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

# Optional OAuth2 scheme that doesn't raise an error if no token is provided
optional_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> models.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id_str = str(user_id) if user_id is not None else ""
        user = db.query(models.User).filter(models.User.id == int(user_id_str)).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identification format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(optional_oauth2)
) -> Optional[models.User]:
    """
    Optional authentication - returns None if no token is provided.
    This allows endpoints to work for both authenticated and guest users.
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            return None
            
        try:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        except (ValueError, TypeError):
            return None
        return user
    except (JWTError, ValidationError):
        return None

def require_premium(current_user: models.User = Depends(get_current_user)):
    return current_user
