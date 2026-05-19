import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))

def check_usa():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get USA Universities
    cursor.execute("SELECT id, name, country FROM universities WHERE country LIKE '%us%' OR country LIKE '%united states%';")
    unis = cursor.fetchall()
    print("=== USA Universities in DB ===")
    uni_ids = []
    for u in unis:
        print(f"  ID: {u[0]}, Name: {u[1]}, Country: {u[2]}")
        uni_ids.append(u[0])

    # Get Scholarships associated with these USA Universities
    if uni_ids:
        placeholders = ",".join("?" for _ in uni_ids)
        cursor.execute(f"SELECT id, title, university_id, degree_level FROM scholarships WHERE university_id IN ({placeholders});", uni_ids)
        schols = cursor.fetchall()
        print(f"\n=== Scholarships associated with USA Universities ({len(schols)}) ===")
        for s in schols:
            print(f"  ID: {s[0]}, Title: {s[1]}, Uni ID: {s[2]}, Degree: {s[3]}")
    else:
        print("\nNo USA universities in the DB!")

    conn.close()

if __name__ == "__main__":
    check_usa()
