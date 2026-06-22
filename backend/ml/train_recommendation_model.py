"""
ScholarIQ — Recommendation Model Trainer
==========================================
Trains a RandomForestClassifier on implicit user feedback.

LABELING (defensible to examiners):
    POSITIVE (1) = apply OR save  → explicit intent the student wants it.
    NEGATIVE (0) = IMPLICIT NEGATIVE SAMPLING — random scholarships the user
                   did NOT interact with (standard implicit-feedback technique).

    VIEWS are EXCLUDED. The interaction table has no dwell-time, so a "view"
    is ambiguous (engaged read vs accidental bounce). Including ambiguous
    labels pollutes the model — we drop them rather than guess.

Class imbalance: handled by negative sampling ratio + class_weight='balanced'.

Run:
    cd backend
    python -m ml.train_recommendation_model

Outputs saved to ml/:
    scholar_match.pkl       (trained RandomForest)
    feature_names.json      (ordered feature list for scorer.py)
    rec_model_report.txt    (classification report + confusion matrix)
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# ── Project paths ─────────────────────────────────────────────────────────────
_HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(_HERE, ".."))

from app.recommendation.engine import _build_ml_features, resolve_user_fields

MODEL_OUT    = os.path.join(_HERE, "scholar_match.pkl")
FEATURES_OUT = os.path.join(_HERE, "feature_names.json")
REPORT_OUT   = os.path.join(_HERE, "rec_model_report.txt")

FEATURE_NAMES = [
    "cgpa_gap", "degree_match", "country_match", "field_match",
    "fee_affordable", "scholarship_value", "deadline_days",
    "ielts_match", "funding_match", "work_exp_match",
    "requires_work", "has_work",
]


# ── Data loading ──────────────────────────────────────────────────────────────

def load_interaction_data(neg_ratio: int = 2):
    """
    Build training rows from implicit feedback.

      POSITIVE (1): every (user, scholarship) where interaction is apply/save.
      NEGATIVE (0): for each such user, sample `neg_ratio` random scholarships
                    the user never interacted with at all.
      VIEWS:        excluded entirely (ambiguous without dwell-time).

    Returns a list of feature dicts (each with a "label" key).
    """
    import random
    from app.db.session import SessionLocal
    from app.db.models import UserScholarshipInteraction, User, Scholarship

    random.seed(42)
    db = SessionLocal()
    records = []
    skipped = 0

    try:
        all_schol_ids = [r[0] for r in db.query(Scholarship.id).all()]
        interactions = db.query(UserScholarshipInteraction).all()
        print(f"[Rec Trainer] Total interactions in DB: {len(interactions)}")

        # Group interactions by user; track touched scholarships per user
        positives_by_user: dict = {}
        touched_by_user: dict = {}
        for inter in interactions:
            touched_by_user.setdefault(inter.user_id, set()).add(inter.scholarship_id)
            if inter.interaction_type in ("apply", "save"):
                positives_by_user.setdefault(inter.user_id, set()).add(inter.scholarship_id)

        user_cache: dict = {}
        schol_cache: dict = {}

        def _user(uid):
            if uid not in user_cache:
                user_cache[uid] = db.query(User).filter(User.id == uid).first()
            return user_cache[uid]

        def _schol(sid):
            if sid not in schol_cache:
                schol_cache[sid] = db.query(Scholarship).filter(Scholarship.id == sid).first()
            return schol_cache[sid]

        def _row(user, schol, label):
            try:
                feats = _build_ml_features(resolve_user_fields(user), schol)
            except Exception:
                return None
            r = {f: feats.get(f, 0.0) for f in FEATURE_NAMES}
            r["label"] = label
            return r

        for uid, pos_ids in positives_by_user.items():
            user = _user(uid)
            if not user:
                skipped += 1
                continue

            # Positives
            for sid in pos_ids:
                schol = _schol(sid)
                if not schol:
                    skipped += 1
                    continue
                row = _row(user, schol, 1)
                if row:
                    records.append(row)

            # Negatives: random scholarships this user never touched
            untouched = list(set(all_schol_ids) - touched_by_user.get(uid, set()))
            random.shuffle(untouched)
            for sid in untouched[: len(pos_ids) * neg_ratio]:
                schol = _schol(sid)
                if not schol:
                    continue
                row = _row(user, schol, 0)
                if row:
                    records.append(row)

    finally:
        db.close()

    print(f"[Rec Trainer] Skipped (missing user/schol): {skipped}")
    return records


def generate_synthetic_data(n_positive: int = 200, n_negative: int = 200) -> list:
    """
    When real interaction data is insufficient (<100 rows), generate
    rule-consistent synthetic samples to bootstrap training.

    Positive (match):  high cgpa_gap, degree_match=1, country_match=1, field_match=1
    Negative (no match): low/negative cgpa_gap, mismatched degree/country
    """
    rng = np.random.default_rng(42)
    rows = []

    for _ in range(n_positive):
        rows.append({
            "cgpa_gap":              float(rng.uniform(0.0, 1.5)),
            "degree_match":          1,
            "country_match":         1,
            "field_match":           rng.integers(0, 2),
            "fee_affordable":        rng.integers(0, 2),
            "scholarship_value":     float(rng.uniform(0.3, 1.0)),
            "deadline_days":         float(rng.uniform(0.2, 1.5)),
            "ielts_match":           rng.integers(0, 2),
            "funding_match":         1,
            "work_exp_match":        1,
            "requires_work":         0,
            "has_work":              rng.integers(0, 2),
            "label":                 1,
        })

    for _ in range(n_negative):
        rows.append({
            "cgpa_gap":              float(rng.uniform(-2.0, -0.1)),
            "degree_match":          0,
            "country_match":         0,
            "field_match":           0,
            "fee_affordable":        0,
            "scholarship_value":     float(rng.uniform(0.0, 0.2)),
            "deadline_days":         float(rng.uniform(0.0, 0.5)),
            "ielts_match":           0,
            "funding_match":         0,
            "work_exp_match":        0,
            "requires_work":         rng.integers(0, 2),
            "has_work":              0,
            "label":                 0,
        })

    return rows


# ── Training ──────────────────────────────────────────────────────────────────

def train():
    print("[Rec Trainer] Loading user interaction data...")
    records = load_interaction_data()

    if len(records) < 100:
        print(f"[Rec Trainer] Only {len(records)} real interactions — "
              f"adding synthetic bootstrap data (remove once >500 real rows exist)")
        records += generate_synthetic_data(n_positive=300, n_negative=300)

    df = pd.DataFrame(records)
    X  = df[FEATURE_NAMES].fillna(0)
    y  = df["label"].to_numpy()

    print(f"[Rec Trainer] Training set — total={len(y)}, "
          f"positive={int((y==1).sum())}, negative={int((y==0).sum())}")

    if len(set(y.tolist())) < 2:
        print("[Rec Trainer] ERROR: Only one class in dataset. Cannot train.")
        sys.exit(1)

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=6,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    # ── Cross-validated evaluation ────────────────────────────────────────────
    n_splits = min(5, int((y == 1).sum()))  # can't have more splits than minority class
    if n_splits < 2:
        print("[Rec Trainer] WARNING: Too few positive samples for CV. Fitting without CV.")
        model.fit(X, y)
        report_text = "[Rec Trainer] Model trained without CV (insufficient data).\n"
    else:
        print(f"[Rec Trainer] Running {n_splits}-fold stratified cross-validation...")
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        y_pred_cv  = cross_val_predict(model, X, y, cv=cv)
        y_proba_cv = cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1]

        report  = classification_report(y, y_pred_cv, target_names=["No Match", "Match"])
        cm      = confusion_matrix(y, y_pred_cv)
        roc_auc = roc_auc_score(y, y_proba_cv)

        report_text = (
            f"ScholarIQ Recommendation Model — Training Report\n"
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
            f"{'='*55}\n\n"
            f"Dataset\n"
            f"  Total samples : {len(y)}\n"
            f"  Match (1)     : {int((y==1).sum())}\n"
            f"  No Match (0)  : {int((y==0).sum())}\n\n"
            f"{n_splits}-Fold Cross-Validation Results\n"
            f"{report}\n"
            f"Confusion Matrix:\n"
            f"  [[TN={cm[0,0]}  FP={cm[0,1]}]\n"
            f"   [FN={cm[1,0]}  TP={cm[1,1]}]]\n\n"
            f"ROC-AUC Score: {roc_auc:.4f}\n\n"
            f"Feature Importances\n"
        )

        model.fit(X, y)
        importances = sorted(
            zip(FEATURE_NAMES, model.feature_importances_),
            key=lambda x: x[1], reverse=True
        )
        for feat, imp in importances:
            report_text += f"  {feat:<30} {imp:.4f}\n"

        print(report_text)

    # ── Save ──────────────────────────────────────────────────────────────────
    joblib.dump(model, MODEL_OUT)
    with open(FEATURES_OUT, "w", encoding="utf-8") as f:
        json.dump(FEATURE_NAMES, f)
    with open(REPORT_OUT, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"[Rec Trainer] Model saved    -> {MODEL_OUT}")
    print(f"[Rec Trainer] Features saved -> {FEATURES_OUT}")
    print(f"[Rec Trainer] Report saved   -> {REPORT_OUT}")


if __name__ == "__main__":
    train()
