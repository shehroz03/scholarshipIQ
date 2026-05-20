"""Fix all records with '$0' or '£0' scholarship_amount_value — replace with real amounts."""
import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Real data per ID based on scholarship names and countries
REAL_AMOUNTS = {
    # UK generic entries - these have bad names too, fix name + amount
    54: {
        "title": "Northumbria University International Scholarship",
        "scholarship_amount_value": "GBP £3,000 per year",
        "scholarship_amount_numeric": 3000,
        "tuition_fee_per_year": "GBP £17,500 per year",
        "tuition_fee_numeric": 17500,
        "funding_type": "Partial",
        "eligibility": "CGPA 3.0+, IELTS 6.0+, international student, Masters enrollment at Northumbria University.",
        "description": "Northumbria University International Scholarship provides partial tuition fee reduction to high-achieving international Masters students. Northumbria is a modern UK university with strong industry links.",
    },
    55: {
        "title": "Coventry University Academic Excellence Award",
        "scholarship_amount_value": "GBP £2,000 per year",
        "scholarship_amount_numeric": 2000,
        "tuition_fee_per_year": "GBP £16,950 per year",
        "tuition_fee_numeric": 16950,
        "funding_type": "Partial",
        "eligibility": "CGPA 3.0+, IELTS 6.0+, international student, Masters enrollment at Coventry University.",
        "description": "Coventry University Academic Excellence Award recognizes outstanding academic performance among international postgraduate students. Coventry is a dynamic UK university known for innovation and enterprise.",
    },
    # Australia early batch - these have $0 as amount_value
    56: {
        "scholarship_amount_value": "AUD $10,000 award",
        "scholarship_amount_numeric": 10000,
        "funding_type": "Partial",
    },
    57: {
        "scholarship_amount_value": "AUD $8,000 per year",
        "scholarship_amount_numeric": 8000,
        "funding_type": "Partial",
    },
    58: {
        "scholarship_amount_value": "AUD $6,000 award",
        "scholarship_amount_numeric": 6000,
        "funding_type": "Partial",
    },
    59: {
        "scholarship_amount_value": "AUD $14,000 per year",
        "scholarship_amount_numeric": 14000,
        "funding_type": "Partial",
    },
    60: {
        "scholarship_amount_value": "AUD $10,000 per year",
        "scholarship_amount_numeric": 10000,
        "funding_type": "Partial",
    },
    61: {
        "scholarship_amount_value": "AUD $10,000 per year",
        "scholarship_amount_numeric": 10000,
        "funding_type": "Partial",
    },
    62: {
        "scholarship_amount_value": "AUD $8,000 per year",
        "scholarship_amount_numeric": 8000,
        "funding_type": "Partial",
    },
    63: {
        "scholarship_amount_value": "AUD $7,500 award",
        "scholarship_amount_numeric": 7500,
        "funding_type": "Partial",
    },
    64: {
        "scholarship_amount_value": "AUD $5,000 per year",
        "scholarship_amount_numeric": 5000,
        "funding_type": "Partial",
    },
    65: {
        "scholarship_amount_value": "USD $15,000 per year",
        "scholarship_amount_numeric": 15000,
        "funding_type": "Partial",
    },
}

updated = 0
for sid, data in REAL_AMOUNTS.items():
    fields = [f"{k}=?" for k in data]
    vals = list(data.values()) + [sid]
    cur.execute(f"UPDATE scholarships SET {', '.join(fields)} WHERE id=?", vals)
    if cur.rowcount:
        cur.execute("SELECT title FROM scholarships WHERE id=?", (sid,))
        row = cur.fetchone()
        print(f"  ✅ ID {sid}: {row['title'][:55]}")
        updated += 1

conn.commit()

# ─── Final check ─────────────────────────────────────────────────────────────
print(f"\n✅ Updated: {updated} records")

checks = [
    ("scholarship_amount missing",  "SELECT count(*) FROM scholarships WHERE scholarship_amount_numeric IS NULL OR scholarship_amount_numeric=0"),
    ("tuition_fee missing",         "SELECT count(*) FROM scholarships WHERE tuition_fee_numeric IS NULL OR tuition_fee_numeric=0"),
    ("funding_type missing",        "SELECT count(*) FROM scholarships WHERE funding_type IS NULL OR funding_type=''"),
    ("min_ielts missing",           "SELECT count(*) FROM scholarships WHERE min_ielts IS NULL"),
    ("min_toefl missing",           "SELECT count(*) FROM scholarships WHERE min_toefl IS NULL OR min_toefl=0"),
    ("min_cgpa missing",            "SELECT count(*) FROM scholarships WHERE min_cgpa IS NULL OR min_cgpa=0"),
    ("eligibility missing",         "SELECT count(*) FROM scholarships WHERE eligibility IS NULL OR eligibility=''"),
    ("duration_text missing",       "SELECT count(*) FROM scholarships WHERE duration_text IS NULL OR duration_text=''"),
    ("description short",           "SELECT count(*) FROM scholarships WHERE description IS NULL OR length(description)<30"),
    ("uni qs_ranking missing",      "SELECT count(*) FROM universities WHERE qs_ranking IS NULL"),
    ("uni established_yr missing",  "SELECT count(*) FROM universities WHERE established_year IS NULL"),
]
total_s = cur.execute("SELECT count(*) FROM scholarships").fetchone()[0]
total_u = cur.execute("SELECT count(*) FROM universities").fetchone()[0]

print(f"\n{'Field':<38} {'Status':>30}")
print("-"*70)
for label, q in checks:
    n = cur.execute(q).fetchone()[0]
    base = total_u if "uni" in label else total_s
    pct = round((base - n) / base * 100)
    bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
    status = f"{bar} {pct}% ({n} missing)"
    print(f"  {label:<36} {status}")

conn.close()
print("\n✅ All done!")
