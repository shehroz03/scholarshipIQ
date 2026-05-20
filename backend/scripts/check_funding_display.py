import sqlite3, os
conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("=== Scholarships with NO scholarship_amount_value ===")
cur.execute("""
    SELECT title, scholarship_amount_value, scholarship_amount_numeric, funding_amount, funding_type
    FROM scholarships 
    WHERE scholarship_amount_value IS NULL OR scholarship_amount_value=''
    ORDER BY id LIMIT 30
""")
rows = cur.fetchall()
for r in rows:
    print(f"  {r['title'][:45]:<46} num={r['scholarship_amount_numeric']} fund={r['funding_amount']} type={r['funding_type']}")

print(f"\nTotal missing scholarship_amount_value: {len(rows)}")

# What will frontend show for each?
print("\n=== What frontend WILL show ===")
for r in rows:
    av = r['scholarship_amount_value']
    an = r['scholarship_amount_numeric']
    fa = r['funding_amount']
    ft = r['funding_type']
    if av: display = av
    elif an and an > 0: display = f"${an:,.0f}"
    elif fa and fa != '0': display = fa
    elif ft == 'Fully Funded': display = "Full Coverage"
    else: display = "See Details"
    print(f"  {r['title'][:45]:<46} → {display}")

conn.close()
