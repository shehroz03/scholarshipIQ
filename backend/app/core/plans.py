from typing import Dict, Any

PLAN_LIMITS = {
    "free": {
        "search_results": -1,
        "saved_scholarships": -1,
        "ai_recommendations": -1,
        "track_applications": -1,
        "consultant_messages": -1,  # Unlimited
        "sop_writer": True,
        "smart_match_score": True,
        "cv_builder": True,
        "interview_prep": True,
        "doc_checklist": True,
        "priority_support": True,
    },
    "premium": {
        "search_results": -1,  # Unlimited
        "saved_scholarships": -1,
        "ai_recommendations": -1,
        "track_applications": -1,
        "consultant_messages": -1,
        "sop_writer": True,
        "smart_match_score": True,
        "cv_builder": True,
        "interview_prep": True,
        "doc_checklist": True,
        "priority_support": True,
    },
    "pro": {
        "search_results": -1,
        "saved_scholarships": -1,
        "ai_recommendations": -1,
        "track_applications": -1,
        "consultant_messages": -1,  # Unlimited
        "sop_writer": True,
        "smart_match_score": True,
        "cv_builder": True,
        "interview_prep": True,
        "doc_checklist": True,
        "priority_support": True,
    }
}

def get_limit(plan: str, feature: str) -> Any:
    plan_data = PLAN_LIMITS.get(plan.lower(), PLAN_LIMITS["free"])
    return plan_data.get(feature, PLAN_LIMITS["free"].get(feature))
