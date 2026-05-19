"""
ScholarIQ Recommendation Engine
Implements hybrid scoring: 60% rule-based + 40% ML
"""
import os
import numpy as np
from typing import List, Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel

# Load ML scorer from ml/ module
try:
    from ml.scorer import model, ml_score, feature_names
    _ML_ACTIVE = model is not None
    _FEATURE_NAMES = feature_names
    print(f"[Engine] ML Status: Active={_ML_ACTIVE}, Features={len(_FEATURE_NAMES)}")

except ImportError:
    _ML_ACTIVE = False
    _FEATURE_NAMES = []
    def ml_score(features: dict) -> float:  # type: ignore
        return 0.5


# ─── User Profile DTO ────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: int
    full_name: str = ""
    country: str = ""
    highest_completed_degree: str = ""
    field_of_study: str = ""
    specialization: Optional[str] = None
    cgpa: float = 0.0
    preferred_countries: List[str] = []
    target_budget_per_year_usd: Optional[float] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get(obj: Any, attr: str, default: Any = None) -> Any:
    val = obj.get(attr) if isinstance(obj, dict) else getattr(obj, attr, None)
    return val if val is not None else default


def normalize_degree(d: str) -> str:
    d = (d or "").lower().strip()
    if "phd" in d or "doctor" in d:
        return "phd"
    if "master" in d or "msc" in d or "mba" in d or "m.s" in d:
        return "masters"
    return "bachelors"


def normalize_country(c: str) -> str:
    c = (c or "").lower().strip()
    if c in ("uk", "united kingdom", "britain", "england"):
        return "united kingdom"
    if c in ("usa", "united states", "america", "us"):
        return "united states"
    if c in ("canada", "can"):
        return "canada"
    if c in ("australia", "aus"):
        return "australia"
    return c


def resolve_user_fields(user: Any) -> dict:
    """
    Normalize user fields, supporting both ORM model and Pydantic schema.
    Returns a flat dict with resolved field names.
    """
    def get_val(attr: str, fallback: Optional[str] = None):
        val = _get(user, attr)
        if not val and fallback:
            val = _get(user, fallback)
        return val or ""

    degree = get_val("target_degree", "degree_level") or get_val("highest_completed_degree")
    field = get_val("target_field") or get_val("major", "field_of_interest") or get_val("field_of_study")

    countries: List[str] = []
    target_country = get_val("target_country")
    if target_country:
        countries = [c.strip() for c in target_country.split(",") if c.strip()]
    if not countries:
        pref = _get(user, "preferred_countries", [])
        if isinstance(pref, list):
            countries = pref

    return {
        "user_id": _get(user, "id", 0),
        "cgpa": float(_get(user, "cgpa") or 0.0),
        "target_degree": degree,
        "target_degree_norm": normalize_degree(degree),
        "major": field,
        "target_countries": [normalize_country(c) for c in countries],
        "english_proficiency": _get(user, "english_proficiency", ""),
        "ielts_overall": float(_get(user, "ielts_overall") or 0.0),
        "work_experience_years": str(_get(user, "work_experience_years") or "0"),
        "monthly_family_income": _get(user, "monthly_family_income", ""),
        "scholarship_type_pref": _get(user, "scholarship_type_pref", "Any"),
    }


def _deadline_days(deadline: Any) -> float:
    """Days until deadline, normalised to 0-2 range (0 = past, 1 = ~1yr, 2 = 2+ yrs)"""
    if not deadline:
        return 0.5
    try:
        if isinstance(deadline, str):
            dt = datetime.strptime(deadline[:10], "%Y-%m-%d")
        elif isinstance(deadline, datetime):
            dt = deadline
        else:
            return 0.5
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        dt_naive = dt.replace(tzinfo=None) if dt.tzinfo else dt
        days = (dt_naive - now_naive).days
        return max(0.0, min(days / 365.0, 2.0))
    except Exception:
        return 0.5


