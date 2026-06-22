"""
ScholarIQ Auto-Verify Service
==============================
Processes ALL staged scholarships through the verification bot.

Decision logic (by fraud risk score):
- SAFE   (score 0-29)  : eligible for auto-approve → promote to production
- MEDIUM (score 30-49) : Admin review queue → stays pending for admin
- HIGH/CRITICAL (>=50) : Auto-reject → stays in staging (admin can override)

A SAFE item is only auto-approved if it ALSO passes pre-promotion gates:
  1. fresh fraud re-check (never trusts a stale score)
  2. not a duplicate of an existing live scholarship
  3. a usable application/website URL
  4. deadline is missing or still in the future (no expired promotions)
Items that fail a gate are routed to admin review instead of being published.
Admin can always override any decision via the Staged Review Queue tab.
"""

import json
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import ScholarshipStaging, Scholarship, University, PipelineLog, ReviewStatus


AUTO_VERIFY_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data", "auto_verify_log.json"
)

# Risk-score thresholds
AUTO_APPROVE_SAFE_MAX  = 29   # score <= 29  → SAFE, eligible for auto-approve
ADMIN_REVIEW_MAX       = 49   # score 30-49  → MEDIUM, send to admin review queue
AUTO_REJECT_MIN_SCORE  = 50   # score >= 50  → HIGH/CRITICAL, auto-reject


def _is_duplicate(db: Session, staged: ScholarshipStaging) -> bool:
    """
    True if a live scholarship already exists with the same URL, or the same
    (normalised title + country). Prevents the bot from publishing duplicates.
    """
    url = (staged.scholarship_url or "").strip().lower()
    if url:
        existing = (
            db.query(Scholarship)
            .filter(func.lower(Scholarship.scholarship_url) == url)
            .first()
        )
        if existing:
            return True

    title = (staged.title or "").strip().lower()
    if title:
        existing = (
            db.query(Scholarship)
            .filter(
                func.lower(Scholarship.title) == title,
                func.lower(func.coalesce(Scholarship.country, "")) == (staged.country or "").strip().lower(),
            )
            .first()
        )
        if existing:
            return True
    return False


def _url_is_usable(staged: ScholarshipStaging) -> bool:
    """
    Lightweight liveness check before publishing. A reachable HTTP(S) URL is
    required; we don't want to push dead links live. Network errors are treated
    as 'not usable' so the item goes to admin review rather than production.
    """
    url = (staged.scholarship_url or staged.website_url or "").strip()
    if not url or not url.lower().startswith(("http://", "https://")):
        return False
    try:
        import requests
        resp = requests.head(url, timeout=5, allow_redirects=True)
        if resp.status_code >= 400:
            # Some servers reject HEAD — retry once with GET
            resp = requests.get(url, timeout=6, allow_redirects=True, stream=True)
        return resp.status_code < 400
    except Exception:
        return False


def _deadline_ok(staged: ScholarshipStaging) -> bool:
    """True if deadline is missing (rolling) or still in the future."""
    if not staged.deadline:
        return True
    try:
        dl = staged.deadline
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        dl_naive = dl.replace(tzinfo=None) if getattr(dl, "tzinfo", None) else dl
        return dl_naive >= now
    except Exception:
        return True


def _load_log() -> list:
    if os.path.exists(AUTO_VERIFY_LOG_PATH):
        try:
            with open(AUTO_VERIFY_LOG_PATH) as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_log(entries: list):
    os.makedirs(os.path.dirname(AUTO_VERIFY_LOG_PATH), exist_ok=True)
    existing = _load_log()
    combined = (existing + entries)[-500:]  # keep last 500
    with open(AUTO_VERIFY_LOG_PATH, "w") as f:
        json.dump(combined, f, indent=2)


