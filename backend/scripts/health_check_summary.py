import os
import sys
import json
from datetime import datetime, timezone


# Add parent directory to sys.path to allow importing 'app'
# Ye line ensure karti hai ke hum backend folder se 'app' module import kar saken
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.db.session import SessionLocal
    from app.db.models import Scholarship, ScholarshipStaging, PipelineLog
except ImportError as e:
    print(f"Import Error: {e}")
    print("Tip: Make sure you are running this from the backend folder or have set PYTHONPATH.")
    sys.exit(1)

def run_health_check():
    """
    ScholarIQ Backend Health Check Summary Script.
    DB counts aur basic status print karta hai.
    """
    db = SessionLocal()
    try:
        # 1. Total Scholarships (Production Table)
        total_scholarships = db.query(Scholarship).count()
        
        # 2. Active (is_archived = False)
        # Wo scholarships jo users ko dikh rahi hain
        active_scholarships = db.query(Scholarship).filter(Scholarship.is_archived == False).count()
        
        # 3. Archived
        # Expired ya manually hide ki hui scholarships
        archived_scholarships = db.query(Scholarship).filter(Scholarship.is_archived == True).count()
        
        # 4. Staging Total
        # Ingestion pipeline se aya hua sara naya data
        total_staging = db.query(ScholarshipStaging).count()
        
        # 5. Staging Pending
        # Wo items jinpar abhi decision lena baki hai
        staging_pending = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == 'pending').count()
        
        # 6. Staging Blocked
        # Fraud detection ya manual rejection se block hue items
        staging_blocked = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == 'blocked').count()
        
        summary = {
            "status": "Healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),

            "counts": {
                "total_scholarships": total_scholarships,
                "active_scholarships": active_scholarships,
                "archived_scholarships": archived_scholarships,
                "total_staging": total_staging,
                "staging_pending": staging_pending,
                "staging_blocked": staging_blocked
            }
        }
        
        print("\n" + "="*50)
        print("   SCHOLARIQ BACKEND HEALTH CHECK SUMMARY")
        print("="*50)
        print(f"Timestamp:          {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC")

        print("-" * 50)
        print(f"Total Scholarships:  {total_scholarships}")
        print(f"  * Active:         {active_scholarships} (Dikh rahi hain)")
        print(f"  * Archived:       {archived_scholarships} (Hidden/Expired)")
        print("-" * 50)
        print(f"Total Staging:      {total_staging}")
        print(f"  * Pending:        {staging_pending} (Review baki hai)")
        print(f"  * Blocked:        {staging_blocked} (Rejected/Fraud)")
        print("="*50)
        
        # JSON output for potential monitoring tools
        print("\n[DEBUG] JSON Summary for Diagnostics:")
        print(json.dumps(summary, indent=4))
        
    except Exception as e:
        print(f"\n[!] Health Check Failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    run_health_check()
