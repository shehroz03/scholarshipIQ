import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))

def check_schols():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get column names
    cursor.execute("PRAGMA table_info(scholarships);")
    cols = cursor.fetchall()
    print("=== Columns of scholarships table ===")
    for c in cols:
        print(f"  {c[1]} ({c[2]})")

    # Sample rows
    cursor.execute("SELECT id, title, university_id, country FROM scholarships LIMIT 5;")
    rows = cursor.fetchall()
    print("\n=== Sample Scholarship Records ===")
    for r in rows:
        print(f"  ID: {r[0]}, Title: {r[1]}, University ID: {r[2]}, Country: {r[3]}")

    # Count with non-null university_id
    cursor.execute("SELECT COUNT(*) FROM scholarships WHERE university_id IS NOT NULL;")
    has_uni = cursor.fetchone()[0]
    print(f"\nTotal scholarships with university_id: {has_uni}")

    # Let's see some details of associated universities
    cursor.execute("""
        SELECT s.id, s.title, u.name, u.country 
        FROM scholarships s
        LEFT JOIN universities u ON s.university_id = u.id
        LIMIT 5;
    """)
    joined = cursor.fetchall()
    print("\n=== Sample Joined Records ===")
    for row in joined:
        print(f"  Scholarship: {row[1]}, University: {row[2]}, Uni Country: {row[3]}")

    conn.close()

if __name__ == "__main__":
    check_schols()
