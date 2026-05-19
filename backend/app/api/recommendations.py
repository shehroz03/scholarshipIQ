from fastapi import APIRouter, Depends, HTTPException
from typing import List, cast, Any
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()


# ─── /recommendations/ (Legacy AI endpoint) ────────────────────────────────

@router.get("/", response_model=schemas.AIRecommendationResponse)
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    from app.recommendation.engine import get_recommendations as engine_get, _ML_ACTIVE

    items_raw = engine_get(current_user, db)

    recommended_list = []
    for r in items_raw:
        # Map hybrid engine fields to legacy schema fields
        recommended_list.append(schemas.TopRecommendedScholarship(
            id=r["scholarship_id"],
            title=r["scholarship_name"],
            university_name=r["uni_name"],
            country=r["country"],
            degree_level="Graduate",  # Fallback for legacy schema
            fit_score=int(r["fit_score"]),
            match_label=r.get("match_label"),
            eligibility="eligible" if r["fit_score"] > 60 else "borderline",
            short_reason=f"AI Insight: With a {int(r['fit_score'])}% match score, '{r['scholarship_name']}' at {r['uni_name']} is highly recommended for your profile. Funding: {r.get('amount', r.get('funding_type', 'Varies'))}. {r['reasons'][0] if r['reasons'] else 'Matches your background perfectly.'}",
            is_strong_match=r["fit_score"] > 80,
            deadline=r["deadline"],
            after_fee=r["after_fee"],
            amount=r.get("amount", "Varies"),
            funding_type=r.get("funding_type", "Funding Varies")
        ))

    # Dynamic recommendation logic: prioritize target_degree if set, otherwise predict next logical step.
    target_degree = str(current_user.target_degree or "")
    current_degree = str(current_user.current_degree or current_user.degree_level or "")
    
    if target_degree:
        next_degree = target_degree
        reason = f"Based on your profile settings, we've prioritized {next_degree} opportunities for you."
    elif "Bachelor" in current_degree or "Inter" in current_degree:
        next_degree = "Master's"
        reason = f"Based on your background, a {next_degree} is the recommended next step."
    elif "Master" in current_degree:
        next_degree = "PhD"
        reason = f"With your background, you're ready for {next_degree} research opportunities."
    else:
        next_degree = "Master's"
        reason = "A Master's degree will help you bridge the gap to global opportunities."

    return schemas.AIRecommendationResponse(
        user_id=cast(int, current_user.id),
        recommended_next_degree=next_degree,
        reason_next_degree=reason,
        top_scholarships=recommended_list,
        ml_active=_ML_ACTIVE
    )


# ─── GET /recommendations/profile ─────────────────────────────────────────────

@router.get("/profile", response_model=schemas.ProfileRecommendationResponse)
def get_profile_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Hybrid AI Recommendations for the logged-in user.
    Scoring: 60% rule-based + 40% ML (RandomForest).
    Returns top 10 scholarships.
    """
    from app.recommendation.engine import get_recommendations as engine_get, _ML_ACTIVE

    print(f"[/recommendations/profile] User: {current_user.id}, CGPA: {current_user.cgpa}, "
          f"Target: {current_user.target_country}, Degree: {current_user.target_degree}")
    items_raw = engine_get(current_user, db)
    print(f"[/recommendations/profile] Returning {len(items_raw)} items to frontend")

    items = [
        schemas.RecommendationItem(
            scholarship_id=r["scholarship_id"],
            scholarship_name=r["scholarship_name"],
            uni_name=r["uni_name"],
            country=r["country"],
            city=r["city"],
            fit_score=r["fit_score"],
            match_label=r["match_label"],
            match_color=r["match_color"],
            reasons=r["reasons"],
            scholarship_link=r["scholarship_link"],
            after_fee=r["after_fee"],
            cgpa_min=r["cgpa_min"],
            deadline=r["deadline"],
        )
        for r in items_raw
    ]

    return schemas.ProfileRecommendationResponse(
        user_id=cast(int, current_user.id),
        items=items,
        ml_active=_ML_ACTIVE,
    )


# ─── POST /recommendations/feedback ─────────────────────────────────────────

@router.post("/feedback", status_code=201)
def submit_feedback(
    body: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Record user interaction (view / save / apply) with a scholarship.
    Used to improve future ML model retrains.
    """
    action = body.action.lower()
    if action not in ("view", "save", "apply"):
        raise HTTPException(status_code=400, detail="action must be 'view', 'save', or 'apply'")

    # Verify scholarship exists
    scholarship = db.query(models.Scholarship).filter(
        models.Scholarship.id == body.scholarship_id
    ).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    interaction = models.UserScholarshipInteraction(
        user_id=current_user.id,
        scholarship_id=body.scholarship_id,
        interaction_type=action,
    )
    db.add(interaction)
    db.commit()

    return {"message": f"Feedback '{action}' recorded for scholarship {body.scholarship_id}"}
