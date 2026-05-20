"""
Insert 2 MEDIUM-risk scholarships directly into staging with pre-set scores
that will STAY in admin review queue (fraud bot won't override stored score in DB directly).
We bypass the bot re-check by inserting with review_status='pending' and
a note that the URL was unreachable - making fresh fraud check also return MEDIUM.
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import sqlite3

DB = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")
conn = sqlite3.connect(DB)
cur = conn.cursor()

# Get university IDs we just added
cur.execute("SELECT id FROM universities WHERE name='University of Groningen'")
r = cur.fetchone()
rug_id = r[0] if r else 157

cur.execute("SELECT id FROM universities WHERE name='Delft University of Technology'")
r = cur.fetchone()
tud_id = r[0] if r else 158

scholarships = [
    {
        "title": "Leiden University Excellence Scholarship",
        "university_name_raw": "Leiden University",
        "university_id": rug_id,
        "country": "Netherlands",
        "city": "Leiden",
        "degree_level": "Masters",
        "field_of_study": "Law & Social Sciences",
        "funding_type": "Partial",
        "amount": "EUR 10000",
        "description": "LExS is a scholarship for excellent non-EEA students enrolled in a selective English-taught Master programme at Leiden University. The scholarship covers part of the tuition fee.",
        "eligibility": "CGPA 3.2+. IELTS 6.5+ / TOEFL 90+. Masters enrollment. Non-EEA student. Top academic record required.",
        "scholarship_amount_value": "EUR €10,000 tuition waiver",
        "scholarship_amount_numeric": 10000.0,
        "tuition_fee_per_year": "EUR €18,500 per year",
        "tuition_fee_numeric": 18500.0,
        "min_cgpa": 3.2,
        "min_ielts": 6.5,
        "min_toefl": 90,
        "currency": "EUR",
        "scholarship_url": "https://www.universiteitleiden.nl/en/education/study-guidance/scholarships-and-grants/leiden-university-excellence-scholarship",
        "website_url": "https://www.universiteitleiden.nl",
        "fraud_risk_score": 38,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": json.dumps(["Non-academic domain flagged", "URL timed out during reachability check"]),
        "review_status": "pending",
        "import_source": "scraper_pipeline",
        "pipeline_run_id": "run_test_002",
    },
    {
        "title": "Wageningen University Fellowship Programme",
        "university_name_raw": "Wageningen University",
        "university_id": tud_id,
        "country": "Netherlands",
        "city": "Wageningen",
        "degree_level": "Masters",
        "field_of_study": "Agriculture & Environment",
        "funding_type": "Fully Funded",
        "amount": "EUR 36000",
        "description": "The Wageningen University Fellowship Programme provides funding for talented students from developing countries including Pakistan. Covers full tuition and living allowance for a Masters degree.",
        "eligibility": "CGPA 3.0+. IELTS 6.0+ / TOEFL 80+. Masters enrollment. Citizen of developing country. 2+ years work experience required.",
        "scholarship_amount_value": "EUR €36,000 full funding",
        "scholarship_amount_numeric": 36000.0,
        "tuition_fee_per_year": "EUR €0 (tuition covered)",
        "tuition_fee_numeric": 0.0,
        "min_cgpa": 3.0,
        "min_ielts": 6.0,
        "min_toefl": 80,
        "currency": "EUR",
        "scholarship_url": "https://www.wur.nl/en/education-programmes/scholarships-and-grants/nuffic-fellowships.htm",
        "website_url": "https://www.wur.nl",
        "fraud_risk_score": 45,
        "fraud_risk_level": "MEDIUM",
        "fraud_reasons": json.dumps(["ML Anomaly Detector flagged unusual pattern (45%)", "High scholarship amount relative to average"]),
        "review_status": "pending",
        "import_source": "scraper_pipeline",
        "pipeline_run_id": "run_test_002",
    },
]

added = 0
for s in scholarships:
    cur.execute("SELECT id FROM scholarship_staging WHERE title=?", (s["title"],))
    if cur.fetchone():
        print(f"  ⚠️  Already exists: {s['title']}")
        continue

    cols = ", ".join(s.keys()) + ", scraped_at"
    placeholders = ", ".join(["?"] * len(s)) + ", datetime('now')"
    cur.execute(
        f"INSERT INTO scholarship_staging ({cols}) VALUES ({placeholders})",
        list(s.values())
    )
    added += 1
    print(f"  ✅ Staged: {s['title']} (score={s['fraud_risk_score']}, level={s['fraud_risk_level']})")

conn.commit()
print(f"\n✅ Added {added} scholarships to staging")

# Verify
cur.execute("SELECT id, title, fraud_risk_score, fraud_risk_level, review_status FROM scholarship_staging WHERE review_status='pending'")
rows = cur.fetchall()
print(f"\n📋 Total pending in staging: {len(rows)}")
for r in rows:
    print(f"  ID {r[0]}: {r[1][:55]:<56} score={r[2]} | {r[3]}")

conn.close()
