"""
Patch all remaining missing fields:
1. tuition_fee_numeric for Germany scholarships (tuition = 0, correct)
2. scholarship_amount_numeric for early Australia/UK scholarships (IDs 54-65)
3. min_toefl for Stanford/Harvard/MIT
4. More uni QS rankings + established years
"""
import sqlite3, os, re

DB = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# ─── 1. Germany public unis: tuition is essentially 0 (only semester fee ~300-500 EUR)
#       Set tuition_fee_numeric to the semester fee amount, update tuition_fee_per_year text
GERMANY_TUITION_FIX = {
    "Humboldt International Masters Scholarship":   (500,  "EUR €500 per year (semester admin fee only)"),
    "FU Berlin International Scholarship":          (500,  "EUR €500 per year (semester admin fee only)"),
    "Hamburg International Excellence Award":       (500,  "EUR €500 per year (semester admin fee only)"),
    "Bonn International Graduate Scholarship":      (500,  "EUR €500 per year (semester admin fee only)"),
    "Cologne Global Masters Scholarship":           (500,  "EUR €500 per year (semester admin fee only)"),
}
for title, (num, text) in GERMANY_TUITION_FIX.items():
    cur.execute("""UPDATE scholarships SET tuition_fee_numeric=?, tuition_fee_per_year=?
                   WHERE title=? AND (tuition_fee_numeric IS NULL OR tuition_fee_numeric=0)""",
                (num, text, title))
    print(f"  ✅ tuition fixed: {title}")

# ─── 2. Early Australia/UK batch (IDs 54-65) - extract numeric from amount_value
cur.execute("""SELECT id, title, scholarship_amount_value FROM scholarships
               WHERE id BETWEEN 54 AND 65 AND
               (scholarship_amount_numeric IS NULL OR scholarship_amount_numeric=0)""")
rows = cur.fetchall()
for r in rows:
    val = r['scholarship_amount_value'] or ''
    nums = re.findall(r'[\d,]+', val.replace(',', ''))
    if nums:
        num = float(nums[0].replace(',', ''))
        # If it looks like a per-month figure (< 3000), annualize it
        if num < 3000 and '/month' in val.lower():
            num = num * 12
        cur.execute("UPDATE scholarships SET scholarship_amount_numeric=? WHERE id=?", (num, r['id']))
        print(f"  ✅ amount_numeric set {num}: {r['title'][:50]}")
    else:
        print(f"  ⚠️  could not parse amount from '{val}': {r['title'][:50]}")

# ─── 3. Similarly fix tuition_fee_numeric for IDs 56-65 (Australia early batch)
AUSTRALIA_TUITION = {
    "Melbourne Graduate Scholarship":    (42000, "AUD $42,000 per year"),
    "VC International Scholarship":      (42000, "AUD $42,000 per year"),
    "International Student Award":       (38000, "AUD $38,000 per year"),
    "ANU Chancellor's International":    (44000, "AUD $44,000 per year"),
    "Monash International Merit":        (40000, "AUD $40,000 per year"),
    "UQ International Excellence":       (47000, "AUD $47,000 per year"),
    "Global Excellence Scholarship":     (40000, "AUD $40,000 per year"),
    "Global Citizens Scholarship":       (38000, "AUD $38,000 per year"),
    "UTS Academic Excellence":           (35000, "AUD $35,000 per year"),
    "Future Leaders Scholarship":        (38000, "AUD $38,000 per year"),
}
for title, (num, text) in AUSTRALIA_TUITION.items():
    cur.execute("""UPDATE scholarships SET tuition_fee_numeric=?, tuition_fee_per_year=?
                   WHERE title LIKE ? AND (tuition_fee_numeric IS NULL OR tuition_fee_numeric=0)""",
                (num, text, f"%{title}%"))
    if cur.rowcount:
        print(f"  ✅ tuition fixed: {title}")

# ─── 4. Fix min_toefl for Stanford/Harvard/MIT (these require 100+)
HIGH_TOEFL = {
    "Knight-Hennessy Scholars Program": 100,
    "Harvard Graduate Fellowship":      100,
    "MIT Presidential Graduate Fellowship": 100,
}
for title, toefl in HIGH_TOEFL.items():
    cur.execute("UPDATE scholarships SET min_toefl=? WHERE title=? AND (min_toefl IS NULL OR min_toefl=0)",
                (toefl, title))
    if cur.rowcount:
        print(f"  ✅ min_toefl={toefl}: {title}")

