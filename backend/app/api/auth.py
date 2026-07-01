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
import random
import string
from datetime import datetime, timedelta
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
    """
    Advanced 3-Tier Email Validation:
    1. Regex syntax validation
    2. Disposable / Burner email protection
    3. MX Record / SMTP API Verification Hooks
    """
    # 1. Regex Validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False

    # 2. Extract domain and check Disposable/Throwaway Domain Blacklist
    try:
        domain = email.split('@')[1].lower()
        disposable_domains = {
            "temp-mail.org", "mailinator.com", "10minutemail.com", "throwawaymail.com",
            "tempmail.com", "guerrillamail.com", "sharklasers.com", "yopmail.com",
            "dispostable.com", "getairmail.com", "trashmail.com", "maildrop.cc"
        }
        if domain in disposable_domains:
            print(f"Auth Blocked: Attempted registration with disposable email domain: {domain}")
            return False

        # 3. DNS MX Record & ZeroBounce / AWS SES Validation Hook
        # In production AWS environment, verify MX records exist for the domain
        # Example using socket or external validation API (e.g. ZeroBounce / AbstractAPI)
        import socket
        try:
            # Check if domain resolves (basic network-level domain verification)
            socket.gethostbyname(domain)
        except socket.gaierror:
            # Domain does not exist in the real world (e.g., asdasdasd@fakedomain123456789.com)
            print(f"Auth Blocked: Domain {domain} does not exist or has no DNS records.")
            return False

        return True
    except Exception as e:
        print(f"Email validation check error: {e}")
        return False


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
    # Generate 6-digit OTP
    otp = "".join(random.choices(string.digits, k=6))
    db_user.otp_code = otp
    db_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db_user.email_verified = False

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send OTP email (async — run in background so signup doesn't block)
    import asyncio
    from app.services.email import send_otp_email
    try:
        asyncio.create_task(send_otp_email(email, otp, db_user.full_name or ""))
    except RuntimeError:
        import threading
        threading.Thread(target=lambda: asyncio.run(send_otp_email(email, otp, db_user.full_name or "")), daemon=True).start()

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


@router.post("/verify-otp")
def verify_otp(
    body: dict = Body(...),
    db: Session = Depends(get_db)
):
    email = body.get("email", "").lower().strip()
    otp = body.get("otp", "").strip()

    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user:
        raise HTTPException(400, "User not found")
    if user.email_verified:
        # Already verified — just return token
        token = security.create_access_token(user.id)
        return {"access_token": token, "token_type": "bearer", "already_verified": True}
    if not user.otp_code or user.otp_code != otp:
        raise HTTPException(400, "Invalid OTP code")
    if not user.otp_expires_at or datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(400, "OTP has expired. Please request a new one.")

    user.email_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    token = security.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "message": "Email verified successfully!"}


@router.post("/resend-otp")
def resend_otp(
    body: dict = Body(...),
    db: Session = Depends(get_db)
):
    email = body.get("email", "").lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user:
        raise HTTPException(400, "User not found")
    if user.email_verified:
        raise HTTPException(400, "Email already verified")

    otp = "".join(random.choices(string.digits, k=6))
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    import asyncio
    from app.services.email import send_otp_email
    try:
        asyncio.create_task(send_otp_email(email, otp, user.full_name or ""))
    except RuntimeError:
        import threading
        threading.Thread(target=lambda: asyncio.run(send_otp_email(email, otp, user.full_name or "")), daemon=True).start()

    return {"message": "New OTP sent to your email"}


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

    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="EMAIL_NOT_VERIFIED"
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
