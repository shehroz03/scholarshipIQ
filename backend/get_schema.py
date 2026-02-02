import sqlite3
import os

db_path = "scholariq.db"
if not os.path.exists(db_path):
    print("DB not found")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")
for n, s in cursor.fetchall():
    print(f"Table: {n}")
    print(s)
    print("-" * 40)
conn.close()
