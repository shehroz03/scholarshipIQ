import sqlite3, os
conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("""
    SELECT s.id, s.title, u.name as uni, s.country, s.min_cgpa, s.min_ielts, s.min_toefl,
           s.tuition_fee_numeric, s.scholarship_amount_numeric, s.requires_work_exp,
           s.degree_level, s.field_of_study
    FROM scholarships s LEFT JOIN universities u ON s.university_id=u.id ORDER BY s.id
""")
rows = cur.fetchall()
print(f"{'ID':<5} {'Title':<48} {'CGPA':>5} {'IELTS':>6} {'TOEFL':>6} {'Tuition':>9} {'Amount':>9} {'WE':>4}")
print("-"*105)
for r in rows:
    title = (r["title"] or "")[:47]
    print(f"{r['id']:<5} {title:<48} {str(r['min_cgpa'] or '-'):>5} {str(r['min_ielts'] or '-'):>6} {str(r['min_toefl'] or '-'):>6} {str(int(r['tuition_fee_numeric'] or 0)):>9} {str(int(r['scholarship_amount_numeric'] or 0)):>9} {str(r['requires_work_exp'] or 0):>4}")
conn.close()
