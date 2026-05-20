"""
Fix IDs with bad/generic names and remaining missing amounts.
Also fix scholarship_amount_value that has "0.0" parsed incorrectly.
"""
import sqlite3, os, re

DB = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# ─── 1. Check the remaining 12 with amount_numeric=0 ─────────────────────
cur.execute("""
    SELECT id, title, country, scholarship_amount_value, scholarship_amount_numeric,
           tuition_fee_per_year, tuition_fee_numeric, funding_type, degree_level
    FROM scholarships
    WHERE scholarship_amount_numeric IS NULL OR scholarship_amount_numeric=0
    ORDER BY id
""")
rows = cur.fetchall()
print(f"=== Remaining {len(rows)} with missing/zero scholarship_amount_numeric ===")
for r in rows:
    print(f"  ID {r['id']:<5} [{r['country']:<12}] {r['title'][:50]:<51} | val='{r['scholarship_amount_value']}' | type={r['funding_type']}")

conn.close()
