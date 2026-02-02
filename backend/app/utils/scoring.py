# backend/app/utils/scoring.py

def calculate_match_score(user, scholarship):
    """
    Calculates a match score between a user profile and a scholarship.
    Returns a score between 0 and 100.
    """
    score = 0
    
    # 1. Field of Interest / Major Match (40 Points)
    user_fields = []
    if user.major:
        user_fields.append(user.major.lower())
    if user.field_of_interest: # Compatibility
        user_fields.append(user.field_of_interest.lower())
    if user.specialization: # Compatibility
        user_fields.append(user.specialization.lower())
    
    field_matched = False
    for field in user_fields:
        if (scholarship.field_of_study and field in scholarship.field_of_study.lower()) or \
           (field in scholarship.title.lower()) or \
           (scholarship.description and field in scholarship.description.lower()):
            field_matched = True
            break
            
    if field_matched:
        score += 40
    elif scholarship.description and "general" in scholarship.description.lower():
        score += 20

    # 2. GPA / CGPA Match (25 Points)
    try:
        # Get requirement from university if available
        req_gpa = 0.0
        if scholarship.university and scholarship.university.min_cgpa:
            req_gpa = float(scholarship.university.min_cgpa)
            
        user_gpa = float(user.cgpa) if user.cgpa else 0.0
        
        if user_gpa >= req_gpa:
            score += 25
        elif user_gpa > 0:
            # Partial points if slightly below
            score += 10
    except Exception:
        score += 25 # Benefit of doubt

    # 3. Target Degree / Level Match (20 Points)
    # Match user's target degree with scholarship level
    if user.target_degree and scholarship.degree_level:
        t_level = user.target_degree.lower()
        s_level = scholarship.degree_level.lower()
        
        if t_level in s_level or s_level in t_level:
            score += 15
        
    # Also check current degree progression (Bachelors -> Masters)
    if user.current_degree and scholarship.degree_level:
        c_level = user.current_degree.lower()
        s_level = scholarship.degree_level.lower()
        
        if "bachelor" in c_level and "master" in s_level:
            score += 5
        if "master" in c_level and ("phd" in s_level or "doctor" in s_level):
            score += 5

    # 4. Target Country Match (15 Points)
    if user.target_country and scholarship.country:
        if user.target_country.lower() == "any" or user.target_country.lower() == scholarship.country.lower():
            score += 15
        elif user.target_country.lower() in scholarship.title.lower():
            score += 15
    else:
        # Base points if data missing
        score += 5
    
    return min(score, 100)