def _build_ml_features(user_fields: dict, scholarship: Any) -> dict:
    user_cgpa = user_fields["cgpa"]
    s_cgpa_min = float(_get(scholarship, "min_cgpa") or 0.0)
    # Fall back to university relation
    uni = getattr(scholarship, "university", None)
    if uni and not s_cgpa_min:
        s_cgpa_min = float(getattr(uni, "min_cgpa", None) or 0.0)

    s_degree_norm = normalize_degree(_get(scholarship, "degree_level") or "")
    user_degree_norm = user_fields["target_degree_norm"]
    degree_match = 1 if (user_degree_norm and s_degree_norm and user_degree_norm == s_degree_norm) else 0

    s_country = normalize_country(_get(scholarship, "country") or "")
    if not s_country:
        uni = getattr(scholarship, "university", None)
        if uni:
            s_country = normalize_country(getattr(uni, "country", "") or "")

    user_countries = user_fields["target_countries"]
    country_match = 1 if s_country and any(s_country == c or s_country in c or c in s_country for c in user_countries) else 0

    user_field = (user_fields.get("major") or "").lower()
    s_field = (_get(scholarship, "field_of_study") or "").lower()
    if not user_field or not s_field:
        field_match = 0
    elif user_field in s_field or s_field in user_field or "all" in s_field:
        field_match = 1
    else:
        field_match = 0

    net_cost = float(_get(scholarship, "net_cost_numeric") or 0.0)
    fee_affordable = 1 if (net_cost == 0 or net_cost <= user_cgpa * 8000) else 0

    schol_val = float(_get(scholarship, "scholarship_amount_numeric") or 0.0)
    scholarship_value = min(schol_val / 50000.0, 1.0)

    deadline_days = _deadline_days(_get(scholarship, "deadline"))

    # New Scoring Features
    s_min_ielts = float(_get(scholarship, "min_ielts") or 0.0)
    ielts_match = 1 if (user_fields["ielts_overall"] >= s_min_ielts and s_min_ielts > 0) else 0
    
    s_funding = (_get(scholarship, "funding_type") or "Any").lower()
    u_funding_pref = user_fields["scholarship_type_pref"].lower()
    funding_match = 1 if (u_funding_pref == "any" or u_funding_pref in s_funding or s_funding in u_funding_pref) else 0
    
    s_requires_work = _get(scholarship, "requires_work_exp", False)
    u_work_years = user_fields["work_experience_years"]
    has_work_exp = 1 if (u_work_years != "0") else 0
    work_exp_match = 1 if (s_requires_work and has_work_exp) or (not s_requires_work) else 0

    return {
        "cgpa_gap": user_cgpa - s_cgpa_min,
        "degree_match": degree_match,
        "country_match": country_match,
        "field_match": field_match,
        "fee_affordable": fee_affordable,
        "scholarship_value": scholarship_value,
        "deadline_days": deadline_days,
        "ielts_match": ielts_match,
        "funding_match": funding_match,
        "work_exp_match": work_exp_match,
        "requires_work": 1 if s_requires_work else 0,
        "has_work": has_work_exp
    }


# ─── Rule-Based Scoring ───────────────────────────────────────────────────────

def score_scholarship(user_profile, scholarship: Any) -> dict:
    """
    Legacy function kept for backward compatibility with recommendations.py.
    Accepts UserProfile Pydantic model or a dict from resolve_user_fields.
    Returns {"fit_score": float, "eligibility": str, "reasons": list}
    """
    if isinstance(user_profile, UserProfile):
        user_fields = {
            "cgpa": user_profile.cgpa,
            "target_degree": user_profile.highest_completed_degree,
            "target_degree_norm": normalize_degree(user_profile.highest_completed_degree),
            "major": user_profile.field_of_study,
            "target_countries": [c.lower() for c in user_profile.preferred_countries],
            "english_proficiency": "",
        }
    else:
        user_fields = user_profile  # already resolved dict

    feats = _build_ml_features(user_fields, scholarship)
    score = _rule_score(user_fields, scholarship, feats)

    reasons = []
    if feats["cgpa_gap"] >= 0:
        reasons.append(f"CGPA {user_fields['cgpa']:.1f} meets minimum requirement")
    if feats["degree_match"]:
        reasons.append("Degree level matches your target")
    if feats["country_match"]:
        reasons.append(f"Located in your preferred country")
    if feats["field_match"]:
        reasons.append("Field of study matches your major")
    if feats["scholarship_value"] > 0.3:
        reasons.append("Significant scholarship amount available")

    elig = "eligible" if score >= 65 else ("borderline" if score >= 45 else "not_eligible")
    return {"fit_score": score, "eligibility": elig, "reasons": reasons or ["General match based on profile"]}


