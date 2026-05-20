import sqlite3, os
conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))
cur = conn.cursor()

checks = [
    ("funding_type missing",          "SELECT count(*) FROM scholarships WHERE funding_type IS NULL OR funding_type=''"),
    ("tuition_fee missing/zero",      "SELECT count(*) FROM scholarships WHERE tuition_fee_numeric IS NULL OR tuition_fee_numeric=0"),
    ("scholarship_amount missing",    "SELECT count(*) FROM scholarships WHERE scholarship_amount_numeric IS NULL OR scholarship_amount_numeric=0"),
    ("min_ielts missing",             "SELECT count(*) FROM scholarships WHERE min_ielts IS NULL"),
    ("min_toefl missing",             "SELECT count(*) FROM scholarships WHERE min_toefl IS NULL OR min_toefl=0"),
    ("min_cgpa missing/zero",         "SELECT count(*) FROM scholarships WHERE min_cgpa IS NULL OR min_cgpa=0"),
    ("deadline missing",              "SELECT count(*) FROM scholarships WHERE deadline IS NULL"),
    ("description short (<30 chars)", "SELECT count(*) FROM scholarships WHERE description IS NULL OR length(description)<30"),
    ("eligibility missing",           "SELECT count(*) FROM scholarships WHERE eligibility IS NULL OR eligibility=''"),
    ("duration_text missing",         "SELECT count(*) FROM scholarships WHERE duration_text IS NULL OR duration_text=''"),
    ("uni: qs_ranking missing",       "SELECT count(*) FROM universities WHERE qs_ranking IS NULL"),
    ("uni: established_year missing", "SELECT count(*) FROM universities WHERE established_year IS NULL"),
]

total_s = cur.execute("SELECT count(*) FROM scholarships").fetchone()[0]
total_u = cur.execute("SELECT count(*) FROM universities").fetchone()[0]
print(f"Total scholarships: {total_s} | Total universities: {total_u}\n")
print(f"{'Field':<38} {'Missing':>8}  {'Coverage':>10}")
print("-"*60)
for label, q in checks:
    n = cur.execute(q).fetchone()[0]
    base = total_u if "uni:" in label else total_s
    pct = round((base - n) / base * 100)
    bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
    print(f"{label:<38} {n:>8}  {bar} {pct}%")

conn.close()
