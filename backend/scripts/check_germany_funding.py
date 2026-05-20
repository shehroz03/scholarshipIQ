import sqlite3, os
conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("""
    SELECT title, scholarship_amount_value, scholarship_amount_numeric, tuition_fee_per_year, funding_type
    FROM scholarships 
    WHERE title LIKE '%Hamburg%' OR title LIKE '%Bonn%' OR title LIKE '%Cologne%' 
       OR title LIKE '%Bilkent%' OR title LIKE '%METU%'
    ORDER BY id
""")
for r in cur.fetchall():
    print(f"Title:  {r['title']}")
    print(f"  amount_value:   {r['scholarship_amount_value']}")
    print(f"  amount_numeric: {r['scholarship_amount_numeric']}")
    print(f"  tuition:        {r['tuition_fee_per_year']}")
    print(f"  funding_type:   {r['funding_type']}")
    print()
conn.close()
