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

# Accepted feature-list sizes. 7 = legacy model, 12 = current full feature set.
# Anything else means feature_names.json is stale/corrupt → disable ML safely.
_VALID_FEATURE_COUNTS = (7, 12)

model = None
feature_names = []


def _load_feature_config():
    """Load and validate feature_names.json. Returns [] on any problem."""
    if not os.path.exists(FEATURES_PATH):
        print("WARNING: feature_names.json not found. "
              "Run: python -m ml.train_recommendation_model")
        return []
    try:
        with open(FEATURES_PATH) as f:
            cfg = json.load(f)
    except Exception as e:
        print(f"WARNING: feature_names.json unreadable ({e}). ML disabled.")
        return []

    if not isinstance(cfg, list) or len(cfg) not in _VALID_FEATURE_COUNTS:
        print(f"WARNING: feature_names.json has {len(cfg) if isinstance(cfg, list) else '?'} "
              f"features — expected one of {_VALID_FEATURE_COUNTS}. "
              "Re-run train_recommendation_model.py. ML disabled to avoid bad inference.")
        return []
    return cfg


try:
    feature_names = _load_feature_config()

    if os.path.exists(MODEL_PATH) and feature_names:
        loaded = joblib.load(MODEL_PATH)
        # Guard: model's expected feature count must match feature_names.json
        n_expected = getattr(loaded, "n_features_in_", len(feature_names))
        if n_expected != len(feature_names):
            print(f"WARNING: Model expects {n_expected} features but feature_names.json "
                  f"has {len(feature_names)}. ML disabled — retrain to resync.")
            model = None
        else:
            model = loaded
            print(f"INFO: ML model loaded successfully ({len(feature_names)} features)")
    elif os.path.exists(MODEL_PATH) and not feature_names:
        print("WARNING: Model file exists but feature config invalid. ML disabled.")

    if model is not None:
        print("INFO: Hybrid scoring active (60% rules + 40% ML)")
except Exception as e:
    print(f"WARNING: Could not load ML model: {e}")
    model = None


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
