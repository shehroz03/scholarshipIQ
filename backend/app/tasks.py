import datetime
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
    print(f"[{datetime.datetime.now()}] 🔍 Checking for upcoming scholarship deadlines (T-7 days)...")
    db: Session = SessionLocal()
    
    try:
        # Calculate target date (7 days from now)
        today = datetime.datetime.now().date()
        target_date = today + datetime.timedelta(days=7)
        
        # Query scholarships expiring on target_date
        upcoming_scholarships = db.query(Scholarship).filter(
            Scholarship.deadline >= datetime.datetime.combine(target_date, datetime.time.min),
            Scholarship.deadline <= datetime.datetime.combine(target_date, datetime.time.max)
        ).all()

        if not upcoming_scholarships:
            print(f"[{datetime.datetime.now()}] ✅ No scholarships found expiring on {target_date}.")
            return

        fm = FastMail(conf)

        for scholarship in upcoming_scholarships:
            # Audit: Scholarship table uses 'saved_by' relationship
            users_to_notify = [u for u in scholarship.saved_by if u.is_active]
            
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
                    subject=f"⚠️ 7 Days Left: {scholarship.title} Deadline",
                    recipients=[user.email],
                    body=email_body,
                    subtype=MessageType.html
                )

                try:
                    await fm.send_message(message)
                    print(f"📧 Email sent to {user.email} for '{scholarship.title}'")
                except Exception as e:
                    print(f"❌ Failed to send email to {user.email}: {e}")

    except Exception as e:
        print(f"🚨 Critical error in deadline scheduler: {e}")
    finally:
        db.close()

# --- 3. SCHEDULER SETUP ---
scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(check_deadlines_and_notify, 'cron', hour=9, minute=0)
    scheduler.start()
    print("🚀 [Scheduler] Started! Daily deadline check scheduled for 09:00 AM.")
