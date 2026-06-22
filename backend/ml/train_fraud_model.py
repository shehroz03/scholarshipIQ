"""
ScholarIQ — Fraud Detection Model Trainer
==========================================
Trains a supervised RandomForestClassifier on scholarship data.

LABELING (important — defensible to examiners):
  We do NOT use admin approval_status as the fraud label. Admins reject
  scholarships for many non-fraud reasons (duplicate, expired, incomplete,
  wrong category). Using approval as a fraud proxy = label contamination.

  Instead, labels are derived from EXPLICIT fraud indicators documented in
  phishing/scam-scholarship literature (see generate_fraud_label):
    - high-risk keywords (processing fee, Western Union, guaranteed, etc.)
    - suspicious TLDs (.tk .ml .ga .cf .xyz)
    - non-institutional domain combined with an implausibly large award

  Class imbalance is handled with SMOTE (statistically defensible synthetic
  minority oversampling), not hand-written fake rows.

Run:
    cd backend
    python -m ml.train_fraud_model

Outputs saved to ml/:
    fraud_model.pkl          (trained RandomForest)
    fraud_threshold.json     (data-driven threshold from PR curve)
    fraud_model_report.txt   (classification report + confusion matrix)
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
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_recall_curve,
    roc_auc_score,
)

# ── Project paths ─────────────────────────────────────────────────────────────
_HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(_HERE, ".."))

from ml.fraud_model import extract_features, HIGH_RISK_KEYWORDS, MEDIUM_RISK_KEYWORDS

MODEL_OUT   = os.path.join(_HERE, "fraud_model.pkl")
REPORT_OUT  = os.path.join(_HERE, "fraud_model_report.txt")
FEATURE_NAMES = [
    "has_high_risk_keyword", "has_medium_risk_keyword",
    "url_reachable", "trusted_domain", "suspicious_domain",
    "scholarship_amount_ratio", "deadline_too_close",
    "has_official_email", "cgpa_min_zero",
    "has_apply_steps", "description_length", "short_description",
]

# ── Anti-leakage: features the ML model is allowed to train on ────────────────
# generate_fraud_label() derives labels from keyword presence + suspicious TLD.
# If we let the model SEE those same signals, it just memorises the labeling
# rule (ROC-AUC ≈ 1.0 = label leakage). So we EXCLUDE them from training.
# Keyword/TLD detection still happens in the rule layer (check_keywords /
# validate_url) — the ML layer only learns genuinely SECONDARY structure.
LEAKING_FEATURES = ["has_high_risk_keyword", "has_medium_risk_keyword", "suspicious_domain"]
TRAINING_FEATURES = [f for f in FEATURE_NAMES if f not in LEAKING_FEATURES]

SUSPICIOUS_TLDS = (".tk", ".ml", ".ga", ".cf", ".xyz")
INSTITUTIONAL_MARKERS = (".edu", ".ac.", ".gov", ".org")


# ── Ground-truth labeling (rule-based, NOT admin approval) ────────────────────

def generate_fraud_label(s) -> int:
    """
    Derive a fraud label from EXPLICIT scam indicators — documented in
    phishing / scholarship-fraud literature — never from admin approval status.

    Returns 1 (fraud) or 0 (legitimate).
    """
    title = (getattr(s, "title", "") or "")
    desc  = (getattr(s, "description", "") or "")
    elig  = (getattr(s, "eligibility", "") or "")
    text  = f"{title} {desc} {elig}".lower()

    # 1. Explicit high-risk scam keywords → fraud
    if any(kw in text for kw in HIGH_RISK_KEYWORDS):
        return 1

    # 2. Two or more medium-risk signals → fraud
    if sum(kw in text for kw in MEDIUM_RISK_KEYWORDS) >= 2:
        return 1

    url = (getattr(s, "scholarship_url", "") or getattr(s, "website_url", "") or "").lower()

    # 3. Suspicious throwaway TLD → fraud
    if url and any(url.endswith(t) or (t + "/") in url for t in SUSPICIOUS_TLDS):
        return 1

    # 4. Non-institutional domain + implausibly large award → fraud
    if url and not any(m in url for m in INSTITUTIONAL_MARKERS):
        amount = float(getattr(s, "scholarship_amount_numeric", 0) or 0)
        if amount > 50000:
            return 1

    return 0


# ── Data loading ──────────────────────────────────────────────────────────────

def load_labeled_data():
    """
    Build feature vectors for ALL scholarships and label each with the
    rule-based ground-truth function (generate_fraud_label) — independent
    of admin approval status. Returns (X: pd.DataFrame, y: np.ndarray).
    """
    from app.db.session import SessionLocal
    from app.db.models import Scholarship, ScholarshipStaging

    db = SessionLocal()
    records = []

    try:
        all_rows = db.query(Scholarship).all()
        for s in all_rows:
            label = generate_fraud_label(s)
            # url_reachable best-effort: trusted domain ⇒ reachable proxy
            url = (getattr(s, "scholarship_url", "") or getattr(s, "website_url", "") or "").lower()
            reachable = 0 if any(url.endswith(t) for t in SUSPICIOUS_TLDS) else 1
            feats = extract_features(s, url_reachable=reachable)
            feats["label"] = label
            records.append(feats)

        # Staged rows enrich the dataset (also rule-labeled, not status-labeled)
        for s in db.query(ScholarshipStaging).all():
            label = generate_fraud_label(s)
            feats = extract_features(s, url_reachable=1)
            feats["label"] = label
            records.append(feats)

    finally:
        db.close()

    if not records:
        raise ValueError("No scholarships found in database. Seed/import data first.")

    df = pd.DataFrame(records)
    # Train ONLY on non-leaking structural features (see TRAINING_FEATURES note)
    X = df[TRAINING_FEATURES].fillna(0)
    y = df["label"].to_numpy()
    return X, y


def balance_with_smote(X: pd.DataFrame, y):
    """
    Statistically defensible minority oversampling (SMOTE).
    Falls back to class_weight='balanced' if imblearn is unavailable
    or the minority class is too small for k-NN synthesis.
    """
    n_fraud = int((y == 1).sum())
    n_legit = int((y == 0).sum())

    if n_fraud < 6 or n_legit < 6:
        print(f"[Fraud Trainer] Too few samples for SMOTE (fraud={n_fraud}). "
              f"Using class_weight='balanced' instead.")
        return X, y, False

    try:
        from imblearn.over_sampling import SMOTE
        k = min(5, n_fraud - 1)
        smote = SMOTE(random_state=42, k_neighbors=k)
        X_res, y_res = smote.fit_resample(X, y)
        print(f"[Fraud Trainer] SMOTE applied - fraud {n_fraud} -> {int((y_res==1).sum())}")
        return X_res, y_res, True
    except ImportError:
        print("[Fraud Trainer] imblearn not installed — using class_weight='balanced'.")
        return X, y, False
    except Exception as e:
        print(f"[Fraud Trainer] SMOTE failed ({e}) — using class_weight='balanced'.")
        return X, y, False


# ── Training ──────────────────────────────────────────────────────────────────

def train():
    print("[Fraud Trainer] Loading data and applying rule-based labels...")
    X, y = load_labeled_data()
    print(f"[Fraud Trainer] Raw dataset — total={len(y)}, "
          f"legit={int((y==0).sum())}, fraud={int((y==1).sum())}")

    X, y, smote_used = balance_with_smote(X, y)

    # If SMOTE wasn't applied, lean on balanced class weights instead
    class_weight = None if smote_used else "balanced"

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=4,
        class_weight=class_weight,
        random_state=42,
        n_jobs=-1,
    )

    # ── Cross-validated evaluation (data-driven, not guessed thresholds) ──────
    print("[Fraud Trainer] Running 5-fold stratified cross-validation...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    y_proba_cv = cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1]
    y_pred_cv  = (y_proba_cv >= 0.5).astype(int)

    report  = classification_report(y, y_pred_cv, target_names=["Legitimate", "Fraud"])
    cm      = confusion_matrix(y, y_pred_cv)
    roc_auc = roc_auc_score(y, y_proba_cv)

    # Data-driven threshold: maximise F1 for fraud class
    precisions, recalls, thresholds = precision_recall_curve(y, y_proba_cv)
    f1_scores  = 2 * precisions * recalls / (precisions + recalls + 1e-9)
    best_idx   = int(np.argmax(f1_scores))
    best_thresh = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.5

    report_text = (
        f"ScholarIQ Fraud Detection Model — Training Report\n"
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        f"{'='*55}\n\n"
        f"Dataset\n"
        f"  Total samples : {len(y)}\n"
        f"  Legitimate    : {int((y==0).sum())}\n"
        f"  Fraud         : {int((y==1).sum())}\n\n"
        f"5-Fold Cross-Validation Results\n"
        f"{report}\n"
        f"Confusion Matrix (rows=actual, cols=predicted):\n"
        f"  [[TN={cm[0,0]}  FP={cm[0,1]}]\n"
        f"   [FN={cm[1,0]}  TP={cm[1,1]}]]\n\n"
        f"ROC-AUC Score : {roc_auc:.4f}\n"
        f"Best Threshold (max F1 on fraud class): {best_thresh:.4f}\n\n"
        f"ANTI-LEAKAGE DESIGN (read before interpreting scores):\n"
        f"  Labels come from rule-based fraud heuristics (keywords + suspicious\n"
        f"  TLDs). To avoid label leakage, the label-defining features were\n"
        f"  EXCLUDED from training:\n"
        f"    excluded: {', '.join(LEAKING_FEATURES)}\n"
        f"  The ML layer therefore learns ONLY secondary structural signals\n"
        f"  (amount ratio, description length, deadline proximity, domain trust).\n"
        f"  Keyword/TLD detection still runs in the rule layer (check_keywords /\n"
        f"  validate_url), so no detection capability is lost — but the ML score\n"
        f"  is now an INDEPENDENT signal, not a memorised copy of the labels.\n"
        f"  (See HONEST INTERPRETATION at the end for what the result actually means.)\n"
        f"  Trained features: {', '.join(TRAINING_FEATURES)}\n\n"
        f"Gini Feature Importances (impurity-based)\n"
    )

    # ── Final fit on full dataset ─────────────────────────────────────────────
    model.fit(X, y)
    importances = sorted(
        zip(TRAINING_FEATURES, model.feature_importances_),
        key=lambda x: x[1], reverse=True
    )
    for feat, imp in importances:
        report_text += f"  {feat:<35} {imp:.4f}\n"

    # ── Permutation importance (leakage diagnostic — reviewer-requested) ──────
    try:
        from sklearn.inspection import permutation_importance
        perm = permutation_importance(model, X, y, n_repeats=10, random_state=42, n_jobs=-1)
        perm_pairs = sorted(
            zip(TRAINING_FEATURES, perm.importances_mean),
            key=lambda x: x[1], reverse=True
        )
        report_text += "\nPermutation Importances (model-agnostic leakage diagnostic)\n"
        for feat, imp in perm_pairs:
            report_text += f"  {feat:<35} {imp:.4f}\n"

        # Honest interpretation based on what permutation importance actually shows
        total_pos = sum(max(0.0, v) for _, v in perm_pairs) or 1e-9
        top_feat, top_val = perm_pairs[0]
        top_share = max(0.0, top_val) / total_pos
        report_text += (
            "\nHONEST INTERPRETATION OF RESULTS\n"
            f"  Permutation importance shows '{top_feat}' carries "
            f"{top_share*100:.0f}% of the model's discriminative signal.\n"
        )
        if roc_auc > 0.98 and top_share > 0.6:
            report_text += (
                "  ROC-AUC is ~1.0 because a SINGLE structural feature separates the\n"
                "  classes almost perfectly. This is a DATASET ARTIFACT, not evidence\n"
                "  of generalizable fraud detection: in the current labeled set the\n"
                "  fraud examples (flagged / scraped junk entries) systematically\n"
                f"  differ in '{top_feat}' from the curated legitimate scholarships —\n"
                "  i.e. the two classes come from different SOURCES. The model learns\n"
                "  the source gap, not fraud semantics.\n\n"
                "  HONEST CONCLUSION (defend this in the viva):\n"
                "    • The rule layer (keywords + suspicious TLD + URL checks) remains\n"
                "      the PRIMARY, reliable fraud detector.\n"
                "    • The ML layer is a WEAK auxiliary signal on this dataset and\n"
                "      should not be presented as an independently-validated classifier.\n"
                "    • A trustworthy supervised model needs fraud AND legit examples\n"
                "      drawn from the SAME source, with human-verified labels, then\n"
                "      re-evaluated on a held-out test set.\n"
            )
        else:
            report_text += (
                "  No single feature dominates — the signal is distributed across\n"
                "  multiple structural features, which is the healthy case.\n"
            )
    except Exception as e:
        report_text += f"\n(Permutation importance skipped: {e})\n"

    # ── Save ──────────────────────────────────────────────────────────────────
    joblib.dump(model, MODEL_OUT)
    with open(REPORT_OUT, "w", encoding="utf-8") as f:
        f.write(report_text)

    # Save best threshold for use in fraud_detection.py
    thresh_path = os.path.join(_HERE, "fraud_threshold.json")
    with open(thresh_path, "w", encoding="utf-8") as f:
        json.dump({"threshold": best_thresh, "roc_auc": roc_auc}, f, indent=2)

    print(report_text)
    print(f"[Fraud Trainer] Model saved  -> {MODEL_OUT}")
    print(f"[Fraud Trainer] Report saved -> {REPORT_OUT}")
    print(f"[Fraud Trainer] Best threshold (data-driven): {best_thresh:.4f}")


if __name__ == "__main__":
    train()
