from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.db.models import Notification, Scholarship, User, Application, saved_scholarships
from app.services.recommendation import get_match_score
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session, 
        user_id: int, 
        type: str, 
        title: str, 
        message: str, 
        scholarship_id: int = None,
        action_url: str = None
    ):
        """Helper to create and save a notification."""
        try:
            new_notif = Notification(
                user_id=user_id,
                scholarship_id=scholarship_id,
                type=type,
                title=title,
                message=message,
                action_url=action_url,
                is_read=False
            )
            db.add(new_notif)
            db.commit()
            return new_notif
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            db.rollback()
            return None

    @staticmethod
    def check_deadlines(db: Session):
        """Run daily to notify users about upcoming deadlines of saved scholarships."""
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        # Intervals to remind: 14 days, 7 days, 3 days
        remind_days = [14, 7, 3]
        
        for days in remind_days:
            target_date = now_naive + timedelta(days=days)
            # Find scholarships with deadline on target_date (ignoring time)
            scholarships = db.query(Scholarship).filter(
                Scholarship.deadline >= target_date.replace(hour=0, minute=0, second=0),
                Scholarship.deadline <= target_date.replace(hour=23, minute=59, second=59)
            ).all()

            for s in scholarships:
                # Find users who saved this scholarship
                # Note: Assuming relationship 'saved_by' exists or query many-to-many
                for user in s.saved_by:
                    NotificationService.create_notification(
                        db,
                        user_id=user.id,
                        scholarship_id=s.id,
                        type="deadline_reminder",
                        title="⏳ Deadline Approaching!",
                        message=f"Only {days} days left to apply for '{s.title}'. Don't miss out!",
                        action_url=f"/detail/{s.id}"
                    )

    @staticmethod
    def notify_new_matches(db: Session, scholarship: Scholarship):
        """Triggered when a new scholarship is added to notify high-match users."""
        # This is a simplified version. Ideally, you'd filter users by target country/degree.
        # For now, let's check active users with similar target interests.
        users = db.query(User).filter(
            User.is_active == True,
            User.target_country == scholarship.country
        ).all()

        for user in users:
            # Check match score using existing logic
            score_data = get_match_score(user, scholarship)
            if score_data["score"] >= 80:
                NotificationService.create_notification(
                    db,
                    user_id=user.id,
                    scholarship_id=scholarship.id,
                    type="new_match",
                    title="✨ New Smart Match Found!",
                    message=f"We found a new scholarship '{scholarship.title}' that matches {score_data['score']}% of your profile.",
                    action_url=f"/detail/{scholarship.id}"
                )

    @staticmethod
    def nudge_incomplete_applications(db: Session):
        """Nudge users with 'Saved' status applications to move to 'Applied'."""
        # Applications created > 3 days ago but still 'Saved'
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        three_days_ago = now_naive - timedelta(days=3)
        pending_apps = db.query(Application).filter(
            Application.status == "Saved",
            Application.applied_date <= three_days_ago
        ).all()

        for app in pending_apps:
            # Check if we already nudged them recently (prevent spam)
            # Simplified: just nudge once
            NotificationService.create_notification(
                db,
                user_id=app.user_id,
                scholarship_id=app.scholarship_id,
                type="application_nudge",
                title="📝 Complete your application?",
                message=f"You started working on '{app.scholarship.title}'. Need help with your SOP or CV to finish it?",
                action_url="/applications"
            )
