import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, engine
from app.db import models

def purge_all_test_data():
    db = SessionLocal()
    try:
        print("Starting Complete Database Purge (Removing all test emails, teachers, courses, reviews)...")
        
        # Child tables first to respect foreign keys
        db.query(models.TeacherReview).delete()
        db.query(models.Enrollment).delete()
        db.query(models.QuizAttempt).delete()
        db.query(models.QuizQuestion).delete()
        db.query(models.Quiz).delete()
        db.query(models.LiveClass).delete()
        db.query(models.Lesson).delete()
        db.query(models.MeetingLink).delete()
        db.query(models.Course).delete()
        db.query(models.TeacherProfile).delete()
        
        db.query(models.Notification).delete()
        db.query(models.Application).delete()
        db.query(models.ChatMessage).delete()
        db.query(models.ChatSession).delete()
        db.query(models.ConsultantMessage).delete()
        db.query(models.UserScholarshipInteraction).delete()
        db.query(models.NewsletterSubscription).delete()
        
        # Visa module
        db.query(models.VisaChecklistItem).delete()
        db.query(models.VisaChecklist).delete()
        db.query(models.VisaAISession).delete()
        db.query(models.VisaProfile).delete()
        
        # Parent table
        users_deleted = db.query(models.User).delete()
        
        db.commit()
        print(f"Successfully purged all test data! Removed {users_deleted} user/teacher accounts and associated records.")
        print("The database is now 100% clean and ready for real production usage!")
    except Exception as e:
        db.rollback()
        print(f"Error during purge: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    purge_all_test_data()
