import os
import joblib
import numpy as np
import pandas as pd
from typing import Any
from datetime import datetime, timezone

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

def extract_features(scholarship: Any, url_reachable: int = 1) -> dict:
    """
    url_reachable: pass 0 if URL check failed/timed-out, 1 otherwise.
    Default 1 (assume reachable) when called without live check.
    """
    text = (
        (getattr(scholarship, 'title', '') or '') + " " +
        (getattr(scholarship, 'description', '') or '') + " " +
        (getattr(scholarship, 'eligibility', '') or '')
    ).lower()

    has_high_risk = any(kw in text for kw in HIGH_RISK_KEYWORDS)
    has_medium_risk = any(kw in text for kw in MEDIUM_RISK_KEYWORDS)

    url = (getattr(scholarship, 'scholarship_url', '') or getattr(scholarship, 'website_url', '') or '').lower()
    trusted = any(ext in url for ext in ['.edu', '.ac.uk', '.gov', '.org'])
    suspicious_ext = any(url.endswith(ext) or (ext + '/') in url for ext in ['.tk', '.ml', '.ga', '.cf', '.xyz'])

    amount = float(getattr(scholarship, 'scholarship_amount_numeric', 0) or 0)
    fee = float(getattr(scholarship, 'tuition_fee_numeric', 0) or 0)
    ratio = amount / (fee if fee > 0 else 10000)

    deadline = getattr(scholarship, 'deadline', None)
    deadline_closeness = 0
    if deadline:
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if isinstance(deadline, str):
            try:
                dt = datetime.strptime(deadline[:10], "%Y-%m-%d")
                days = (dt - now_naive).days
                deadline_closeness = 1 if days < 7 else 0
            except Exception:
                pass
        elif isinstance(deadline, datetime):
            deadline_naive = deadline.replace(tzinfo=None) if deadline.tzinfo else deadline
            days = (deadline_naive - now_naive).days
            deadline_closeness = 1 if days < 7 else 0

    description_len = len(getattr(scholarship, 'description', '') or '')
    has_apply_steps = 1 if len(getattr(scholarship, 'eligibility', '') or '') > 50 else 0

    return {
        "has_high_risk_keyword": 1 if has_high_risk else 0,
        "has_medium_risk_keyword": 1 if has_medium_risk else 0,
        "url_reachable": url_reachable,             # now uses actual live check result
        "trusted_domain": 1 if trusted else 0,
        "suspicious_domain": 1 if suspicious_ext else 0,
        "scholarship_amount_ratio": ratio,
        "deadline_too_close": deadline_closeness,
        "has_official_email": 1 if trusted else 0,
        "cgpa_min_zero": 1 if (getattr(scholarship, 'min_cgpa', 1.0) or 0.0) == 0 else 0,
        "has_apply_steps": has_apply_steps,
        "description_length": description_len,
        "short_description": 1 if description_len < 50 else 0,
    }

# Cache the loaded model so we don't re-read the .pkl on every scholarship
_CACHED_MODEL = None
_CACHED_MTIME = None


def _load_model():
    """Load (and cache) the fraud model, reloading if the file changes on disk."""
    global _CACHED_MODEL, _CACHED_MTIME
    if not os.path.exists(MODEL_PATH):
        return None
    mtime = os.path.getmtime(MODEL_PATH)
    if _CACHED_MODEL is None or mtime != _CACHED_MTIME:
        _CACHED_MODEL = joblib.load(MODEL_PATH)
        _CACHED_MTIME = mtime
    return _CACHED_MODEL


def predict_anomaly(scholarship: Any, url_reachable: int = 1) -> float:
    """
    Fraud probability in [0, 1]. Higher = more likely fraud.

    Model-type aware:
      • Supervised classifier (RandomForest) → P(fraud) via predict_proba.
      • IsolationForest                       → normalised decision_function.
    Falls back to 0.5 if no model or on any error.
    """
    model = _load_model()
    if model is None:
        return 0.5

    try:
        feats = extract_features(scholarship, url_reachable=url_reachable)
        # Align columns to the trained feature order
        cols = list(getattr(model, "feature_names_in_", feats.keys()))
        df = pd.DataFrame([feats]).reindex(columns=cols, fill_value=0)

        if hasattr(model, "predict_proba"):
            # Supervised classifier: probability of the fraud class (label 1)
            classes = list(getattr(model, "classes_", [0, 1]))
            fraud_idx = classes.index(1) if 1 in classes else -1
            return float(np.clip(model.predict_proba(df)[0][fraud_idx], 0, 1))

        if hasattr(model, "decision_function"):
            # IsolationForest: lower decision_function = more anomalous
            decision = model.decision_function(df)[0]
            score = 1.0 - ((decision + 0.5) / 1.0)
            return float(np.clip(score, 0, 1))

        return 0.5
    except Exception:
        return 0.5
