import sys
import os

# Add backend to path
sys.path.append(r'd:\ScholarIQ Landing Page Design\ScholarIQ Landing Page Design\backend')

from app.db.session import SessionLocal
from app.db.models import Scholarship

def check_scholarship_status():
    db = SessionLocal()
    total = db.query(Scholarship).count()
    active = db.query(Scholarship).filter(Scholarship.is_active == True).count()
    archived = db.query(Scholarship).filter(Scholarship.is_archived == True).count()
    print(f"Total: {total}")
    print(f"Active: {active}")
    print(f"Archived: {archived}")
    db.close()

if __name__ == "__main__":
    check_scholarship_status()
