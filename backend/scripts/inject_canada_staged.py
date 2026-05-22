"""
Inject 3 real Canada scholarships into staging with MEDIUM fraud scores (30-49)
so they appear in the Admin Review Queue.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import ScholarshipStaging
from datetime import datetime, timezone

db = SessionLocal()

canada_scholarships = [
    {
        "title": "University of Toronto Excellence Scholarship",
        "university_name_raw": "University of Toronto",
        "country": "Canada",
        "city": "Toronto",
        "degree_level": "Masters",
        "field_of_study": "Engineering, Science, Business",
        "funding_type": "Partial",
        "scholarship_amount_value": "CAD 15,000/year",
        "scholarship_amount_numeric": 15000.0,
        "tuition_fee_per_year": "CAD 35,000/year",
        "min_cgpa": 3.5,
        "min_ielts": 6.5,
        "min_toefl": 100,
        "eligibility": "International students with exceptional academic record. GPA 3.5+ required.",
        "description": "The University of Toronto Excellence Scholarship supports outstanding international graduate students pursuing Masters programs in Engineering, Science, or Business.",
        "scholarship_url": "https://www.sgs.utoronto.ca/awards/university-of-toronto-fellowships/",
        "website_url": "https://www.utoronto.ca",
        "fraud_risk_score": 35.0,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": '["URL requires verification", "Amount not fully disclosed on main page"]',
        "review_status": "pending",
        "import_source": "canada_test_inject",
    },
    {
        "title": "McGill University Entrance Scholarship for International Students",
        "university_name_raw": "McGill University",
        "country": "Canada",
        "city": "Montreal",
        "degree_level": "Bachelors",
        "field_of_study": "All Programs",
        "funding_type": "Partial",
        "scholarship_amount_value": "CAD 3,000 - CAD 12,000",
        "scholarship_amount_numeric": 12000.0,
        "tuition_fee_per_year": "CAD 22,000/year",
        "min_cgpa": 3.7,
        "min_ielts": 7.0,
        "min_toefl": 105,
        "eligibility": "High-achieving international students entering first year undergraduate. Automatic consideration upon admission.",
        "description": "McGill University awards entrance scholarships to exceptional international students. No separate application required — all admitted students are automatically considered.",
        "scholarship_url": "https://www.mcgill.ca/studentaid/scholarships-awards/entrance/international",
        "website_url": "https://www.mcgill.ca",
        "fraud_risk_score": 42.0,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": '["Scholarship amount range is wide", "Eligibility criteria not fully specified"]',
        "review_status": "pending",
        "import_source": "canada_test_inject",
    },
    {
        "title": "UBC International Major Entrance Scholarship",
        "university_name_raw": "University of British Columbia",
        "country": "Canada",
        "city": "Vancouver",
        "degree_level": "Bachelors",
        "field_of_study": "All Faculties",
        "funding_type": "Partial",
        "scholarship_amount_value": "CAD 10,000 - CAD 40,000",
        "scholarship_amount_numeric": 40000.0,
        "tuition_fee_per_year": "CAD 38,000/year",
        "min_cgpa": 3.8,
        "min_ielts": 6.5,
        "min_toefl": 100,
        "eligibility": "Top international students admitted to UBC Vancouver or Okanagan. Based on academic excellence.",
        "description": "UBC's most prestigious entrance award for international students. Recipients are selected based on outstanding academic achievement and personal accomplishments.",
        "scholarship_url": "https://students.ubc.ca/enrolment/finances/awards-scholarships-bursaries/imes",
        "website_url": "https://www.ubc.ca",
        "fraud_risk_score": 38.0,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": '["Large amount range needs verification", "Competitive selection process unclear"]',
        "review_status": "pending",
        "import_source": "canada_test_inject",
    },
]

added = 0
for s in canada_scholarships:
    # Check duplicate
    exists = db.query(ScholarshipStaging).filter(ScholarshipStaging.title == s["title"]).first()
    if exists:
        db.delete(exists)
        db.commit()
        print(f"  Replaced: {s['title']}")

    row = ScholarshipStaging(
        scraped_at=datetime.now(timezone.utc),
        **s
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    print(f"  ✅ Added: {s['title']} (ID={row.id}, score={s['fraud_risk_score']})")
    added += 1

print(f"\n✅ {added} Canada scholarships added to staging (MEDIUM risk → Review Queue)")

# Show total pending
total = db.query(ScholarshipStaging).filter(ScholarshipStaging.review_status == "pending").count()
print(f"Total pending in Review Queue: {total}")
db.close()
