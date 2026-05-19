from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.api import deps
from app.db import models
from app.db.session import get_db
from app.services.visa_service import VisaService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# --- Pydantic Schemas ---
class VisaProfileCreate(BaseModel):
    target_country: str
    intake_term: str
    passport_status: str
    admission_status: str
    scholarship_status: str
    funding_source: str
    bank_statement_available: bool
    language_test_type: str
    language_test_score: Optional[str] = None
    tuberculosis_test_status: str = "not_done"
    health_insurance_status: str = "not_done"
    previous_visa_refusal: bool = False
    notes: Optional[str] = None

class VisaProfileOut(VisaProfileCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChecklistItemOut(BaseModel):
    id: int
    document_key: str
    title: str
    status: str
    reason: Optional[str] = None
    action_hint: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True

class VisaChecklistOut(BaseModel):
    id: int
    readiness_score: int
    status_summary: str
    generated_at: datetime
    items: List[ChecklistItemOut]

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/profile", response_model=VisaProfileOut)
def create_or_update_visa_profile(
    obj_in: VisaProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Create or update the user's visa profile."""
    profile = db.query(models.VisaProfile).filter(models.VisaProfile.user_id == current_user.id).first()
    
    if profile:
        for field, value in obj_in.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = models.VisaProfile(user_id=current_user.id, **obj_in.model_dump())
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/profile/me", response_model=VisaProfileOut)
def get_my_visa_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    profile = db.query(models.VisaProfile).filter(models.VisaProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Visa profile not found")
    return profile

@router.post("/checklist/generate", response_model=VisaChecklistOut)
def generate_visa_checklist(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Triggers the VisaService to generate a new checklist based on the current profile."""
    # Premium Gate Enforcement
    if current_user.subscription_plan not in ["premium", "pro", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Visa Guidance AI is a premium feature. Please upgrade to access."
        )

    profile = db.query(models.VisaProfile).options(joinedload(models.VisaProfile.user)).filter(models.VisaProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Please create a visa profile first")
    
    checklist = VisaService.calculate_readiness(db, profile)
    return checklist


@router.get("/guides/{country}", response_model=None)
def get_country_guide(
    country: str,
    db: Session = Depends(get_db)
):
    guide = db.query(models.VisaCountryGuide).filter(models.VisaCountryGuide.country_code == country.upper()).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found for this country")
    return guide

@router.get("/plans/history", response_model=List[VisaChecklistOut])
def get_checklist_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    checklists = db.query(models.VisaChecklist).filter(
        models.VisaChecklist.user_id == current_user.id
    ).order_by(models.VisaChecklist.generated_at.desc()).all()
    return checklists
