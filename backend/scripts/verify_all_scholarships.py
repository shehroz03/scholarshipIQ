"""
Verify ALL existing scholarships through the bot pipeline:
1. Fresh fraud check on every scholarship
2. SAFE (<=29)   -> keep approved + active
3. MEDIUM (30-39)-> keep approved, flag for monitoring
4. HIGH (40-59)  -> mark as pending (admin review needed)
5. CRITICAL (60+)-> deactivate + reject
6. Reset last_auto_checked = NULL so auto-updater picks them up fresh
7. Log everything to PipelineLog for admin visibility
"""
import sys
import os
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.db import models
from app.services.fraud_detection import calculate_fraud_risk

def run():
    db = SessionLocal()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    run_id = f"bulk_verify_{int(datetime.now().timestamp())}"

    # Fetch ALL scholarships (not archived)
    scholarships = db.query(models.Scholarship).filter(
        models.Scholarship.is_archived == False
    ).all()

    total = len(scholarships)
    print(f"{'='*65}")
    print(f"[BotVerify] Starting bulk verification of {total} scholarships...")
    print(f"[BotVerify] run_id: {run_id}")
    print(f"{'='*65}")

    results = {
        "total": total,
        "safe_approved": 0,
        "medium_approved": 0,
        "high_pending": 0,
        "critical_rejected": 0,
        "errors": 0,
    }

    for s in scholarships:
        try:
            fraud = calculate_fraud_risk(s)
            score = fraud["risk_score"]
            level = fraud["risk_level"]
            reasons = fraud["reasons"]

            # Update fraud fields on every scholarship
            s.fraud_risk_score  = score
            s.fraud_risk_level  = level
            s.fraud_reasons     = json.dumps(reasons)
            s.last_fraud_check  = now
            s.auto_flagged      = fraud.get("auto_flag", False)
            s.is_suspicious     = fraud.get("auto_flag", False)

            # Reset auto-check so updater picks it up fresh
            s.last_auto_checked = None

            # --- Route Decision ---
            if score <= 29:
                s.approval_status = "approved"
                s.is_active       = True
                results["safe_approved"] += 1
                action = f"✅ SAFE      (score={score:4.1f})"

            elif score <= 39:
                s.approval_status = "approved"
                s.is_active       = True
                results["medium_approved"] += 1
                action = f"⚠️  MEDIUM    (score={score:4.1f}) — approved w/ monitoring"

            elif score <= 59:
                s.approval_status = "pending"
                s.is_active       = False   # hidden from students until admin checks
                results["high_pending"] += 1
                action = f"🔍 HIGH      (score={score:4.1f}) — needs admin review"

            else:
                s.approval_status = "rejected"
                s.is_active       = False
                results["critical_rejected"] += 1
                action = f"❌ CRITICAL  (score={score:4.1f}) — deactivated"

            # Pipeline log entry
            db.add(models.PipelineLog(
                event_type        = "auto_verify",
                action_taken      = s.approval_status,
                scholarship_title = s.title,
                official_url      = s.scholarship_url,
                message           = (
                    f"[bulk_verify] {action.strip()} | "
                    f"Reasons: {', '.join(reasons[:2]) if reasons else 'none'}"
                ),
                triggered_by      = "bulk_verify_script",
                pipeline_run_id   = run_id,
            ))

            print(f"  {action}  | {s.title[:52]}")

        except Exception as e:
            results["errors"] += 1
            print(f"  ⚠️  ERROR on '{s.title[:45]}': {e}")

    # Commit all changes
    db.commit()

    # Summary log
    db.add(models.PipelineLog(
        event_type      = "run_summary",
        action_taken    = "success",
        message         = (
            f"Bulk verify complete. "
            f"Total={results['total']} | "
            f"SAFE/approved={results['safe_approved']} | "
            f"MEDIUM/approved={results['medium_approved']} | "
            f"HIGH/pending={results['high_pending']} | "
            f"CRITICAL/rejected={results['critical_rejected']} | "
            f"Errors={results['errors']}"
        ),
        triggered_by    = "bulk_verify_script",
        pipeline_run_id = run_id,
    ))
    db.commit()
    db.close()

    print(f"\n{'='*65}")
    print(f"[BotVerify] ✅ Done!")
    print(f"  ✅ SAFE   → approved (visible to students) : {results['safe_approved']}")
    print(f"  ⚠️  MEDIUM → approved with monitoring       : {results['medium_approved']}")
    print(f"  🔍 HIGH   → pending  (hidden, admin review) : {results['high_pending']}")
    print(f"  ❌ CRITICAL → rejected + deactivated        : {results['critical_rejected']}")
    print(f"  ⚠️  Errors                                   : {results['errors']}")
    print(f"\n  ✅ last_auto_checked reset — auto-updater will now")
    print(f"     pick ALL scholarships in next 4-day cycle (6 per run).")
    print(f"\n  Admin panel → Pipeline Reports tab mein results dekhen.")
    print(f"{'='*65}")

if __name__ == "__main__":
    run()
