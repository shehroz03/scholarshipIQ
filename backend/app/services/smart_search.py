import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db import models

def parse_query(query: str) -> dict:
    """
    Extract filters from natural language query.
    """
    q = query.lower()
    filters = {
        "country": None,
        "degree_level": None,
        "field": None,
        "cgpa": None,
        "funding_type": None,
        "keywords": []
    }

    # 1. Country detection
    if any(w in q for w in ["uk", "britain", "england", "united kingdom"]):
        filters["country"] = "United Kingdom"
    elif any(w in q for w in ["aus", "australia", "australian"]):
        filters["country"] = "Australia"
    elif any(w in q for w in ["canada", "canadian"]):
        filters["country"] = "Canada"
    elif any(w in q for w in ["germany", "german"]):
        filters["country"] = "Germany"
    elif any(w in q for w in ["turkey", "turkish"]):
        filters["country"] = "Turkey"

    # 2. Degree detection
    if any(w in q for w in ["masters", "msc", "ma", "mba"]):
        filters["degree_level"] = "Masters"
    elif any(w in q for w in ["phd", "doctorate", "research"]):
        filters["degree_level"] = "PhD"
    elif any(w in q for w in ["bachelors", "undergraduate"]):
        filters["degree_level"] = "Bachelors"

    # 3. Field detection
    if any(w in q for w in ["cs", "computer science", "software", "computing"]):
        filters["field"] = "Computer Science"
    elif any(w in q for w in ["business", "mba", "management", "finance"]):
        filters["field"] = "Business"
    elif any(w in q for w in ["engineering", "eng"]):
        filters["field"] = "Engineering"
    elif any(w in q for w in ["medicine", "medical", "mbbs"]):
        filters["field"] = "Medicine"
    elif any(w in q for w in ["data science", "ai", "machine learning"]):
        filters["field"] = "Data Science"
    elif "law" in q.split():
        filters["field"] = "Law"
    elif any(w in q for w in ["arts", "social"]):
        filters["field"] = "Arts & Social Sciences"

    # 4. CGPA detection (regex for "3.x" or "cgpa 3.x" or "3.x+")
    gpa_match = re.search(r'([2-4]\.\d+)(?:\+)?(?:\s*cgpa|\s*gpa)?|(?:cgpa|gpa)\s*([2-4]\.\d+)', q)
    if gpa_match:
        val = gpa_match.group(1) or gpa_match.group(2)
        if val:
            filters["cgpa"] = float(val)

    # 5. Funding detection
    if any(w in q for w in ["full funded", "fully funded", "full scholarship", "100%"]):
        filters["funding_type"] = "Fully Funded"
    elif "partial" in q:
        filters["funding_type"] = "Partial"

    # 6. Keywords (everything else not matched exactly or just split words)
    # Simple approach: standard word split without common stop words
    ignore_words = {"uk", "britain", "england", "aus", "australia", "canada", "germany", "turkey", 
                    "masters", "msc", "ma", "mba", "phd", "bachelors", "cgpa", "gpa", "funded", 
                    "fully", "partial", "scholarship", "scholarships", "university", "for", "in", "to", "with"}
    words = [w for w in re.findall(r'\b[a-z0-9]+\b', q) if w not in ignore_words and not re.match(r'^[2-4]\.\d+$', w)]
    filters["keywords"] = words

    return filters

def get_fraud_badge(scholarship) -> dict:
    """
    Returns fraud info for each scholarship.
    """
    level = getattr(scholarship, "fraud_risk_level", "SAFE") or "SAFE"
    score = getattr(scholarship, "fraud_risk_score", 0) or 0
    
    badge = {
        "is_safe": level == "SAFE",
        "risk_level": level,
        "risk_score": score,
        "badge_color": "green",
        "badge_text": "Verified Safe"
    }
    
    if level == "MEDIUM":
        badge["badge_color"] = "yellow"
        badge["badge_text"] = "Review Needed"
        badge["is_safe"] = False
    elif level == "HIGH":
        badge["badge_color"] = "orange"
        badge["badge_text"] = "Suspicious"
        badge["is_safe"] = False
    elif level == "CRITICAL":
        badge["badge_color"] = "red"
        badge["badge_text"] = "FRAUD"
        badge["is_safe"] = False
        
    return badge

