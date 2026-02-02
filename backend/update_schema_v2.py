import sqlite3
import os

db_path = "scholariq.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE universities ADD COLUMN logo_url VARCHAR")
    cursor.execute("ALTER TABLE universities ADD COLUMN image_url VARCHAR")
    print("✅ Columns logo_url and image_url added to universities table.")
except sqlite3.OperationalError as e:
    print(f"ℹ️ {e}")

conn.commit()
conn.close()
