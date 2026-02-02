import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.db.models import User, Scholarship
import re

def clean_text(text):
    if not text:
        return ""
    # Lowercase and remove special characters
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text

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

    # 3. AI Scoring (Step 2): Content-Based Filtering
    
    # Prepare User Tag
    user_tag = f"{user.field_of_interest or ''} {user.specialization or ''} {user.field_of_interest or ''}"
    user_tag = clean_text(user_tag)
    
    # Prepare Scholarship Tags
    scholarship_data = []
    for s in scholarships:
        s_tag = f"{s.title} {s.description or ''} {s.field_of_study or ''}"
        scholarship_data.append({
            "id": s.id,
            "tag": clean_text(s_tag),
            "object": s
        })

    # Combine user tag with scholarship tags for vectorization
    all_texts = [user_tag] + [item["tag"] for item in scholarship_data]
    
    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Calculate Cosine Similarity
    # tfidf_matrix[0:1] is the user vector
    # tfidf_matrix[1:] are the scholarship vectors
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
    
    # Ranking
    scores = cosine_sim[0]
    for i, score in enumerate(scores):
        scholarship_data[i]["score"] = float(score)

    # Sort by score descending
    scholarship_data.sort(key=lambda x: x["score"], reverse=True)

    # Top 10
    top_recommendations = scholarship_data[:10]
    
    results = []
    for item in top_recommendations:
        s = item["object"]
        results.append({
            "id": s.id,
            "title": s.title,
            "university_name": s.university.name if s.university else "Unknown",
            "country": s.country,
            "degree_level": s.degree_level,
            "fit_score": round(item["score"] * 100, 1),
            "field_of_study": s.field_of_study
        })

    return results
