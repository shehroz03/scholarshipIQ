import sys
import os
from datetime import datetime, timezone, timedelta

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models import User

def upgrade_user(email, plan='premium', days=30):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return
        
        user.subscription_plan = plan
        user.subscription_started = datetime.now(timezone.utc)
        user.subscription_expires = datetime.now(timezone.utc) + timedelta(days=days)
        
        db.commit()
        print(f"Successfully upgraded {email} to {plan} for {days} days.")
        print(f"Subscription expires on: {user.subscription_expires}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upgrade_user_manual.py <email> [plan] [days]")
        sys.exit(1)
    
    email = sys.argv[1]
    plan = sys.argv[2] if len(sys.argv) > 2 else 'premium'
    days = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    upgrade_user(email, plan, days)
