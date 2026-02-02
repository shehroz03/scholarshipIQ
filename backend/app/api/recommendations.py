from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=schemas.AIRecommendationResponse)
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    AI Recommendation Engine:
    1. Fetch User Data
    2. Hard Filtering (Degree Pathway)
    3. TF-IDF + Cosine Similarity Scoring
    4. Top 10 Ranking
    """
    from app.services.recommendation import get_recommendations as get_ai_recommendations
    
    # Get scored recommendations from AI Service
    results = get_ai_recommendations(db, current_user.id)
    
    # Format for Response Schema
    recommended_list = []
    for r in results:
        recommended_list.append(schemas.TopRecommendedScholarship(
            id=r["id"],
            title=r["title"],
            university_name=r["university_name"],
            country=r["country"],
            degree_level=r["degree_level"],
            fit_score=int(r["fit_score"]),
            eligibility="eligible" if r["fit_score"] > 60 else "borderline",
            short_reason=f"Matches your background in {r['field_of_study'] or 'this field'}.",
            is_strong_match=r["fit_score"] > 80
        ))
    
    # Logic for next degree advice
    user_degree = current_user.degree_level or ""
    next_degree = "Master's"
    if "Master" in user_degree:
        next_degree = "PhD"
    elif "PhD" in user_degree:
        next_degree = "PostDoc"

    return schemas.AIRecommendationResponse(
        user_id=current_user.id,
        recommended_next_degree=next_degree,
        reason_next_degree=f"Based on your {user_degree} degree, a {next_degree} is the most logical next step.",
        top_scholarships=recommended_list
    )

@router.get("/profile", response_model=schemas.RecommendationResponse)
def get_profile_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Phase 4: Advanced Scored Recommendations
    1) Load User Profile Features
    2) Fetch Candidates
    3) Run Rules Engine (+ Blended ML if model exists)
    """
    from app.recommendation.engine import UserProfile, score_scholarship, get_recommended_degree
    import joblib
    import os

    # 1. Map current_user to UserProfile DTO
    user_p = UserProfile(
        id=current_user.id,
        full_name=current_user.full_name or "User",
        country=current_user.nationality or "Pakistan",
        highest_completed_degree=current_user.degree_level or "Bachelor's",
        field_of_study=current_user.field_of_interest or "",
        specialization=current_user.specialization,
        cgpa=current_user.cgpa or 0.0,
        preferred_countries=["United Kingdom", "Canada"], # Placeholder
        target_budget_per_year_usd=20000 # Placeholder
    )

    # 2. Fetch Candidate Set
    # --- PLUG-IN: Dynamic candidate fetching logic ---
    # For now, we fetch scholarships matching the user's field or target degree
    next_target = "Master" if "Bachelor" in user_p.highest_completed_degree else "PhD"
    from sqlalchemy import or_
    candidates = db.query(models.Scholarship).join(models.University).filter(
        or_(
            models.Scholarship.field_of_study.ilike(f"%{user_p.field_of_study}%"),
            models.Scholarship.degree_level.ilike(f"%{next_target}%")
        )
    ).limit(30).all()

    # 3. Load ML Model if available
    ml_model = None
    model_path = "models/scholar_match.pkl"
    if os.path.exists(model_path):
        try:
            ml_model = joblib.load(model_path)
            print("ML Model loaded successfully.")
        except Exception as e:
            print(f"Error loading ML model: {e}")

    # 4. Score and Rank
    recommendations = []
    for s in candidates:
        # Rule-based scoring
        rule_data = score_scholarship(user_p, s)
        rule_score = rule_data["fit_score"]
        
        final_score = rule_score

        # Blended ML Scoring
        if ml_model:
            # --- PLUG-IN: Extract actual features from (user_p, s) ---
            # Features must match the training set: [degree_path_match, field_match_score, country_match, cgpa_gap]
            feat_degree = 1 if (user_p.highest_completed_degree == "Bachelor's" and "Master" in (s.degree_level or "")) else 0
            feat_field = 1.0 if (user_p.field_of_study.lower() in (s.field_of_study or "").lower()) else 0.5
            feat_country = 1 if s.country in user_p.preferred_countries else 0
            feat_cgpa = (user_p.cgpa - (s.university.min_cgpa or 3.0)) if s.university else 0
            
            # Prediction
            try:
                ml_prob = ml_model.predict_proba([[feat_degree, feat_field, feat_country, feat_cgpa]])[0][1]
                # Weighted Blend: 60% ML, 40% Rules
                final_score = (0.6 * (ml_prob * 100)) + (0.4 * rule_score)
            except:
                pass # Fallback to rule_score
        
        recommendations.append(schemas.ScholarshipRecommendation(
            id=s.id,
            title=s.title,
            university_name=s.university.name if s.university else "Unknown",
            country=s.country or "Global",
            degree_level=s.degree_level or "Unknown",
            fit_score=round(final_score, 1),
            eligibility=rule_data["eligibility"],
            reasons=rule_data["reasons"]
        ))

    # 5. Sort and Suggest Degree
    recommendations.sort(key=lambda x: x.fit_score, reverse=True)
    
    top_degrees = [r.degree_level for r in recommendations[:5]]
    suggested_degree, suggestion_reason = get_recommended_degree(user_p, top_degrees)

    return schemas.RecommendationResponse(
        user_id=current_user.id,
        recommended_next_degree=suggested_degree,
        reason_next_degree=suggestion_reason,
        items=recommendations[:10]
    )
