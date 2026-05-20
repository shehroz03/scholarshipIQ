"""Full audit of all scholarship fields - show exactly what's missing per scholarship"""
import sqlite3, os
conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("""
    SELECT s.id, s.title, u.name as uni_name, s.country, s.degree_level,
           s.min_cgpa, s.min_ielts, s.min_toefl, s.requires_work_exp,
           s.funding_type, s.scholarship_amount_value, s.scholarship_amount_numeric,
           s.tuition_fee_per_year, s.tuition_fee_numeric,
           s.eligibility, s.duration_text, s.description,
           u.qs_ranking, u.established_year
    FROM scholarships s
    LEFT JOIN universities u ON s.university_id = u.id
    WHERE s.is_archived = 0 AND s.is_suspicious = 0
    ORDER BY s.id
""")
rows = cur.fetchall()

issues = {}
for r in rows:
    missing = []
    if not r['min_cgpa'] or r['min_cgpa'] == 0:       missing.append('min_cgpa')
    if not r['min_ielts']:                              missing.append('min_ielts')
    if not r['min_toefl'] or r['min_toefl'] == 0:      missing.append('min_toefl')
    if not r['scholarship_amount_value']:               missing.append('scholarship_amount_value')
    if not r['scholarship_amount_numeric'] or r['scholarship_amount_numeric'] == 0:
                                                        missing.append('scholarship_amount_numeric')
    if not r['tuition_fee_per_year']:                   missing.append('tuition_fee_per_year')
    if not r['tuition_fee_numeric'] or r['tuition_fee_numeric'] == 0:
                                                        missing.append('tuition_fee_numeric')
    if not r['eligibility']:                            missing.append('eligibility')
    if not r['duration_text']:                          missing.append('duration_text')
    if not r['description'] or len(r['description'] or '') < 30:
                                                        missing.append('description')
    if not r['funding_type']:                           missing.append('funding_type')
    if not r['qs_ranking']:                             missing.append('uni_qs_ranking')
    if not r['established_year']:                       missing.append('uni_est_year')
    if missing:
        issues[r['id']] = {'title': r['title'], 'country': r['country'], 'missing': missing}

print(f"Total scholarships: {len(rows)}")
print(f"Scholarships with ANY missing field: {len(issues)}\n")

# Group by missing field
from collections import Counter
field_counts = Counter()
for v in issues.values():
    for f in v['missing']:
        field_counts[f] += 1

print("=== Missing field summary ===")
for field, count in field_counts.most_common():
    print(f"  {field:<35} missing in {count} scholarships")

print("\n=== Scholarships with non-uni-ranking issues ===")
for sid, data in issues.items():
    non_uni = [f for f in data['missing'] if f not in ('uni_qs_ranking','uni_est_year')]
    if non_uni:
        print(f"  ID {sid:<5} {data['title'][:50]:<51} [{', '.join(non_uni)}]")

conn.close()
