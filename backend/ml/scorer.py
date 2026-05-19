"""
ScholarIQ ML Scorer
Loads the trained Random Forest model and provides prediction utilities
for hybrid scoring (60% rule-based + 40% ML).
"""
import os
import json
import joblib
import numpy as np

_BASE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(_BASE, "scholar_match.pkl")
FEATURES_PATH = os.path.join(_BASE, "feature_names.json")

model = None
feature_names = []

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("INFO: ML model loaded successfully")
    if os.path.exists(FEATURES_PATH):
        with open(FEATURES_PATH) as f:
            feature_names = json.load(f)
    if model is not None:
        print("INFO: Hybrid scoring active (60% rules + 40% ML)")
except Exception as e:
    print(f"WARNING: Could not load ML model: {e}")


def ml_score(features: dict) -> float:
    """
    Returns ML match probability (0-1) for a feature dict.
    Falls back to 0.5 if model unavailable.
    """
    if model is None:
        return 0.5
    try:
        row = [features.get(f, 0.0) for f in feature_names]
        proba = model.predict_proba([row])[0]
        return float(proba[1])  # probability of class 1 (match)
    except Exception:
        return 0.5