def _promote_to_production(db: Session, staged: ScholarshipStaging) -> Scholarship:
    """Promotes a staged scholarship to the live production table."""
    uni = db.query(University).filter(University.id == staged.university_id).first()
    if not uni and staged.university_name_raw:
        uni = db.query(University).filter(University.name == staged.university_name_raw).first()

    new_s = Scholarship(
        title=staged.title,
        university_id=uni.id if uni else None,
        country=staged.country,
        city=staged.city,
        description=staged.description,
        degree_level=staged.degree_level,
        field_of_study=staged.field_of_study,
        eligibility=staged.eligibility,
        duration_text=staged.duration_text,
        deadline=staged.deadline,
        scholarship_url=staged.scholarship_url,
        website_url=staged.website_url,
        currency=staged.currency,
        funding_type=staged.funding_type,
        amount=staged.amount,
        scholarship_amount_numeric=staged.scholarship_amount_numeric,
        scholarship_amount_value=staged.scholarship_amount_value,
        tuition_fee_numeric=staged.tuition_fee_numeric,
        tuition_fee_per_year=staged.tuition_fee_per_year,
        min_cgpa=staged.min_cgpa,
        min_ielts=staged.min_ielts,
        min_toefl=staged.min_toefl,
        is_suspicious=False,
        fraud_risk_score=staged.fraud_risk_score,
        fraud_risk_level=staged.fraud_risk_level,
        fraud_reasons=staged.fraud_reasons,
        last_fraud_check=datetime.now(timezone.utc).replace(tzinfo=None),
        is_active=True,
        approval_status="approved",
        tuition_verified="verified",
        scholarship_verified="verified",
        has_separate_form=True,
        application_type="direct_form",
    )
    db.add(new_s)
    return new_s


