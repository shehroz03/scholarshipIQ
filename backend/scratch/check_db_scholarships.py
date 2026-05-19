import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))

def check_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Distinct countries in scholarships table
    cursor.execute("SELECT DISTINCT country, COUNT(*) FROM scholarships GROUP BY country ORDER BY COUNT(*) DESC;")
    countries = cursor.fetchall()
    print("=== Scholarships Countries in DB ===")
    for row in countries:
        print(f"  Country: {row[0]}, Count: {row[1]}")

    # 2. Distinct degree levels in scholarships table
    cursor.execute("SELECT DISTINCT degree_level, COUNT(*) FROM scholarships GROUP BY degree_level ORDER BY COUNT(*) DESC;")
    degrees = cursor.fetchall()
    print("\n=== Scholarships Degree Levels in DB ===")
    for row in degrees:
        print(f"  Degree Level: {row[0]}, Count: {row[1]}")

    # 3. Some sample US or other scholarships if any
    cursor.execute("SELECT id, title, country, degree_level FROM scholarships WHERE country LIKE '%us%' OR country LIKE '%united states%' LIMIT 5;")
    us_schols = cursor.fetchall()
    print("\n=== US Scholarships in DB ===")
    if us_schols:
        for row in us_schols:
            print(f"  ID: {row[0]}, Title: {row[1]}, Country: {row[2]}, Degree: {row[3]}")
    else:
        print("  No US scholarships found!")

    conn.close()

if __name__ == "__main__":
    check_db()
