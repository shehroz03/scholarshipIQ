"""
Re-process the 15 Australia scholarships THROUGH the full pipeline:
1. Delete them from production (they were raw-inserted)
2. Run fraud check on each
3. Route: SAFE → auto-approved production | MEDIUM → staging | CRITICAL → blocked
4. Save PipelineLog entries for admin visibility
"""
import sys
import os
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.db import models
from app.db.models import Scholarship, University, PipelineLog, ScholarshipStaging, ReviewStatus, FraudRisk
from app.services.fraud_detection import calculate_fraud_risk

AUSTRALIA_TITLES = [
    "Melbourne International Undergraduate Scholarship",
    "Graduate Research Scholarship - University of Melbourne",
    "ANU Chancellor's International Scholarship",
    "ANU HDR Fee Remission Merit Scholarship",
    "University of Sydney International Scholarship (USydIS)",
    "Sydney Scholars Australia Scholarship",
    "UQ Masters Scholarship for International Students",
    "UQ Graduate School Scholarship (UQGSS)",
    "Monash International Merit Scholarship",
    "Monash Graduate Scholarship (MGS)",
    "UNSW International Scientia Scholarship",
    "UNSW Global Academic Award",
    "UWA Global Excellence Scholarship",
    "Adelaide Scholarship International (ASI)",
    "University of Adelaide Masters Merit Scholarship",
]

def run():
    db = SessionLocal()
    run_id = f"aus_reprocess_{int(datetime.now().timestamp())}"
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    results = {"checked": 0, "safe_approved": 0, "staged_medium": 0, "blocked_critical": 0, "errors": 0}

    print(f"[Pipeline] Starting Australia re-process... run_id={run_id}")
    print("=" * 65)

    for title in AUSTRALIA_TITLES:
        try:
            s = db.query(Scholarship).filter(Scholarship.title == title).first()
            if not s:
                print(f"  ⚠️  Not found in DB: {title[:55]}")
                continue

            # --- Step 1: Run Fraud Check ---
            fraud = calculate_fraud_risk(s)
            s.fraud_risk_score  = fraud["risk_score"]
            s.fraud_risk_level  = fraud["risk_level"]
            s.fraud_reasons     = json.dumps(fraud["reasons"])
            s.last_fraud_check  = now
            s.is_suspicious     = fraud["auto_flag"]
            results["checked"] += 1

            # --- Step 2: Route Decision ---
            if fraud["risk_level"] == "CRITICAL":
                # Block it — move out of active production
                s.is_active        = False
                s.approval_status  = "rejected"
                results["blocked_critical"] += 1
                action_msg = f"CRITICAL fraud blocked. Score={fraud['risk_score']}. Reasons: {', '.join(fraud['reasons'][:2])}"
                print(f"  ❌ BLOCKED  : {title[:50]} (score={fraud['risk_score']})")

            elif fraud["risk_level"] in ["MEDIUM", "HIGH"]:
                # Demote to staging for auto-verify bot
                s.is_active       = False
                s.approval_status = "pending"
                results["staged_medium"] += 1
                action_msg = f"MEDIUM/HIGH risk. Score={fraud['risk_score']}. Sent to bot review. Reasons: {', '.join(fraud['reasons'][:2])}"
                print(f"  🔍 STAGED   : {title[:50]} (score={fraud['risk_score']})")

            else:
                # SAFE — keep approved, confirm active
                s.is_active       = True
                s.approval_status = "approved"
                results["safe_approved"] += 1
                action_msg = f"SAFE. Score={fraud['risk_score']}. Auto-approved."
                print(f"  ✅ APPROVED : {title[:50]} (score={fraud['risk_score']})")

            # --- Step 3: Log for Admin ---
            db.add(PipelineLog(
                event_type      = "fraud_gate",
                action_taken    = "approved" if fraud["risk_level"] == "SAFE" else ("blocked" if fraud["risk_level"] == "CRITICAL" else "staged"),
                scholarship_title = s.title,
                official_url    = s.scholarship_url,
                message         = action_msg,
                triggered_by    = "reprocess_pipeline",
                pipeline_run_id = run_id,
            ))

        except Exception as e:
            results["errors"] += 1
            print(f"  ⚠️  Error on '{title[:45]}': {e}")

    db.commit()

    # --- Summary log entry ---
    db.add(PipelineLog(
        event_type    = "run_summary",
        action_taken  = "success",
        message       = (
            f"Australia reprocess complete. "
            f"Checked={results['checked']} | "
            f"Approved={results['safe_approved']} | "
            f"Staged={results['staged_medium']} | "
            f"Blocked={results['blocked_critical']} | "
            f"Errors={results['errors']}"
        ),
        triggered_by    = "reprocess_pipeline",
        pipeline_run_id = run_id,
    ))
    db.commit()
    db.close()

    print("=" * 65)
    print(f"[Pipeline] Done!")
    print(f"  ✅ SAFE/Approved : {results['safe_approved']}")
    print(f"  🔍 MEDIUM/Staged : {results['staged_medium']}")
    print(f"  ❌ CRITICAL Block: {results['blocked_critical']}")
    print(f"  ⚠️  Errors        : {results['errors']}")
    print(f"\n  Admin panel → Data Pipeline tab mein logs dekh saktay hain.")

if __name__ == "__main__":
    run()
