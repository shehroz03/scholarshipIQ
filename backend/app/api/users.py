from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.api import deps
from app.db.session import get_db
from app.utils.scoring import calculate_profile_completion

router = APIRouter()

@router.get("/me", response_model=schemas.UserOut)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_user)
):
    current_user.profile_completion = calculate_profile_completion(current_user)
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_user_me(
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # Update fields
    for field, value in user_in.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    current_user.profile_completion = calculate_profile_completion(current_user)
    return current_user

@router.post("/subscribe/{plan}")
async def subscribe_user(
    plan: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    print(f"DEBUG: Subscribe request for plan: {plan} from user: {current_user.email}")
    if plan not in ["premium", "pro", "free"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    from datetime import datetime, timezone, timedelta
    
    # Simple naive UTC for SQLite compatibility
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    current_user.subscription_plan = plan  # type: ignore
    current_user.subscription_started = now  # type: ignore
    
    if plan == "free":
        current_user.subscription_expires = None  # type: ignore
    else:
        current_user.subscription_expires = now + timedelta(days=30)  # type: ignore
    
    print(f"DEBUG: Updating user {current_user.id} plan to {plan}. Expires: {current_user.subscription_expires}")
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"message": f"Successfully subscribed to {plan}", "plan": plan}
