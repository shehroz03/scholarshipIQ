import sys
import os

# Add backend to path
sys.path.append(r'd:\ScholarIQ Landing Page Design\ScholarIQ Landing Page Design\backend')

from app.db.session import SessionLocal
from app.db.models import Scholarship

def count_scholarships():
    db = SessionLocal()
    count = db.query(Scholarship).count()
    print(f"Total scholarships in database: {count}")
    db.close()

if __name__ == "__main__":
    count_scholarships()
