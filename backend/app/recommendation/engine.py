from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class UserProfile(BaseModel):
    id: int
    full_name: str
    country: str
    highest_completed_degree: str
    field_of_study: str
    specialization: Optional[str] = None
    cgpa: float
    preferred_countries: List[str] = []
    target_budget_per_year_usd: float = 0

def score_scholarship(user: UserProfile, sch: any) -> dict:
    """
    Scoring logic for Phase 1: Rule-Based Engine.
    'sch' is an instance ofmodels.Scholarship or similar object with attributes.
    """
    reasons = []
    fit_score = 0
    eligibility = "eligible"

    # 1. Degree Pathway Match (+30)
    # Bachelor -> Masters, Masters -> PhD
    if user.highest_completed_degree == "Bachelor's" and "Master" in (sch.degree_level or ""):
        fit_score += 30
        reasons.append("Ideal Master's pathway for your Bachelor's degree.")
    elif "Master" in user.highest_completed_degree and "PhD" in (sch.degree_level or ""):
        fit_score += 35
        reasons.append("Perfect PhD progression for your Master's background.")
    elif user.highest_completed_degree == sch.degree_level:
        fit_score += 10
        reasons.append("Matches your current academic level.")
    else:
        eligibility = "borderline"
        reasons.append("Degree level might not be the standard next step.")

    # 2. Field Match (+25)
    user_field = user.field_of_study.lower()
    sch_field = (sch.field_of_study or "").lower()
    
    if user_field in sch_field or sch_field in user_field:
        fit_score += 25
        reasons.append(f"Strong match for your {user.field_of_study} background.")
    elif user.specialization and user.specialization.lower() in (sch.description or "").lower():
        fit_score += 15
        reasons.append(f"Matches your specialization in {user.specialization}.")
    else:
        reasons.append("Field of study is slightly different but possibly related.")

    # 3. Country Preference Match (+20)
    if sch.country in user.preferred_countries:
        fit_score += 20
        reasons.append(f"Located in one of your preferred countries: {sch.country}.")
    elif sch.country in ["United Kingdom", "USA", "Canada", "Germany", "Australia"]:
        fit_score += 10
        reasons.append(f"Located in a top global destination ({sch.country}).")

    # 4. CGPA Check
    # Assuming scholarship object might have min_cgpa or university has it
    min_cgpa = getattr(sch, 'min_cgpa', None) or (sch.university.min_cgpa if sch.university else None)
    if min_cgpa:
        if user.cgpa < min_cgpa:
            eligibility = "not_eligible"
            fit_score -= 50
            reasons.append("Your CGPA is below the minimum required.")
        elif user.cgpa >= min_cgpa:
            fit_score += 15
            reasons.append("Your CGPA meets the eligibility criteria.")

    # 5. Funding vs Budget (+15)
    # Using funding_type and numeric values if available
    is_fully_funded = "fully funded" in (sch.funding_type or "").lower()
    if is_fully_funded:
        fit_score += 20
        reasons.append("Fully funded: Covers tuition and likely more.")
    elif sch.funding_amount_numeric and user.target_budget_per_year_usd > 0:
        if sch.funding_amount_numeric >= (sch.tuition_fee_numeric or 30000) - user.target_budget_per_year_usd:
            fit_score += 15
            reasons.append("Scholarship makes this university affordable within your budget.")

    # 6. Deadline Recency (+10)
    if sch.deadline:
        if sch.deadline < datetime.utcnow():
            eligibility = "not_eligible"
            reasons.append("Application deadline has passed.")
        else:
            days_left = (sch.deadline - datetime.utcnow()).days
            if 30 <= days_left <= 180:
                fit_score += 10
                reasons.append("Optimal application window (1-6 months left).")

    # Clamp Score
    final_score = max(0, min(100, fit_score))

    return {
        "scholarship_id": sch.id,
        "fit_score": float(final_score),
        "eligibility": eligibility,
        "reasons": reasons[:4] # Return top 4 reasons
    }

def get_recommended_degree(user: UserProfile, top_matches_degree_levels: List[str]) -> tuple:
    """Helper for Phase 4 to determine next degree suggestion"""
    phd_count = sum(1 for d in top_matches_degree_levels if "PhD" in d)
    
    if user.highest_completed_degree == "Bachelor's":
        if phd_count >= 3 and user.cgpa > 3.7:
             return "PhD", "Your exceptional CGPA makes you eligible for direct-entry PhD programs found in your matches."
        return "Masters", "A Master's degree is the standard and most logical next step for your academic progression."
    
    if "Master" in user.highest_completed_degree:
        return "PhD", "You have completed a Master's; focusing on PhD research opportunities is recommended."
        
    return "Either", "Both Master's and PhD options could fit your profile depending on your research interests."
