from datetime import datetime, timezone, timedelta, time as dt_time
import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import User, Scholarship
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.services.email import conf, send_deadline_email

# --- 2. DEADLINE CHECK LOGIC ---
async def check_deadlines_and_notify():
    """
    Checks for scholarships where the deadline is exactly 7 days from today
    and notifies users who have saved them.
    """
    print(f"[{datetime.now()}] Checking for upcoming scholarship deadlines (T-7 days)...")
    db: Session = SessionLocal()
    
    try:
        # Calculate target date (7 days from now)
        today = datetime.now().date()
        target_date = today + timedelta(days=7)
        
        # Query scholarships expiring on target_date
        upcoming_scholarships = db.query(Scholarship).filter(
            Scholarship.deadline >= datetime.combine(target_date, dt_time.min),
            Scholarship.deadline <= datetime.combine(target_date, dt_time.max)
        ).all()


        if not upcoming_scholarships:
            print(f"[{datetime.now()}] No scholarships found expiring on {target_date}.")
            return

        fm = FastMail(conf)

        for scholarship in upcoming_scholarships:
            # Audit: Scholarship table uses 'saved_by' relationship
            # Ensure we only send to active users who have email_notifications turned ON
            users_to_notify = [u for u in scholarship.saved_by if u.is_active and getattr(u, 'email_notifications', True)]
            
            for user in users_to_notify:
                email_body = f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #1e3a8a;">Deadline Alert! ⏳</h2>
                    <p>Dear <strong>{user.full_name or user.email}</strong>,</p>
                    <p>This is a reminder that the scholarship you saved, <strong>{scholarship.title}</strong>, has its deadline in exactly <strong>7 days</strong>.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p><strong>Deadline:</strong> {target_date.strftime('%d %B, %Y')}</p>
                    <p>Don't miss this opportunity! Make sure to complete and submit your application on time.</p>
                    <div style="margin-top: 30px;">
                        <a href="http://localhost:5173/#detail?id={scholarship.id}" 
                           style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                           View Scholarship Details
                        </a>
                    </div>
                    <p style="margin-top: 40px; font-size: 12px; color: #64748b;">
                        You received this email because you saved this scholarship on ScholarIQ.<br>
                        © 2025 ScholarIQ. All rights reserved.
                    </p>
                </div>
                """

                message = MessageSchema(
                    subject=f"7 Days Left: {scholarship.title} Deadline",
                    recipients=[user.email],
                    body=email_body,
                    subtype=MessageType.html
                )

                try:
                    await fm.send_message(message)
                    print(f"Email sent to {user.email} for '{scholarship.title}'")
                except Exception as e:
                    print(f"Failed to send email to {user.email}: {e}")

    except Exception as e:
        print(f"Critical error in deadline scheduler: {e}")
    finally:
        db.close()

# --- 3. WEEKLY MODEL RETRAIN ---
def retrain_model():
    """
    Retrains the RandomForest scholar_match model using fresh DB data.
    Runs every Sunday at 2:00 AM.
    """
    import subprocess
    import sys
    import os
    
    try:
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "train_scholar_match.py")
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True, text=True, timeout=300
        )
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        # Extract accuracy from output
        acc_line = ""
        for line in result.stdout.splitlines():
            if "Accuracy" in line:
                acc_line = line.strip()
                break
        print(f"[Scheduler] Model retrained on {now}. {acc_line}")
        if result.returncode != 0:
            print(f"[Scheduler] Retrain stderr: {result.stderr[:500]}")
        else:
            # Reload scorer in place
            try:
                import importlib
                import ml.scorer as scorer_mod
                import joblib
                model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "scholar_match.pkl")
                if os.path.exists(model_path):
                    scorer_mod.model = joblib.load(model_path)
                    print(f"[Scheduler] ML model hot-reloaded successfully.")
            except Exception as reload_err:
                print(f"[Scheduler] Hot-reload warning: {reload_err}")
    except Exception as e:
        print(f"[Scheduler] Retrain failed: {e}")


# --- 4. DAILY FRAUD SCAN ---
async def daily_fraud_scan():
    """Daily fraud scan job at 03:00 AM"""
    print(f"[{datetime.now()}] Starting daily fraud scan...")
    db: Session = SessionLocal()
    from app.services.fraud_detection import calculate_fraud_risk
    import json
    
    try:
        # Prioritize un-scanned scholarships
        scholarships = db.query(Scholarship).filter(
            Scholarship.last_fraud_check == None
        ).all()
        
        # If everything is already checked once, re-scan older ones or simply all
        if not scholarships:
             scholarships = db.query(Scholarship).all()
             
        flagged_count = 0
        for s in scholarships:
            result = calculate_fraud_risk(s)
            
            # Update scholarship fields
            s.fraud_risk_score = result["risk_score"]
            s.fraud_risk_level = result["risk_level"]
            s.fraud_reasons = json.dumps(result["reasons"])
            s.last_fraud_check = datetime.now(timezone.utc).replace(tzinfo=None)
            
            if result["auto_flag"]:
                s.is_suspicious = True
                s.is_active = False # Hide from public
                flagged_count += 1
                
        db.commit()
        print(f"[{datetime.now()}] Fraud scan complete: {len(scholarships)} checked, {flagged_count} flagged.")
    except Exception as e:
        print(f"Critical error in fraud scan task: {e}")
    finally:
        db.close()


# --- 5. AI AUTO-UPDATE SCHOLARSHIPS (every 3 days) ---
async def auto_update_scholarship_data():
    """Uses Serper + GPT-4o to detect and apply scholarship changes every 3 days."""
    print(f"[{datetime.now()}] Starting AI scholarship auto-update...")
    db: Session = SessionLocal()
    try:
        from app.services.scholarship_auto_updater import auto_update_scholarships
        result = await auto_update_scholarships(db, batch_size=15)
        print(f"[AutoUpdater] Checked: {result['checked']} | Updated: {result['updated']} | Errors: {result['errors']}")
    except Exception as e:
        print(f"[AutoUpdater] Task error: {e}")
    finally:
        db.close()


# --- 6. DAILY PIPELINE ---
async def daily_scrape_and_import():
    db: Session = SessionLocal()
    from app.services.scraper_service import scrape_and_import
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info("Daily pipeline started...")
        results = await scrape_and_import(db, triggered_by="auto")
        logger.info(f"Pipeline complete: {results['inserted']} new, {results['skipped_fraud']} fraud blocked")
    except Exception as e:
        logger.error(f"Pipeline task error: {e}")
    finally:
        db.close()

async def process_smart_notifications():
    """
    Daily task to generate in-app notifications for:
    - Upcoming deadlines (14, 7, 3 days)
    - Incomplete application nudges
    """
    print(f"[{datetime.now()}] Processing Smart Notifications...")
    db: Session = SessionLocal()
    from app.services.notification_service import NotificationService
    try:
        # Check for upcoming deadlines (14, 7, 3 days)
        NotificationService.check_deadlines(db)
        # Nudge users about incomplete applications
        NotificationService.nudge_incomplete_applications(db)
        print(f"[{datetime.now()}] Smart Notifications processed.")
    except Exception as e:
        print(f"Error in smart notifications task: {e}")
    finally:
        db.close()

# --- 7. SCHEDULER SETUP ---
scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(check_deadlines_and_notify, 'cron', hour=9, minute=0)
    scheduler.add_job(process_smart_notifications, 'cron', hour=10, minute=0)
    scheduler.add_job(retrain_model, 'cron', day_of_week='sun', hour=2, minute=0)
    scheduler.add_job(daily_fraud_scan, 'cron', hour=3, minute=0)
    scheduler.add_job(daily_scrape_and_import, 'cron', hour=3, minute=0)
    scheduler.add_job(auto_update_scholarship_data, 'interval', days=3, start_date=datetime.now().replace(hour=4, minute=0, second=0, microsecond=0))
    scheduler.start()
    print("[Scheduler] Started! Daily deadline check @ 09:00 AM | Weekly retrain @ Sunday 02:00 AM | Fraud & Pipeline @ 03:00 AM | AI Auto-Update every 3 days @ 04:00 AM.")