def _rule_score(user_fields: dict, scholarship: Any, feats: dict) -> float:
    """Pure rule-based score 0-100."""
    score = 0.0

    # CGPA (30 pts)
    cgpa_gap = feats["cgpa_gap"]
    if cgpa_gap >= 0:
        score += min(30.0, 30.0 * (1 + cgpa_gap / 4.0))
    else:
        score += max(0.0, 30.0 + 15.0 * cgpa_gap)

    # Degree match (20 pts)
    score += 20.0 if feats["degree_match"] else 0.0

    # Country match (20 pts)
    score += 20.0 if feats["country_match"] else 0.0

    # Field match (15 pts)
    score += 15.0 if feats["field_match"] else 0.0

    # Fee affordable (5 pts)
    score += 5.0 if feats["fee_affordable"] else 0.0

    # Scholarship value bonus (5 pts)
    score += 5.0 * feats["scholarship_value"]

    # Verified bonus (5 pts)
    tuition_verified = _get(scholarship, "tuition_verified") or ""
    if tuition_verified in ("verified", True, "true"):
        score += 5.0

    # New Dynamic Factors (max 100 still applies)
    if feats["ielts_match"]:
        score += 10.0
    if feats["funding_match"]:
        score += 10.0
    if feats["requires_work"] and feats["has_work"]:
        score += 5.0

    return min(round(score, 2), 100.0)


# ─── Main Recommendation Function ─────────────────────────────────────────────

