# pyright: reportMissingModuleSource=false
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
from fastapi import HTTPException

# Using pbkdf2_sha256 for better compatibility on all systems
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def check_feature_access(feature: str, current_user):
    """
    Check if the current user's plan allows access to a feature.
    Raises 403 HTTPException if not allowed.
    Returns {"allowed": True, "limit": <limit>, "plan": <plan>} if allowed.
    """
    from app.core.plans import PLAN_LIMITS
    plan = current_user.subscription_plan or "free"

    # Check expiry – auto-downgrade if expired
    if plan != "free" and current_user.subscription_expires:
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if current_user.subscription_expires < now_naive:
            plan = "free"
            current_user.subscription_plan = "free"

    limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"]).get(feature)

    if limit is False or limit == 0:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "UPGRADE_REQUIRED",
                "feature": feature,
                "current_plan": plan,
                "message": f"Upgrade to Premium to access {feature}",
                "upgrade_url": "/pricing"
            }
        )
    return {"allowed": True, "limit": limit, "plan": plan}
