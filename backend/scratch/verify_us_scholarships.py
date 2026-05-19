import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))

def verify():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM scholarships WHERE university_id IN (60, 61, 62);")
    count = cursor.fetchone()[0]
    print(f"Total scholarships for USA Universities (MIT, Harvard, Stanford): {count}")

    # Let's list all scholarships in the DB with their university names and countries
    cursor.execute("""
        SELECT s.id, s.title, u.name, u.country 
        FROM scholarships s
        JOIN universities u ON s.university_id = u.id
        ORDER BY s.id DESC;
    """)
    rows = cursor.fetchall()
    print("\n=== All Scholarships and their University Countries ===")
    for r in rows:
        print(f"  ID: {r[0]}, Title: {r[1]}, Uni Name: {r[2]}, Country: {r[3]}")

    conn.close()

if __name__ == "__main__":
    verify()