def smart_search(query: str, user_cgpa: float, db: Session) -> dict:
    parsed_filters = parse_query(query)
    
    # 2. Build DB query
    # Only active, non-suspicious, and non-archived scholarships
    query_builder = db.query(models.Scholarship).join(models.Scholarship.university).filter(
        models.Scholarship.is_active == True,
        models.Scholarship.is_suspicious == False,
        models.Scholarship.is_archived == False
    )
    
    # Pre-filter by country if known strongly
    country_filter = parsed_filters.get("country")
    if country_filter:
        query_builder = query_builder.filter(models.Scholarship.country.ilike(f"%{country_filter}%"))
        
    results_db = query_builder.all()
    
    target_cgpa = parsed_filters.get("cgpa")
    if target_cgpa is None and user_cgpa and user_cgpa > 0:
        target_cgpa = user_cgpa

    refined_results = []
    
    for s in results_db:
        score = 0
        
        # Base Match 1. Country (if detected and matched)
        if parsed_filters["country"] and parsed_filters["country"].lower() in (s.country or "").lower():
            score += 30
            
        # Base Match 2. Degree
        if parsed_filters["degree_level"] and parsed_filters["degree_level"].lower() in (s.degree_level or "").lower():
            score += 25
            
        # Base Match 3. Field
        if parsed_filters["field"] and parsed_filters["field"].lower() in (s.field_of_study or "").lower():
            score += 20
            
        # Base Match 4. Funding
        if parsed_filters["funding_type"] and parsed_filters["funding_type"].lower() in (s.funding_type or "").lower():
            score += 15
            
        # Base Match 5. CGPA Eligibility
        cgpa_eligible = False
        s_cgpa = s.min_cgpa or (s.university.min_cgpa if s.university else 0)
        if target_cgpa:
            # allow +0.3 margin for "Stretch" matches
            if s_cgpa <= target_cgpa + 0.3:
                score += 15
                cgpa_eligible = True
                if s_cgpa <= target_cgpa:
                    score += 5 # Extra boost for solid eligibility

        # Base Match 6. Keyword boosts (title description university)
        kw_score = 0
        search_text = f"{(s.title or '')} {(s.description or '')} {(s.university.name if s.university else '')}".lower()
        for kw in parsed_filters["keywords"]:
            if kw in search_text:
                kw_score += 5
        score += min(15, kw_score) # Cap kw score

        # Fraud factor
        badge = get_fraud_badge(s)
        if badge["is_safe"]:
            score += 10
            
        # Soft filter: If significant filters were extracted but zero score, skip
        extracted_filters_count = sum(1 for v in [parsed_filters["country"], parsed_filters["degree_level"], parsed_filters["field"]] if v is not None)
        if extracted_filters_count > 0 and score < 20: 
            continue # Needs to match at least something substantial
            
        # Soft filter 2: IF CGPA is strict requirement and completely out of bounds, skip
        if target_cgpa and s_cgpa > target_cgpa + 0.3:
            continue

        match_lbl = "Stretch"
        if score >= 75: match_lbl = "High Match"
        elif score >= 50: match_lbl = "Good Match"

        refined_results.append({
            "id": s.id,
            "title": s.title,
            "university": s.university.name if s.university else "Unknown",
            "country": s.country,
            "city": s.city,
            "original_fee": s.tuition_fee_numeric,
            "after_fee": s.net_cost_numeric,
            "cgpa_min": s_cgpa,
            "deadline": s.deadline.strftime("%Y-%m-%d") if s.deadline else None,
            "scholarship_link": s.scholarship_url or s.website_url,
            "relevance_score": score,
            "fraud_badge": badge,
            "match_label": match_lbl,
            "funding_type": s.funding_type,
            "amount": s.amount
        })

    # Sort
    refined_results.sort(key=lambda x: x["relevance_score"], reverse=True)
    top_results = refined_results[:20]

    return {
        "query": query,
        "parsed_filters": {k: v for k, v in parsed_filters.items() if v},
        "total_found": len(refined_results),
        "results": top_results
    }
