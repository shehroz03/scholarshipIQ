from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timezone

# App local imports
from app.db import models, schemas
from app.api import deps
from app.db.session import get_db
from app.utils.scoring import calculate_profile_completion
from app.core.plans import get_limit
from app.recommendation.engine import get_recommendations as engine_recs
from app.services.email import send_scholarship_saved_email
from app.services.notification_service import NotificationService



router = APIRouter()

@router.post("/save/{scholarship_id}")
def save_scholarship(
    scholarship_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    scholarship = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    if scholarship in current_user.saved_items:
        return {"message": "Already saved", "status": "saved"}

    # Enforce plan limits
    plan = current_user.subscription_plan or "free"
    limit = get_limit(plan, "saved_scholarships")
    
    if limit != -1 and len(current_user.saved_items) >= limit:
         raise HTTPException(
            status_code=403, 
            detail={
                "error": "UPGRADE_REQUIRED", 
                "message": f"Save limit reached ({limit}). Upgrade to Premium for unlimited saves."
            }
        )

    current_user.saved_items.append(scholarship)
    db.commit()

    # 1. Trigger In-App Notification (Safe Call)
    try:
        NotificationService.create_notification(
            db,
            user_id=current_user.id,
            scholarship_id=scholarship.id,
            type="scholarship_saved",
            title="Scholarship Saved!",
            message=f"You saved '{scholarship.title}'. We'll remind you before the deadline.",
            action_url=f"/detail/{scholarship.id}"
        )
    except Exception as e:
        print(f"[NotificationService] In-app notification failed for user {current_user.id}: {e}")


    # 2. Trigger Email Notification (Background)
    # Production Safety: Normalize all fields before passing to background task
    deadline_str = scholarship.deadline.strftime("%B %d, %Y") if scholarship.deadline else "Check Portal"
    
    # Safe conversion for amount (could be numeric or string)
    amount_raw = scholarship.scholarship_amount_value or scholarship.amount or "Varies"
    amount_str = str(scholarship.scholarship_amount_value or scholarship.amount or "Varies")

    country_str = scholarship.country or "International"
    
    # URL normalization
    link_url = scholarship.scholarship_url or scholarship.website_url or ""

    background_tasks.add_task(
        send_scholarship_saved_email,
        user_email=current_user.email,
        user_name=current_user.full_name or "Scholar",
        scholarship_title=scholarship.title,
        deadline=deadline_str,
        amount=amount_str,
        country=country_str,
        apply_link=link_url
    )

    return {"message": "Scholarship saved", "status": "saved"}



@router.delete("/unsave/{scholarship_id}")
def unsave_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    scholarship = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    if scholarship in current_user.saved_items:
        current_user.saved_items.remove(scholarship)
        db.commit()
        return {"message": "Scholarship removed", "status": "unsaved"}
    
    return {"message": "Scholarship not in saved list", "status": "unsaved"}

@router.get("/saved", response_model=List[schemas.ScholarshipOut])
def list_saved_scholarships(
    current_user: models.User = Depends(deps.get_current_user)
):
    # Only show active, non-archived saved items
    return [s for s in current_user.saved_items if not s.is_archived and not s.is_suspicious]

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    saved_count = len(current_user.saved_items)

    # Use hybrid recommendation engine for accurate match count
    try:
        recommendations = engine_recs(current_user, db)
        matches_found = len(recommendations)

    except Exception as e:
        print(f"[Dashboard] Recommendation engine error: {e}")
        # Fallback: count by degree/field filter
        if not current_user.target_degree and not current_user.target_field:
            matches_found = db.query(models.Scholarship).count()
        else:
            filters = []
            if current_user.target_degree:
                filters.append(models.Scholarship.degree_level.ilike(f"%{current_user.target_degree}%"))
            if current_user.target_field:
                filters.append(models.Scholarship.field_of_study.ilike(f"%{current_user.target_field}%"))
            matches_found = db.query(models.Scholarship).filter(
                models.Scholarship.is_archived == False,
                models.Scholarship.is_suspicious == False,
                or_(*filters)
            ).count()

    return {
        "total_saved": saved_count,
        "total_recommended": matches_found,
        "matches_found": matches_found,
        "user_name": current_user.full_name,
        "profile_completion": calculate_profile_completion(current_user)
    }
