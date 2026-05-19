import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))

def check_unis():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT country, COUNT(*) FROM universities GROUP BY country ORDER BY COUNT(*) DESC;")
    countries = cursor.fetchall()
    print("=== Universities Countries in DB ===")
    for row in countries:
        print(f"  Country: {row[0]}, Count: {row[1]}")

    cursor.execute("SELECT id, name, country FROM universities LIMIT 5;")
    unis = cursor.fetchall()
    print("\n=== Universities Sample in DB ===")
    for row in unis:
        print(f"  ID: {row[0]}, Name: {row[1]}, Country: {row[2]}")

    conn.close()

if __name__ == "__main__":
    check_unis()
