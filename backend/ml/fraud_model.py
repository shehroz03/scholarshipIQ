import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'fraud_model.pkl')

HIGH_RISK_KEYWORDS = [
    "processing fee", "registration fee", "pay to apply",
    "bank transfer", "western union", "moneygram",
    "wire transfer", "credit card required", "advance payment",
    "guaranteed scholarship", "100% guaranteed", "winner selected",
    "you have been selected", "congratulations you won",
    "no application needed", "instant approval",
    "act now", "limited time only", "expire today",
    "respond immediately", "claim your scholarship",
    "whatsapp only", "telegram only", "contact via gmail",
    "yahoo.com", "hotmail.com"
]

MEDIUM_RISK_KEYWORDS = [
    "apply via whatsapp", "send documents to email",
    "no cgpa required", "everyone eligible",
    "apply from any country", "no language test required",
]

def extract_features(scholarship: Any) -> dict:
    # Feature extraction logic for fraud detection
    text = (
        (getattr(scholarship, 'title', '') or '') + " " +
        (getattr(scholarship, 'description', '') or '') + " " +
        (getattr(scholarship, 'eligibility', '') or '')
    ).lower()

    has_high_risk = any(kw in text for kw in HIGH_RISK_KEYWORDS)
    has_medium_risk = any(kw in text for kw in MEDIUM_RISK_KEYWORDS)
    
    # URL sanity check
    url = (getattr(scholarship, 'scholarship_url', '') or getattr(scholarship, 'website_url', '') or '').lower()
    trusted = any(url.endswith(ext) for ext in ['.edu', '.ac.uk', '.gov', '.org'])
    
    # Financial ratio
    amount = float(getattr(scholarship, 'scholarship_amount_numeric', 0) or 0)
    fee = float(getattr(scholarship, 'tuition_fee_numeric', 0) or 0)
    ratio = amount / (fee if fee > 0 else 10000)
    
    # Deadline
    deadline = getattr(scholarship, 'deadline', None)
    deadline_closeness = 0
    if deadline:
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if isinstance(deadline, str):
            try:
                dt = datetime.strptime(deadline[:10], "%Y-%m-%d")
                days = (dt - now_naive).days
                deadline_closeness = 1 if days < 7 else 0
            except: pass
        elif isinstance(deadline, datetime):
            deadline_naive = deadline.replace(tzinfo=None) if deadline.tzinfo else deadline
            days = (deadline_naive - now_naive).days
            deadline_closeness = 1 if days < 7 else 0

    return {
        "has_high_risk_keyword": 1 if has_high_risk else 0,
        "has_medium_risk_keyword": 1 if has_medium_risk else 0,
        "url_reachable": 1, # placeholder till service level
        "trusted_domain": 1 if trusted else 0,
        "scholarship_amount_ratio": ratio,
        "deadline_too_close": deadline_closeness,
        "has_official_email": 1 if trusted else 0,
        "cgpa_min_zero": 1 if (getattr(scholarship, 'min_cgpa', 1.0) or 0.0) == 0 else 0,
        "has_apply_steps": 1 if len(getattr(scholarship, 'eligibility', '') or '') > 50 else 0,
        "description_length": len(getattr(scholarship, 'description', '') or '')
    }

def predict_anomaly(scholarship: Any) -> float:
    """Predicts if a scholarship is an anomaly (0 to 1). Higher = more likely fraud."""
    if not os.path.exists(MODEL_PATH):
        return 0.5 # Default if model not trained
    
    try:
        model = joblib.load(MODEL_PATH)
        feats = extract_features(scholarship)
        df = pd.DataFrame([feats])
        # IsolationForest predict returns -1 for anomalies, 1 for normal
        decision = model.decision_function(df)[0]
        # Normalize decision function to 0-1 scale roughly
        # Usually decision function range is roughly [-0.5, 0.5]
        score = 1.0 - ((decision + 0.5) / 1.0)
        return float(np.clip(score, 0, 1))
    except:
        return 0.5
