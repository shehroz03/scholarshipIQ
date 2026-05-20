import sqlite3, os, json
DB = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")
conn = sqlite3.connect(DB)
cur = conn.cursor()

# Delete old entries
titles = [
    "Leiden University Excellence Scholarship",
    "Wageningen University Fellowship Programme",
    "University of Groningen Orange Tulip Scholarship",
    "TU Delft Excellence Scholarship",
]
for t in titles:
    cur.execute("DELETE FROM scholarship_staging WHERE title=?", (t,))
    print(f"Deleted: {cur.rowcount} rows for '{t}'")

# Get uni IDs
cur.execute("SELECT id FROM universities WHERE name='University of Groningen'")
rug_id = cur.fetchone()[0]
cur.execute("SELECT id FROM universities WHERE name='Delft University of Technology'")
tud_id = cur.fetchone()[0]

scholarships = [
    {
        "title": "Leiden University Excellence Scholarship",
        "university_name_raw": "Leiden University",
        "university_id": rug_id,
        "country": "Netherlands", "city": "Leiden",
        "degree_level": "Masters", "field_of_study": "Law & Social Sciences",
        "funding_type": "Partial", "amount": "EUR 10000",
        "description": "LExS is a scholarship for excellent non-EEA students enrolled in a selective English-taught Master programme at Leiden University, one of the world's oldest universities.",
        "eligibility": "CGPA 3.2+. IELTS 6.5+ / TOEFL 90+. Masters enrollment. Non-EEA student.",
        "scholarship_amount_value": "EUR €10,000 tuition waiver",
        "scholarship_amount_numeric": 10000.0,
        "tuition_fee_per_year": "EUR €18,500 per year",
        "tuition_fee_numeric": 18500.0,
        "min_cgpa": 3.2, "min_ielts": 6.5, "min_toefl": 90, "currency": "EUR",
        "scholarship_url": "https://www.universiteitleiden.nl/en/education/study-guidance/scholarships-and-grants/leiden-university-excellence-scholarship",
        "website_url": "https://www.universiteitleiden.nl",
        "fraud_risk_score": 38, "fraud_risk_level": "MEDIUM",
        "fraud_reasons": json.dumps(["Non-academic domain flagged", "URL timed out during reachability check"]),
        "review_status": "pending", "import_source": "scraper_pipeline", "pipeline_run_id": "run_demo",
    },
    {
        "title": "Wageningen University Fellowship Programme",
        "university_name_raw": "Wageningen University",
        "university_id": tud_id,
        "country": "Netherlands", "city": "Wageningen",
        "degree_level": "Masters", "field_of_study": "Agriculture & Environment",
        "funding_type": "Fully Funded", "amount": "EUR 36000",
        "description": "The Wageningen University Fellowship Programme provides full funding for talented students from developing countries including Pakistan to pursue a Masters degree at Wageningen UR.",
        "eligibility": "CGPA 3.0+. IELTS 6.0+ / TOEFL 80+. Masters enrollment. Citizen of developing country. 2+ years work experience required.",
        "scholarship_amount_value": "EUR €36,000 full funding",
        "scholarship_amount_numeric": 36000.0,
        "tuition_fee_per_year": "EUR €0 (tuition covered)",
        "tuition_fee_numeric": 0.0,
        "min_cgpa": 3.0, "min_ielts": 6.0, "min_toefl": 80, "currency": "EUR",
        "scholarship_url": "https://www.wur.nl/en/education-programmes/scholarships-and-grants/nuffic-fellowships.htm",
        "website_url": "https://www.wur.nl",
        "fraud_risk_score": 45, "fraud_risk_level": "MEDIUM",
        "fraud_reasons": json.dumps(["ML Anomaly Detector flagged unusual pattern (45%)", "High scholarship amount relative to average"]),
        "review_status": "pending", "import_source": "scraper_pipeline", "pipeline_run_id": "run_demo",
    },
]

added = 0
for s in scholarships:
    cols = ", ".join(s.keys()) + ", scraped_at"
    placeholders = ", ".join(["?"] * len(s)) + ", datetime('now')"
    cur.execute(f"INSERT INTO scholarship_staging ({cols}) VALUES ({placeholders})", list(s.values()))
    added += 1
    print(f"  Added: {s['title']} (score={s['fraud_risk_score']})")

conn.commit()
print(f"\nAdded {added} scholarships to staging")

cur.execute("SELECT id, title, fraud_risk_score, fraud_risk_level, review_status FROM scholarship_staging WHERE review_status='pending'")
rows = cur.fetchall()
print(f"Total pending: {len(rows)}")
for r in rows:
    print(f"  ID {r[0]}: {r[1][:55]:<56} score={r[2]} {r[3]}")
conn.close()
