import requests
import re
import json
from typing import List, Any
from datetime import datetime
from ml.fraud_model import extract_features, predict_anomaly, HIGH_RISK_KEYWORDS, MEDIUM_RISK_KEYWORDS

def check_keywords(scholarship: Any) -> tuple:
    """Check text for high and medium risk keywords. Returns (score, reasons)."""
    text = (
        (getattr(scholarship, 'title', '') or '') + " " +
        (getattr(scholarship, 'description', '') or '') + " " +
        (getattr(scholarship, 'eligibility', '') or '')
    ).lower()
    
    score = 0
    reasons = []
    
    # Check high risk
    found_high = [kw for kw in HIGH_RISK_KEYWORDS if kw in text]
    if found_high:
        score += 50
        reasons.append(f"High-risk keywords found: {', '.join(found_high[:3])}")
        
    # Check medium risk
    found_med = [kw for kw in MEDIUM_RISK_KEYWORDS if kw in text]
    if found_med:
        score += 20
        reasons.append(f"Medium-risk keywords found: {', '.join(found_med[:3])}")
        
    return score, reasons

def validate_url(scholarship: Any) -> tuple:
    """Validate URLs for reachability and suspicious domains. Returns (score, reasons)."""
    url = (getattr(scholarship, 'scholarship_url', '') or getattr(scholarship, 'website_url', '') or '').lower()
    if not url:
        return 10, ["No scholarship URL provided"]
        
    score = 0
    reasons = []
    
    # Suspicious domains check
    suspicious_exts = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.bit', '.onion']
    if any(url.endswith(ext) or (ext + '/') in url for ext in suspicious_exts):
        score += 20
        reasons.append(f"Suspicious domain extension found in URL")
        
    # Trusted domains (reduce risk score if trusted)
    trusted_exts = ['.edu', '.ac.uk', '.gov', '.org']
    if any(url.endswith(ext) or (ext + '/') in url for ext in trusted_exts):
        score -= 10
    else:
        score += 5
        reasons.append("Non-academic/government domain (.com/.net)")

    # Reachability test (silent requests.head)
    try:
        response = requests.head(url, timeout=5)
        if response.status_code >= 400:
            score += 10
            reasons.append(f"URL returned error status code: {response.status_code}")
    except:
        score += 15
        reasons.append("URL is not reachable or timed out")
        
    return score, reasons

def calculate_fraud_risk(scholarship: Any) -> dict:
    """Combines all detection layers into a composite risk report."""
    if isinstance(scholarship, dict):
        class MockScholarship:
            def __init__(self, d):
                self.title = d.get("title", "")
                self.description = d.get("description", "")
                self.eligibility = ""
                self.scholarship_url = d.get("scholarship_url", "")
                self.website_url = d.get("website_url", "")
                self.international_email = d.get("international_email", "")
                self.scholarship_amount_numeric = d.get("scholarship_amount_value", 0)
                self.tuition_fee_numeric = d.get("tuition_fee_per_year", 0)
                self.min_cgpa = d.get("cgpa_min", 0)
        scholarship = MockScholarship(scholarship)
        
    kw_score, kw_reasons = check_keywords(scholarship)
    url_score, url_reasons = validate_url(scholarship)
    ml_anomaly = predict_anomaly(scholarship)
    ml_score = int(ml_anomaly * 20)
    
    total = max(0, min(100, kw_score + url_score + ml_score))
    reasons = kw_reasons + url_reasons
    
    if ml_anomaly > 0.7:
        reasons.append(f"ML Anomaly Detector flagged unusual pattern ({int(ml_anomaly*100)}%)")
        
    risk_level = "SAFE"
    if total >= 70: risk_level = "CRITICAL"
    elif total >= 50: risk_level = "HIGH"
    elif total >= 30: risk_level = "MEDIUM"
    
    return {
        "risk_score": total,
        "risk_level": risk_level,
        "reasons": reasons,
        "auto_flag": total >= 50
    }

def analyze_fraud_risk(title: str, description: str) -> dict:
    """Simple wrapper for backward compatibility with manual create endpoints."""
    class TempObj:
        def __init__(self, t, d):
            self.title = t
            self.description = d
            self.eligibility = ""
            self.scholarship_url = ""
            self.website_url = ""
            self.scholarship_amount_numeric = 0
            self.tuition_fee_numeric = 0
            self.deadline = None
            self.min_cgpa = 0
            
    obj = TempObj(title, description)
    result = calculate_fraud_risk(obj)
    return {
        "is_suspicious": result["auto_flag"],
        "reason": ", ".join(result["reasons"]),
        "risk_level": result["risk_level"]
    }