def get_recommendations(user: Any, db: Any) -> List[dict]:
    """
    Hybrid recommendation (60% rules + 40% ML).
    Returns list of up to 10 dicts sorted by fit_score desc.
    """
    from app.db.models import Scholarship, University
    from sqlalchemy import or_

    user_fields = resolve_user_fields(user)
    print(f"[Engine] User: id={user_fields['user_id']}, CGPA={user_fields['cgpa']}, "
          f"Target={user_fields['target_countries']}, Degree={user_fields['target_degree']}, "
          f"Major={user_fields['major']}")

    # 1. OPTIMIZED QUERY: Filter by target countries and degree level first
    # Join with University to allow country filtering even if Scholarship.country is NULL
    query = db.query(Scholarship).outerjoin(University).filter(
        Scholarship.is_active == True,
        or_(Scholarship.is_suspicious == False, Scholarship.is_suspicious.is_(None)),
        or_(Scholarship.is_archived == False, Scholarship.is_archived.is_(None))
    )
    
    # Apply country filter if user has preferences
    if user_fields['target_countries']:
        country_filters = []
        for c in user_fields['target_countries']:
            country_filters.append(Scholarship.country.ilike(f"%{c}%"))
            country_filters.append(University.country.ilike(f"%{c}%"))
            
            # Add common variations to the database query
            if c == "united kingdom":
                country_filters.append(Scholarship.country.ilike("%uk%"))
                country_filters.append(University.country.ilike("%uk%"))
            elif c == "united states":
                country_filters.append(Scholarship.country.ilike("%usa%"))
                country_filters.append(University.country.ilike("%usa%"))
                country_filters.append(Scholarship.country.ilike("% us%"))
                country_filters.append(University.country.ilike("% us%"))

        query = query.filter(or_(*country_filters))
    
    # Apply degree filter if user has target
    if user_fields['target_degree_norm']:
        query = query.filter(Scholarship.degree_level.ilike(f"%{user_fields['target_degree_norm']}%"))

    # Fetch top 100 relevant candidates to score in detail (much faster than scoring all 40k)
    scholarships = query.limit(100).all()
    
    # Fallback if no specific matches found
    if not scholarships:
        print("[Engine] No specific matches found, falling back to all active scholarships")
        scholarships = db.query(Scholarship).filter(
            Scholarship.is_active == True,
            Scholarship.is_archived == False
        ).limit(50).all()

    print(f"[Engine] Scholarships fetched for scoring: {len(scholarships)}")

    results = []
    for s in scholarships:
        feats = _build_ml_features(user_fields, s)
        rule_s = _rule_score(user_fields, s, feats)
        if _ML_ACTIVE:
            ml_s = ml_score(feats) * 100.0  # 0-100 scale
            final_score = round(0.6 * rule_s + 0.4 * ml_s, 2)
        else:
            final_score = rule_s

        # Build reasons list
        reasons: List[str] = []
        if feats["cgpa_gap"] >= 0:
            reasons.append(f"Your CGPA ({user_fields['cgpa']:.1f}) meets the minimum")
        elif feats["cgpa_gap"] > -0.5:
            reasons.append(f"CGPA slightly below requirement (gap: {abs(feats['cgpa_gap']):.1f})")
        if feats["degree_match"]:
            reasons.append("Degree level matches your target")
        if feats["country_match"]:
            reasons.append(f"Located in one of your preferred countries")
        if feats["field_match"]:
            reasons.append("Field of study aligns with your major")
        if feats["scholarship_value"] > 0.3:
            amt = _get(s, "scholarship_amount_value") or ""
            reasons.append(f"Scholarship covers significant costs{': ' + amt if amt else ''}")
        if not reasons:
            reasons.append("Matches broad eligibility criteria")

        # Match label
        if final_score >= 80:
            match_label = "High Match"
            match_color = "green"
        elif final_score >= 65:
            match_label = "Good Match"
            match_color = "yellow"
        else:
            match_label = "Stretch"
            match_color = "red"

        uni = getattr(s, "university", None)
        uni_name = getattr(uni, "name", "Unknown University") if uni else "Unknown University"
        city = s.city or (getattr(uni, "city", "") if uni else "")

        # Net cost as number
        net_cost = float(s.net_cost_numeric or 0.0)
        s_deadline = s.deadline
        deadline_str = ""
        if s_deadline:
            if isinstance(s_deadline, datetime):
                deadline_str = s_deadline.strftime("%Y-%m-%d")
            else:
                deadline_str = str(s_deadline)[:10]

        results.append({
            "scholarship_id": s.id,
            "scholarship_name": s.title,
            "uni_name": uni_name,
            "country": s.country or "",
            "city": city or "",
            "fit_score": final_score,
            "match_label": match_label,
            "match_color": match_color,
            "reasons": reasons[:3],
            "scholarship_link": s.scholarship_url or s.website_url or "",
            "after_fee": net_cost,
            "cgpa_min": float(getattr(uni, "min_cgpa", 0.0) or 0.0) if uni else 0.0,
            "deadline": deadline_str,
            "amount": s.scholarship_amount_value or s.amount or s.funding_type or "Varies",
            "funding_type": s.funding_type or "Funding Varies",
        })

    results.sort(key=lambda x: x["fit_score"], reverse=True)
    top10 = results[:10]
    if top10:
        print(f"[Engine] Top result: {top10[0]['scholarship_name']} | score={top10[0]['fit_score']} | label={top10[0]['match_label']}")
    else:
        print("[Engine] Top result: EMPTY — no scholarships scored")
    return top10


# ─── Degree Suggestion ─────────────────────────────────────────────────────────

def get_recommended_degree(user_profile: UserProfile, top_degrees: List[str]) -> tuple:
    d = user_profile.highest_completed_degree.lower()
    if "bachelor" in d:
        return "Masters", "A Masters builds on your Bachelor's and opens global opportunities."
    if "master" in d:
        return "PhD", "You're ready for doctoral research with your Masters background."
    return "Masters", "A Masters degree is the most common next step for international scholarships."
