import sys
import os
from datetime import datetime, timezone

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import SessionLocal
from app.db.models import Scholarship, ScholarshipStaging

def archive_expired():
    db = SessionLocal()
    today = datetime.now(timezone.utc)
    
    print(f"--- ARCHIVE RUN: {today.isoformat()} ---")
    
    # 1. Process Main Scholarships
    expired_prod = db.query(Scholarship).filter(
        Scholarship.deadline != None,
        Scholarship.deadline < today,
        Scholarship.is_archived == False
    ).all()
    
    archived_count = 0
    for s in expired_prod:
        s.is_archived = True
        s.archived_at = today
        s.archive_reason = "expired"
        archived_count += 1
        print(f"Archived Production: {s.id} - {s.title} (Deadline: {s.deadline})")
        
    # 2. Process Staging (Optional but recommended)
    expired_staging = db.query(ScholarshipStaging).filter(
        ScholarshipStaging.deadline != None,
        ScholarshipStaging.deadline < today,
        ScholarshipStaging.is_archived == False
    ).all()
    
    staged_archived_count = 0
    for ss in expired_staging:
        ss.is_archived = True
        ss.archived_at = today
        ss.archive_reason = "expired"
        staged_archived_count += 1
        print(f"Archived Staging: {ss.id} - {ss.title} (Deadline: {ss.deadline})")

    db.commit()
    db.close()
    
    print("\n--- SUMMARY ---")
    print(f"Production Scholarships: Found {len(expired_prod)} expired, archived {archived_count}.")
    print(f"Staging Records: Found {len(expired_staging)} expired, archived {staged_archived_count}.")
    print("Done.")

if __name__ == "__main__":
    archive_expired()
