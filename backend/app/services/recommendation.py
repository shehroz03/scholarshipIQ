from sqlalchemy.orm import Session
from app.db.models import User, Scholarship
import re
import math
from collections import Counter

def clean_text(text):
    if not text:
        return ""
    # Lowercase and remove special characters
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text

def get_cosine_similarity(vec1, vec2):
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])

    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    else:
        return float(numerator) / denominator

def text_to_vector(text):
    words = text.split()
    return Counter(words)

def get_recommendations(db: Session, user_id: int):
    # 1. Fetch User Profile
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    # 2. Hard Filtering (Step 1): Degree Level Match
    # Normalize degree levels for comparison
    user_degree = (user.degree_level or "").lower()
    
    # Pathway logic: Bachelor -> Master, Master -> PhD
    target_degree = ""
    if "bachelor" in user_degree:
        target_degree = "master"
    elif "master" in user_degree:
        target_degree = "phd"
    else:
        target_degree = user_degree # Fallback to same level if complex

    query = db.query(Scholarship)
    
    # Filter scholarships that match the target degree level
    if target_degree:
        scholarships = query.filter(Scholarship.degree_level.ilike(f"%{target_degree}%")).all()
    else:
        scholarships = query.all()

    if not scholarships:
        return []

    # 3. AI Scoring (Step 2): Content-Based Filtering (Pure Python Implementation)
    
    # Prepare User Tag
    user_tag = f"{user.field_of_interest or ''} {user.specialization or ''} {user.field_of_interest or ''}"
    user_tag_clean = clean_text(user_tag)
    user_vector = text_to_vector(user_tag_clean)
    
    # Process Scholarships
    scholarship_data = []
    for s in scholarships:
        s_tag = f"{s.title} {s.description or ''} {s.field_of_study or ''}"
        s_tag_clean = clean_text(s_tag)
        s_vector = text_to_vector(s_tag_clean)
        
        # Calculate Cosine Similarity
        score = get_cosine_similarity(user_vector, s_vector)
        
        scholarship_data.append({
            "id": s.id,
            "title": s.title,
            "university_name": s.university.name if s.university else "Unknown",
            "country": s.country,
            "degree_level": s.degree_level,
            "fit_score": round(score * 100, 1),
            "field_of_study": s.field_of_study,
            "raw_score": score
        })

    # Sort by score descending
    scholarship_data.sort(key=lambda x: x["raw_score"], reverse=True)

    # Top 10
    results = scholarship_data[:10]
    
    # Clean up internal keys before returning
    final_results = []
    for item in results:
        final_results.append({
            "id": item["id"],
            "title": item["title"],
            "university_name": item["university_name"],
            "country": item["country"],
            "degree_level": item["degree_level"],
            "fit_score": item["fit_score"],
            "field_of_study": item["field_of_study"]
        })

    return final_results
