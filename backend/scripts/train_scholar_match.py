"""
ScholarIQ ML Training Script
Reads real users + scholarships from SQLite DB, generates feature vectors,
trains RandomForestClassifier, and saves the model.

Usage (from backend/ directory):
    .\\venv\\Scripts\\python.exe scripts/train_scholar_match.py
"""
import sys
import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timezone
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split

# Add backend root to sys.path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FEATURES = [
    "cgpa_gap",
    "degree_match",
    "country_match",
    "field_match",
    "fee_affordable",
    "scholarship_value",
    "deadline_days",
]

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")
MODEL_PATH = os.path.join(MODEL_DIR, "scholar_match.pkl")
FEATURES_PATH = os.path.join(MODEL_DIR, "feature_names.json")


def normalize_degree(d: str) -> str:
    d = (d or "").lower().strip()
    if "phd" in d or "doctor" in d:
        return "phd"
    if "master" in d or "msc" in d or "mba" in d or "m.s" in d:
        return "masters"
    return "bachelors"


def normalize_country(c: str) -> str:
    return (c or "").lower().strip()


def build_feature_vector(user, scholarship) -> dict:
    # user: dict or object
    def ug(attr, default=None):
        if isinstance(user, dict):
            return user.get(attr, default)
        return getattr(user, attr, default)

    def sg(attr, default=None):
        if isinstance(scholarship, dict):
            return scholarship.get(attr, default)
        return getattr(scholarship, attr, default)

    user_cgpa = float(ug("cgpa") or 0.0)
    s_cgpa_min = float(sg("cgpa_min") or sg("university_min_cgpa") or 0.0)
    cgpa_gap = user_cgpa - s_cgpa_min

    user_degree = normalize_degree(ug("target_degree") or ug("degree_level") or "")
    s_degree = normalize_degree(sg("degree_level") or "")
    degree_match = 1 if (user_degree and s_degree and user_degree == s_degree) else 0

    user_countries_raw = (ug("target_country") or "")
    user_countries = [normalize_country(c) for c in user_countries_raw.split(",") if c.strip()]
    s_country = normalize_country(sg("country") or "")
    country_match = 1 if (s_country and any(s_country in c or c in s_country for c in user_countries)) else 0

    user_field = (ug("major") or ug("field_of_interest") or "").lower().strip()
    s_field = (sg("field_of_study") or "").lower().strip()
    if not user_field or not s_field:
        field_match = 0
    elif user_field in s_field or s_field in user_field or "all" in s_field:
        field_match = 1
    else:
        field_match = 0

    # fee_affordable: net_cost <= cgpa * 8000
    net_cost = float(sg("net_cost_numeric") or sg("net_cost_per_year") or 0.0)
    try:
        if isinstance(net_cost, str):
            import re
            nums = re.findall(r"[\d,]+", net_cost)
            net_cost = float(nums[0].replace(",", "")) if nums else 0.0
    except Exception:
        net_cost = 0.0
    fee_affordable = 1 if (net_cost == 0 or net_cost <= user_cgpa * 8000) else 0

    # scholarship_value: normalized to 0-1 (over 50000)
    schol_val = float(sg("scholarship_amount_numeric") or 0.0)
    scholarship_value = min(schol_val / 50000.0, 1.0)

    # deadline_days: days until deadline / 365
    deadline = sg("deadline")
    deadline_days = 0.5  # default: 6 months
    if deadline:
        try:
            if isinstance(deadline, str):
                dl_dt = datetime.strptime(deadline[:10], "%Y-%m-%d")
            elif isinstance(deadline, datetime):
                dl_dt = deadline
            else:
                dl_dt = None
            if dl_dt:
                days = (dl_dt - datetime.now(timezone.utc)).days
                deadline_days = max(0.0, min(days / 365.0, 2.0))
        except Exception:
            pass

    return {
        "cgpa_gap": cgpa_gap,
        "degree_match": degree_match,
        "country_match": country_match,
        "field_match": field_match,
        "fee_affordable": fee_affordable,
        "scholarship_value": scholarship_value,
        "deadline_days": deadline_days,
    }


def make_label(features: dict) -> int:
    """1 = good match if cgpa_gap >= 0 AND degree_match == 1 AND country_match == 1"""
    return 1 if (features["cgpa_gap"] >= 0 and features["degree_match"] == 1 and features["country_match"] == 1) else 0


def load_real_data():
    """Load users and scholarships from SQLite and generate training pairs."""
    from app.db.session import SessionLocal
    from app.db.models import User, Scholarship

    db = SessionLocal()
    rows = []
    try:
        users = db.query(User).filter(User.cgpa != None).all()
        scholarships = db.query(Scholarship).all()
        print(f"Found {len(users)} users with CGPA, {len(scholarships)} scholarships in DB.")

        for user in users:
            for s in scholarships:
                # Enrich scholarship with university min_cgpa
                s_dict = {
                    "cgpa_min": s.university.min_cgpa if s.university else None,
                    "university_min_cgpa": s.university.min_cgpa if s.university else None,
                    "degree_level": s.degree_level,
                    "country": s.country,
                    "field_of_study": s.field_of_study,
                    "net_cost_numeric": s.net_cost_numeric,
                    "scholarship_amount_numeric": s.scholarship_amount_numeric,
                    "deadline": s.deadline,
                }
                feats = build_feature_vector(user, s_dict)
                label = make_label(feats)
                rows.append({**feats, "target": label})
    finally:
        db.close()

    return rows


def generate_synthetic_data(n_samples: int = 800):
    np.random.seed(42)
    rows = []
    for _ in range(n_samples):
        cgpa_gap = np.random.uniform(-1.5, 1.5)
        degree_match = np.random.choice([0, 1])
        country_match = np.random.choice([0, 1])
        field_match = np.random.choice([0, 1])
        fee_affordable = np.random.choice([0, 1], p=[0.3, 0.7])
        scholarship_value = np.random.uniform(0, 1)
        deadline_days = np.random.uniform(0, 1.5)

        label = make_label({
            "cgpa_gap": cgpa_gap,
            "degree_match": degree_match,
            "country_match": country_match,
        })
        # 10% noise
        if np.random.random() < 0.10:
            label = 1 - label

        rows.append({
            "cgpa_gap": cgpa_gap,
            "degree_match": degree_match,
            "country_match": country_match,
            "field_match": field_match,
            "fee_affordable": fee_affordable,
            "scholarship_value": scholarship_value,
            "deadline_days": deadline_days,
            "target": label,
        })
    return rows


def train_model():
    print("Loading real data from DB...")
    real_rows = []
    try:
        real_rows = load_real_data()
        print(f"  - {len(real_rows)} real training pairs generated.")
    except Exception as e:
        import traceback
        print(f"  - Could not load DB data: {e}")
        traceback.print_exc()

    if len(real_rows) < 50:
        print(f"  - Less than 50 real samples, supplementing with 800 synthetic samples...")
        synthetic_rows = generate_synthetic_data(800)
        all_rows = real_rows + synthetic_rows
    else:
        all_rows = real_rows

    df = pd.DataFrame(all_rows)
    print(f"Total training samples: {len(df)}  |  Positive: {df['target'].sum()}  |  Negative: {(df['target']==0).sum()}")

    X = df[FEATURES]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestClassifier(n_estimators=200)...")
    model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {acc:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved -> {MODEL_PATH}")

    with open(FEATURES_PATH, "w") as f:
        json.dump(FEATURES, f)
    print(f"Feature names saved -> {FEATURES_PATH}")
    print("Done!")


if __name__ == "__main__":
    train_model()
