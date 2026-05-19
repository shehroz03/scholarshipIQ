"""Add cv_file_url column to teacher_profiles table."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "scholariq.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if column already exists
cursor.execute("PRAGMA table_info(teacher_profiles)")
columns = [col[1] for col in cursor.fetchall()]

if "cv_file_url" not in columns:
    cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN cv_file_url TEXT")
    conn.commit()
    print("✅ Added cv_file_url column to teacher_profiles")
else:
    print("ℹ️ cv_file_url column already exists")

conn.close()
