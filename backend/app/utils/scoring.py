def calculate_profile_completion(user: any) -> int:
    """
    Calculates profile completion percentage based on provided user data.
    Works with both ORM models and Pydantic schemas.
    """
    fields = {
        "full_name": 5,
        "nationality": 5,
        "phone_number": 2,
        "cgpa": 10,
        "cgpa_scale": 2,
        "current_university": 3,
        "current_degree": 5,
        "major": 5,
        "graduation_year": 3,
        "english_test_type": 5,
        "ielts_overall": 5,
        "target_degree": 5,
        "target_country": 5,
        "target_field": 5,
        "monthly_family_income": 3,
        "work_experience_years": 5,
        "research_experience": 5,
        "has_publications": 4,
        "passport_valid": 3,
        "transcripts_ready": 3,
        "sop_ready": 4,
        "cv_ready": 5,
    }
    
    score = 0
    for field, weight in fields.items():
        # Handle dict or object
        if isinstance(user, dict):
            val = user.get(field)
        else:
            val = getattr(user, field, None)
            
        # Check if field is filled
        if val is not None and val != "" and val is not False:
            score += weight
            
    return min(score, 100)


def calculate_match_score(scholarship: any, user: any) -> float:
    """
    Rule-based match score (0-100) between a scholarship and a user profile.
    Used as the 60% rule-based component of the hybrid scoring system.
    """
    score = 0.0

    def get(obj, attr, default=None):
        if isinstance(obj, dict):
            return obj.get(attr, default)
        return getattr(obj, attr, default)

    # 1. CGPA match (30 pts)
    user_cgpa = get(user, "cgpa") or 0.0
    min_cgpa = get(scholarship, "min_cgpa") or 0.0
    try:
        user_cgpa = float(user_cgpa)
        min_cgpa = float(min_cgpa)
    except (TypeError, ValueError):
        user_cgpa = 0.0
        min_cgpa = 0.0

    if user_cgpa >= min_cgpa:
        gap = user_cgpa - min_cgpa
        score += min(30, 30 * (1 + gap / 4.0))
    else:
        shortfall = min_cgpa - user_cgpa
        score += max(0, 30 - 15 * shortfall)

    # 2. Degree level match (20 pts)
    user_degree = (get(user, "target_degree") or get(user, "degree_level") or "").lower()
    scholarship_degree = (get(scholarship, "degree_level") or "").lower()
    if user_degree and scholarship_degree:
        if user_degree in scholarship_degree or scholarship_degree in user_degree:
            score += 20

    # 3. Country match (20 pts)
    user_country = (get(user, "target_country") or "").lower()
    scholarship_country = (get(scholarship, "country") or "").lower()
    if user_country and scholarship_country:
        user_countries = [c.strip() for c in user_country.split(",")]
        if any(scholarship_country in c or c in scholarship_country for c in user_countries):
            score += 20

    # 4. Field/major match (20 pts)
    user_field = (get(user, "major") or get(user, "field_of_interest") or "").lower()
    scholarship_field = (get(scholarship, "field_of_study") or "").lower()
    if user_field and scholarship_field:
        if user_field in scholarship_field or scholarship_field in user_field:
            score += 20
        elif "all" in scholarship_field or "any" in scholarship_field:
            score += 15

    # 5. Verified bonus (10 pts)
    if get(scholarship, "is_verified"):
        score += 10

    return min(round(score, 2), 100.0)
