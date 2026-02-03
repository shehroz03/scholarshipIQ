from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.db import models, schemas
from app.core import security
from app.db.session import get_db

router = APIRouter()

from sqlalchemy import func

@router.post("/register", response_model=schemas.UserOut)
def register(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user exists (case-insensitive check)
    email = user_in.email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create user
    db_user = models.User(
        email=email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        nationality=user_in.nationality,
        current_degree=user_in.current_degree,
        major=user_in.major,
        specialization=user_in.specialization,
        target_country=user_in.target_country,
        target_degree=user_in.target_degree,
        # Default safety for legacy fields
        cgpa=user_in.cgpa,
        degree_level=user_in.current_degree, 
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Authenticate user (case-insensitive lookup)
    email = form_data.username.lower().strip()
    # querying using func.lower to match legacy mixed-case emails too
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=400, detail="Inactive user"
        )
    
    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
    }