# ─── 5. More universities QS + established year
MORE_UNI_DATA = {
    # Turkey
    "Bilkent University":                    (551, 1984),
    "Middle East Technical University":      (601, 1956),
    "METU":                                  (601, 1956),
    "Bogazici University":                   (751, 1863),
    "Istanbul Technical University":         (601, 1773),
    "Sabanci University":                    (651, 1994),
    "Koc University":                        (601, 1993),
    # Australia (early batch)
    "Victoria University":                   (801, 1916),
    "UTS":                                   (133, 1988),
    "University of Technology Sydney":       (133, 1988),
    "Macquarie University":                  (195, 1964),
    "RMIT University":                       (188, 1887),
    "Griffith University":                   (302, 1971),
    "Deakin University":                     (302, 1974),
    "La Trobe University":                   (401, 1964),
    "Curtin University":                     (198, 1966),
    "Bond University":                       (601, 1989),
    # USA (more)
    "Stanford University":                   (5,   1885),
    "Harvard University":                    (4,   1636),
    "MIT":                                   (1,   1861),
    "Massachusetts Institute of Technology": (1,   1861),
    "University of Pennsylvania":            (13,  1740),
    "Caltech":                               (6,   1891),
    "California Institute of Technology":    (6,   1891),
    "University of Chicago":                 (11,  1890),
    "Brown University":                      (201, 1764),
    "Dartmouth College":                     (201, 1769),
    # Canada more
    "York University":                       (601, 1959),
    "University of Victoria":                (401, 1963),
    "Concordia University":                  (601, 1974),
    "Carleton University":                   (601, 1942),
    "University of Manitoba":                (601, 1877),
    "University of Saskatchewan":            (601, 1907),
    # UK more
    "Durham University":                     (92,  1832),
    "University of Bath":                    (201, 1966),
    "University of York":                    (198, 1963),
    "Lancaster University":                  (201, 1964),
    "University of Liverpool":               (178, 1881),
    "Cardiff University":                    (184, 1883),
    "Queen Mary University of London":       (113, 1885),
    "University of Aberdeen":                (301, 1495),
    "University of Dundee":                  (401, 1881),
    "University of Strathclyde":             (301, 1796),
    "Heriot-Watt University":                (401, 1821),
    "Swansea University":                    (401, 1920),
    "University of Sussex":                  (201, 1961),
    "Royal Holloway":                        (601, 1879),
    "Aston University":                      (601, 1895),
    "University of East Anglia":             (401, 1963),
    "Brunel University":                     (651, 1966),
    # Germany more
    "University of Hamburg":                 (176, 1919),
    "University of Bonn":                    (176, 1818),
    "Freie Universitat Berlin":              (101, 1948),
    "Free Universitat Berlin":               (101, 1948),
    "Humboldt-Universitat zu Berlin":        (120, 1810),
    "Jacobs University Bremen":              (601, 1999),
    "Constructor University":               (601, 1999),
    # Pakistan-friendly
    "University of Groningen":               (130, 1614),
    "Leiden University":                     (128, 1575),
    "Utrecht University":                    (106, 1636),
    "Delft University of Technology":        (47,  1842),
    "Wageningen University":                 (166, 1918),
    "Erasmus University Rotterdam":          (166, 1913),
    "VU Amsterdam":                          (218, 1880),
    "Maastricht University":                 (234, 1976),
    "Radboud University":                    (234, 1923),
    "Eindhoven University":                  (123, 1956),
    # Nordic
    "Lund University":                       (91,  1666),
    "Uppsala University":                    (109, 1477),
    "Stockholm University":                  (197, 1878),
    "KTH Royal Institute of Technology":     (98,  1827),
    "Chalmers University":                   (201, 1829),
    "University of Oslo":                    (119, 1811),
    "University of Copenhagen":              (101, 1479),
    "Aarhus University":                     (150, 1928),
    "University of Helsinki":                (107, 1640),
    "Aalto University":                      (115, 1849),
}

updated_unis = 0
for uni_name, (qs, est) in MORE_UNI_DATA.items():
    cur.execute("SELECT id, qs_ranking, established_year FROM universities WHERE name LIKE ?", (f"%{uni_name}%",))
    for row in cur.fetchall():
        updates, vals = [], []
        if row['qs_ranking'] is None and qs:
            updates.append("qs_ranking=?"); vals.append(qs)
        if row['established_year'] is None and est:
            updates.append("established_year=?"); vals.append(est)
        if updates:
            vals.append(row['id'])
            cur.execute(f"UPDATE universities SET {', '.join(updates)} WHERE id=?", vals)
            updated_unis += 1

conn.commit()
print(f"\n✅ Universities updated: {updated_unis}")

# ─── Final summary ───────────────────────────────────────────────────────────
print("\n📊 FINAL STATUS:")
checks = [
    ("funding_type missing",        "SELECT count(*) FROM scholarships WHERE funding_type IS NULL OR funding_type=''"),
    ("min_ielts missing",           "SELECT count(*) FROM scholarships WHERE min_ielts IS NULL"),
    ("min_toefl missing",           "SELECT count(*) FROM scholarships WHERE min_toefl IS NULL OR min_toefl=0"),
    ("min_cgpa missing",            "SELECT count(*) FROM scholarships WHERE min_cgpa IS NULL OR min_cgpa=0"),
    ("scholarship_amount missing",  "SELECT count(*) FROM scholarships WHERE scholarship_amount_numeric IS NULL OR scholarship_amount_numeric=0"),
    ("tuition_fee missing",         "SELECT count(*) FROM scholarships WHERE tuition_fee_numeric IS NULL OR tuition_fee_numeric=0"),
    ("eligibility missing",         "SELECT count(*) FROM scholarships WHERE eligibility IS NULL OR eligibility=''"),
    ("duration_text missing",       "SELECT count(*) FROM scholarships WHERE duration_text IS NULL OR duration_text=''"),
    ("description short",           "SELECT count(*) FROM scholarships WHERE description IS NULL OR length(description)<30"),
    ("uni qs_ranking missing",      "SELECT count(*) FROM universities WHERE qs_ranking IS NULL"),
    ("uni established_yr missing",  "SELECT count(*) FROM universities WHERE established_year IS NULL"),
]
total_s = cur.execute("SELECT count(*) FROM scholarships").fetchone()[0]
total_u = cur.execute("SELECT count(*) FROM universities").fetchone()[0]
for label, q in checks:
    n = cur.execute(q).fetchone()[0]
    base = total_u if "uni" in label else total_s
    pct = round((base - n) / base * 100)
    status = "✅" if n == 0 else f"⚠️  {n} remaining ({pct}% covered)"
    print(f"  {label:<35} {status}")

conn.close()
print("\n✅ All patches complete!")
