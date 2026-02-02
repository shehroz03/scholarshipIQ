from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

@router.post("/save/{scholarship_id}")
def save_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    scholarship = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    if scholarship in current_user.saved_items:
        return {"message": "Already saved", "status": "saved"}
        
    current_user.saved_items.append(scholarship)
    db.commit()
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
    return current_user.saved_items

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    saved_count = len(current_user.saved_items)
    
    # Match count based on any criterion (more inclusive)
    if not current_user.degree_level and not current_user.field_of_interest:
        recommended_count = db.query(models.Scholarship).count()
    else:
        filters = []
        if current_user.degree_level:
            filters.append(models.Scholarship.degree_level.ilike(f"%{current_user.degree_level}%"))
        if current_user.field_of_interest:
            filters.append(models.Scholarship.field_of_study.ilike(f"%{current_user.field_of_interest}%"))
        
        from sqlalchemy import or_
        recommended_count = db.query(models.Scholarship).filter(or_(*filters)).count()
    
    return {
        "total_saved": saved_count,
        "total_recommended": recommended_count,
        "user_name": current_user.full_name,
        "profile_completion": 85 if current_user.cgpa else 40 # Mock calculation
    }