def process_staged_scholarships(db: Session, batch_size: int = 50) -> dict:
    """
    Main auto-verify function.
    1. Re-runs fraud check on each staged item (fresh re-evaluation)
    2. SAFE (<=29)   → auto-approve → promote to production + notify users
    3. MEDIUM (30-39)→ approve with monitoring note
    4. HIGH (>=40)   → auto-reject → stays in staging for admin
    Called by scheduler 30 min after scrape pipeline.
    """
    from app.services.fraud_detection import calculate_fraud_risk

    print(f"[AutoVerify] Starting auto-verification of staged scholarships...")

    pending = db.query(ScholarshipStaging).filter(
        ScholarshipStaging.review_status == ReviewStatus.PENDING
    ).limit(batch_size).all()

    if not pending:
        print("[AutoVerify] No pending staged scholarships found.")
        return {"processed": 0, "approved": 0, "rejected": 0}

    approved_count = 0
    rejected_count = 0
    log_entries = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for staged in pending:
        try:
            # --- Step 1: ALWAYS run a fresh fraud re-check (never trust stale score) ---
            fresh_fraud = calculate_fraud_risk(staged)
            score = fresh_fraud["risk_score"]
            level = fresh_fraud["risk_level"]
            reasons = fresh_fraud["reasons"]
            staged.fraud_risk_score = score
            staged.fraud_risk_level = level
            staged.fraud_reasons = json.dumps(reasons)

            # --- Step 2: Base decision by risk score ---
            if score <= AUTO_APPROVE_SAFE_MAX:
                decision = "approved"
                decision_label = f"SAFE (score={score}) — auto-approved"
            elif score <= ADMIN_REVIEW_MAX:
                decision = "admin_review"
                decision_label = f"MEDIUM risk (score={score}) — sent to admin review queue"
            else:
                decision = "rejected"
                decision_label = f"HIGH/CRITICAL risk (score={score}, level={level}) — auto-rejected"

            # --- Step 3: Pre-promotion gates (only for SAFE auto-approve) ---
            # A clean fraud score is necessary but not sufficient to publish.
            if decision == "approved":
                gate_fail = None
                if _is_duplicate(db, staged):
                    gate_fail = "duplicate of existing live scholarship"
                elif not _deadline_ok(staged):
                    gate_fail = "deadline already passed"
                elif not _url_is_usable(staged):
                    gate_fail = "application URL not reachable"

                if gate_fail:
                    decision = "admin_review"
                    decision_label = f"SAFE (score={score}) but held for admin: {gate_fail}"
                    reasons = reasons + [f"Auto-verify gate: {gate_fail}"]

            confidence = round((1 - score / 100) * 100, 1)

            log_entry = {
                "staged_id": staged.id,
                "title": staged.title,
                "university": staged.university_name_raw,
                "country": staged.country,
                "fraud_score": score,
                "fraud_level": level,
                "decision": decision,
                "decision_label": decision_label,
                "confidence": f"{confidence}%",
                "reasons": reasons,
                "decided_at": now.isoformat(),
                "decided_by": "auto_verify_bot"
            }

            if decision == "approved":
                try:
                    prod_s = _promote_to_production(db, staged)
                    staged.review_status = "approved"
                    approved_count += 1
                    log_entry["action"] = "promoted_to_production"
                    db.add(PipelineLog(
                        event_type="auto_verify",
                        action_taken="approved",
                        scholarship_title=staged.title,
                        official_url=staged.scholarship_url,
                        message=f"{decision_label}. Confidence={confidence}%. Promoted to production.",
                        triggered_by="auto_verify_bot"
                    ))
                    # Notify matching users
                    try:
                        from app.services.notification_service import NotificationService
                        NotificationService.notify_new_matches(db, prod_s)
                    except Exception:
                        pass
                    print(f"[AutoVerify] ✅ APPROVED: {staged.title[:50]} ({decision_label})")
                except Exception as e:
                    log_entry["action"] = f"promote_failed: {str(e)}"
                    print(f"[AutoVerify] ⚠️ Promote failed for {staged.title}: {e}")
            elif decision == "admin_review":
                # Keep review_status = "pending" so it shows in admin review queue
                log_entry["action"] = "sent_to_admin_review"
                db.add(PipelineLog(
                    event_type="auto_verify",
                    action_taken="admin_review",
                    scholarship_title=staged.title,
                    official_url=staged.scholarship_url,
                    message=f"{decision_label}. Admin must verify URL manually.",
                    triggered_by="auto_verify_bot"
                ))
                print(f"[AutoVerify] 🔍 ADMIN REVIEW: {staged.title[:50]} ({decision_label})")
            else:
                staged.review_status = "rejected"
                rejected_count += 1
                log_entry["action"] = "auto_rejected"
                db.add(PipelineLog(
                    event_type="auto_verify",
                    action_taken="rejected",
                    scholarship_title=staged.title,
                    official_url=staged.scholarship_url,
                    message=f"{decision_label}. Reasons: {', '.join(reasons[:3])}",
                    triggered_by="auto_verify_bot"
                ))
                print(f"[AutoVerify] ❌ REJECTED: {staged.title[:50]} ({decision_label})")

            log_entries.append(log_entry)

        except Exception as e:
            print(f"[AutoVerify] ⚠️ Error on '{staged.title[:45]}': {e}")
            log_entries.append({"staged_id": staged.id, "title": staged.title, "error": str(e), "decided_at": now.isoformat()})

    db.commit()
    _save_log(log_entries)

    # If anything was published, refresh the chatbot's RAG embedding cache so
    # the new scholarships are immediately discoverable in chat.
    if approved_count > 0:
        try:
            from app.services import embedding_cache
            embedding_cache.warm_up()
            print(f"[AutoVerify] Embedding cache refreshed after {approved_count} promotions.")
        except Exception as e:
            print(f"[AutoVerify] Cache refresh skipped: {e}")

    result = {
        "processed": len(pending),
        "approved": approved_count,
        "rejected": rejected_count,
        "run_at": now.isoformat()
    }
    print(f"[AutoVerify] Done. Processed: {len(pending)} | Approved: {approved_count} | Rejected: {rejected_count}")
    return result


def get_auto_verify_log(limit: int = 100) -> list:
    """Returns the auto-verification log for admin dashboard."""
    entries = _load_log()
    return sorted(entries, key=lambda x: x.get("decided_at", ""), reverse=True)[:limit]


def get_auto_verify_stats(db: Session) -> dict:
    """Returns summary stats for admin dashboard."""
    from sqlalchemy import func
    total_staged = db.query(ScholarshipStaging).count()
    pending = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == ReviewStatus.PENDING).count()
    auto_approved = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == "approved").count()
    auto_rejected = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == "rejected").count()
    blocked = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == ReviewStatus.BLOCKED).count()

    return {
        "total_staged": total_staged,
        "pending_review": pending,
        "auto_approved": auto_approved,
        "auto_rejected": auto_rejected,
        "blocked_critical": blocked,
    }
