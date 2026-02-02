import sqlite3
import os

db_path = "scholariq.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for table in ["universities", "scholarships"]:
    cursor.execute(f"PRAGMA table_info({table});")
    print(f"Columns in {table}:")
    for row in cursor.fetchall():
        print(row)
    print("-" * 40)
conn.close()
