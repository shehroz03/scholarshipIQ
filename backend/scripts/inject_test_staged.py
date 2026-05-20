"""
Inject 2 real scholarships into staging with MEDIUM fraud scores (30-49)
so they appear in Review Queue for admin to verify manually.
These are REAL scholarships from real universities.
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.db.models import ScholarshipStaging, University, ReviewStatus
from datetime import datetime, timezone

db = SessionLocal()

# Get university IDs
def get_uni_id(name):
    u = db.query(University).filter(University.name.ilike(f"%{name}%")).first()
    return u.id if u else None

scholarships_to_stage = [
    {
        "title": "University of Groningen Orange Tulip Scholarship",
        "university_name_raw": "University of Groningen",
        "university_id": get_uni_id("Groningen"),
        "country": "Netherlands",
        "city": "Groningen",
        "degree_level": "Masters",
        "field_of_study": "All Fields",
        "funding_type": "Partial",
        "description": "The Orange Tulip Scholarship (OTS) is a scholarship programme for talented students from selected countries, offering a tuition fee waiver for one-year Master's programmes at the University of Groningen.",
        "eligibility": "CGPA 3.2+. IELTS 6.5+ / TOEFL 90+. Masters enrollment. International student from eligible countries including Pakistan.",
        "scholarship_amount_value": "EUR €10,000 tuition waiver",
        "scholarship_amount_numeric": 10000.0,
        "tuition_fee_per_year": "EUR €18,000 per year",
        "tuition_fee_numeric": 18000.0,
        "min_cgpa": 3.2,
        "min_ielts": 6.5,
        "min_toefl": 90,
        "currency": "EUR",
        "amount": "€10,000",
        "scholarship_url": "https://www.rug.nl/education/scholarships/orange-tulip-scholarship",
        "website_url": "https://www.rug.nl",
        # MEDIUM risk: non-.edu URL flagged but legitimate
        "fraud_risk_score": 34,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": json.dumps(["Non-academic/government domain (.com/.net)", "URL check flagged redirect"]),
        "review_status": "pending",
        "import_source": "scraper_pipeline",
        "pipeline_run_id": "run_test_001",
    },
    {
        "title": "TU Delft Excellence Scholarship",
        "university_name_raw": "Delft University of Technology",
        "university_id": get_uni_id("Delft"),
        "country": "Netherlands",
        "city": "Delft",
        "degree_level": "Masters",
        "field_of_study": "Engineering & Technology",
        "funding_type": "Fully Funded",
        "description": "The TU Delft Excellence Scholarship is a full-tuition scholarship for outstanding international students pursuing MSc programmes at TU Delft, one of the world's top technical universities. Covers full tuition and provides a stipend.",
        "eligibility": "CGPA 3.5+. IELTS 6.5+ / TOEFL 90+. Masters enrollment in Engineering/Technology. Top 5% of graduating class.",
        "scholarship_amount_value": "EUR €30,000 full tuition + stipend",
        "scholarship_amount_numeric": 30000.0,
        "tuition_fee_per_year": "EUR €18,750 per year",
        "tuition_fee_numeric": 18750.0,
        "min_cgpa": 3.5,
        "min_ielts": 6.5,
        "min_toefl": 90,
        "currency": "EUR",
        "amount": "€30,000",
        "scholarship_url": "https://www.tudelft.nl/en/education/practical-matters/scholarships/tu-delft-excellence-scholarships",
        "website_url": "https://www.tudelft.nl",
        # MEDIUM risk: amount looks high, flagged by ML
        "fraud_risk_score": 41,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": json.dumps(["ML Anomaly Detector flagged unusual pattern (42%)", "High scholarship amount relative to tuition"]),
        "review_status": "pending",
        "import_source": "scraper_pipeline",
        "pipeline_run_id": "run_test_001",
    },
]

added = 0
for data in scholarships_to_stage:
    # Check not already in staging
    existing = db.query(ScholarshipStaging).filter(
        ScholarshipStaging.title == data["title"]
    ).first()
    if existing:
        print(f"  ⚠️  Already exists: {data['title']}")
        continue

    staged = ScholarshipStaging(
        scraped_at=datetime.now(timezone.utc).replace(tzinfo=None),
        **data
    )
    db.add(staged)
    added += 1
    print(f"  ✅ Staged: {data['title']} (score={data['fraud_risk_score']}, level={data['fraud_risk_level']})")

db.commit()
print(f"\n✅ Added {added} scholarships to staging.")

# Verify
count = db.query(ScholarshipStaging).filter(
    ScholarshipStaging.review_status == "pending"
).count()
print(f"📋 Total pending in staging: {count}")
db.close()
