import sqlite3
import os

db_path = r'd:\ScholarIQ Landing Page Design\ScholarIQ Landing Page Design\backend\scholariq.db'

def check_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(scholarships)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
    conn.close()

if __name__ == "__main__":
    check_schema()
