import sqlite3
from datetime import datetime

conn = sqlite3.connect('scholariq.db')
cur = conn.cursor()

# Add subject column to courses if not exists
cols = [row[1] for row in cur.execute('PRAGMA table_info(courses)').fetchall()]
if 'subject' not in cols:
    cur.execute("ALTER TABLE courses ADD COLUMN subject TEXT")
    print("✅ Added: courses.subject")
else:
    print("✓ Exists: courses.subject")

# Create meeting_links table if not exists
cur.execute("""
    CREATE TABLE IF NOT EXISTS meeting_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        date DATETIME NOT NULL,
        link TEXT NOT NULL,
        platform TEXT DEFAULT 'Google Meet',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )
""")
print("✅ Created/Verified: meeting_links table")

conn.commit()
conn.close()
print("\n🎉 Migration completed!")
