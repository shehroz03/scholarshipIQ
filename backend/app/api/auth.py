from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.db import models, schemas
from app.core import security
from app.db.session import get_db
import re
import os
import uuid
import shutil
from app.core.limiter import limiter

router = APIRouter()

from sqlalchemy import func

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "cv")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    """Upload a CV/Resume file (PDF, DOC, DOCX). Returns the file URL."""
    # Validate by file extension (more reliable than MIME type on all OS)
    filename_orig = file.filename or "cv.pdf"
    ext = os.path.splitext(filename_orig)[1].lower()
    allowed_extensions = [".pdf", ".doc", ".docx"]
    if ext not in allowed_extensions:
        raise HTTPException(400, "Only PDF, DOC, and DOCX files are allowed")

    # Validate file size (max 5MB)
    if file.size is not None and file.size > 5 * 1024 * 1024:
        raise HTTPException(400, "File size must be less than 5MB")

    if file.size == 0:
        raise HTTPException(400, "File is empty")

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Save file efficiently
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Return URL
    cv_url = f"/uploads/cv/{filename}"
    return {"cv_url": cv_url, "filename": filename_orig}


def sanitize_input(text: str, max_len: int = 255) -> str:
    """Sanitize user input - strip whitespace, limit length, remove dangerous chars."""
    if not text:
        return ""
    # Strip and limit length
    text = text.strip()[:max_len]
    # Remove null bytes and control characters (except newlines/tabs)
    text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', text)
    return text


def validate_email(email: str) -> bool:
    """Basic email format validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, ""


@router.post("/register", response_model=schemas.UserOut)
@limiter.limit("5/minute")
def register(
    request: Request,
    body: dict = Body(...),  # Full JSON body including user data, role, teacher_data
    db: Session = Depends(get_db)
):
    # Extract user data, role, and teacher_data from request
    user_in = schemas.UserCreate(**body)
    role = body.get("role", "student")
    teacher_data = body.get("teacher_data")

    # Sanitize email
    email = sanitize_input(user_in.email, 255).lower()
    if not validate_email(email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format",
        )

    # Validate password strength
    is_valid, error_msg = validate_password(user_in.password)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_msg,
        )

    # Check if user exists
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    # Sanitize optional string fields
    full_name = sanitize_input(user_in.full_name, 100) if user_in.full_name else None
    nationality = sanitize_input(user_in.nationality, 50) if user_in.nationality else None
    current_degree = sanitize_input(user_in.current_degree, 50) if user_in.current_degree else None
    major = sanitize_input(user_in.major, 100) if user_in.major else None
    specialization = sanitize_input(user_in.specialization, 100) if user_in.specialization else None
    target_country = sanitize_input(user_in.target_country, 200) if user_in.target_country else None
    target_degree = sanitize_input(user_in.target_degree, 50) if user_in.target_degree else None

    # Create user with sanitized inputs
    db_user = models.User(
        email=email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=full_name,
        nationality=nationality,
        role=role,  # <-- IMPORTANT: Set role (student/teacher)
        current_degree=current_degree,
        major=major,
        specialization=specialization,
        target_country=target_country,
        target_degree=target_degree,
        cgpa=user_in.cgpa,
        degree_level=current_degree,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create teacher profile if role is teacher
    if role == "teacher" and teacher_data:
        teacher = models.TeacherProfile(
            user_id=db_user.id,
            bio=teacher_data.get("bio", ""),
            specializations=teacher_data.get("specializations", "IELTS"),
            experience_years=teacher_data.get("experience_years", 1),
            qualification=teacher_data.get("qualification"),
            degree=teacher_data.get("degree"),
            institution=teacher_data.get("institution"),
            cv_url=teacher_data.get("cv_url"),              # LinkedIn URL
            cv_file_url=teacher_data.get("cv_file_url"),    # Uploaded CV file path
            approval_status="pending",  # Requires admin approval
        )
        db.add(teacher)
        db.commit()

    return db_user


@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Sanitize email input
    email = sanitize_input(form_data.username, 255).lower()
    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    
    if not user:
        print(f"Login failed: User with email {email} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not security.verify_password(form_data.password, str(user.hashed_password)):  # type: ignore
        print(f"Login failed: Password mismatch for user {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        print(f"Login failed: Account {email} is inactive")
        raise HTTPException(
            status_code=400, detail="Inactive user"
        )

    # Check if user has a teacher profile
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user.id).first()
    if teacher:
        if teacher.approval_status == "pending":
            raise HTTPException(
                status_code=403,
                detail="Teacher account pending approval. Please wait for admin verification or contact support."
            )
        if teacher.approval_status == "rejected":
            raise HTTPException(
                status_code=403,
                detail=f"Teacher application rejected. Reason: {teacher.rejection_reason or 'Not specified'}. Contact support for appeal."
            )

    # Determine correct role:
    # If user has an approved teacher profile, always return "teacher" role
    # This fixes cases where user.role was stored as "student" in old accounts
    if teacher and teacher.approval_status == "approved":
        effective_role = "teacher"
        # Also fix it in DB for future logins
        if user.role != "teacher":
            user.role = "teacher"
            db.commit()
    else:
        effective_role = user.role or "student"

    print(f"Login success: {email}, role: {effective_role}")

    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
        "role": effective_role,
    }
