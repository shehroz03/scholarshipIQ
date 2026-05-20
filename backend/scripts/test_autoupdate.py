import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.db.session import SessionLocal
from app.services.scholarship_auto_updater import auto_update_scholarships
from app.db.models import Scholarship

async def test():
    db = SessionLocal()
    result = await auto_update_scholarships(db, batch_size=6)
    db.close()
    return result

r = asyncio.run(test())
print(f"Checked : {r['checked']}")
print(f"Updated : {r['updated']}")
print(f"Errors  : {r['errors']}")

if r.get("skip_reason"):
    print(f"SKIP REASON: {r['skip_reason']}")
elif r["log"]:
    print("Changes detected:")
    for e in r["log"]:
        print(f"  - {e['title']} -> {e['changes']}")
else:
    print("No changes detected — scholarships are up to date")

db2 = SessionLocal()
checked_count  = db2.query(Scholarship).filter(Scholarship.last_auto_checked != None).count()
never_count    = db2.query(Scholarship).filter(Scholarship.last_auto_checked == None).count()
print(f"\nNow checked : {checked_count}/185")
print(f"Still queued: {never_count}/185")
db2.close()
