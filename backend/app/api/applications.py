from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

# App local imports
from app.db.session import get_db
from app.db import models, schemas
from app.api import deps
from app.core.plans import get_limit


router = APIRouter()

@router.post("/", response_model=schemas.ApplicationOut)
def save_application(
    app_in: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # Check if scholarship exists
    scholarship = db.query(models.Scholarship).filter(models.Scholarship.id == app_in.scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    # Check if already exists
    existing = db.query(models.Application).filter(
        models.Application.user_id == current_user.id,
        models.Application.scholarship_id == app_in.scholarship_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Scholarship already saved in tracking system")

    # Enforce plan limits
    plan = current_user.subscription_plan or "free"

    
    current_apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    saved_count = sum(1 for a in current_apps if a.status == "Saved")
    track_count = sum(1 for a in current_apps if a.status != "Saved")

    if app_in.status == "Saved":
        limit = get_limit(plan, "saved_scholarships")
        if limit != -1 and saved_count >= limit:
            raise HTTPException(status_code=403, detail={"error": "UPGRADE_REQUIRED", "message": "Save limit reached (5). Upgrade to Premium for unlimited saves."})
    else:
        limit = get_limit(plan, "track_applications")
        if limit != -1 and track_count >= limit:
            raise HTTPException(status_code=403, detail={"error": "UPGRADE_REQUIRED", "message": "Tracking limit reached (3). Upgrade to Premium/Pro to track more."})

    new_app = models.Application(
        user_id=current_user.id,
        scholarship_id=app_in.scholarship_id,
        status=app_in.status,
        notes=app_in.notes
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.get("/", response_model=List[schemas.ApplicationOut])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    return db.query(models.Application).filter(models.Application.user_id == current_user.id).all()

@router.put("/{app_id}", response_model=schemas.ApplicationOut)
def update_application_status(
    app_id: int,
    app_update: schemas.ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    application = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application record not found")

    if app_update.status is not None:
        application.status = app_update.status
    if app_update.notes is not None:
        application.notes = app_update.notes

    db.commit()
    db.refresh(application)
    return application

@router.delete("/{app_id}")
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    application = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application record not found")

    db.delete(application)
    db.commit()
    return {"message": "Application removed from tracking"}


@router.get("/notifications")

def get_deadline_notifications(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(deps.get_current_user)
):
    # Logic: Scholarships expiring in the next 7 days
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    warning_limit = now_naive + timedelta(days=7)
    
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    
    notifications = []
    for app in apps:
        if app.scholarship and app.scholarship.deadline:
            deadline_naive = app.scholarship.deadline.replace(tzinfo=None) if app.scholarship.deadline.tzinfo else app.scholarship.deadline
            # Check if deadline is upcoming
            if now_naive <= deadline_naive <= warning_limit:
                days_left = (deadline_naive - now_naive).days
                notifications.append({
                    "id": app.id,
                    "message": f"Deadline for '{app.scholarship.title}' is in {max(0, days_left)} days! ⏳",
                    "days_left": days_left,
                    "read": False,
                    "scholarship_id": app.scholarship_id
                })
                
    return notifications
