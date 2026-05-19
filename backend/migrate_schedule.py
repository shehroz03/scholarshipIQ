import sqlite3
from datetime import datetime

conn = sqlite3.connect('scholariq.db')
cur = conn.cursor()

# Add time column to meeting_links if not exists
ml_cols = [row[1] for row in cur.execute('PRAGMA table_info(meeting_links)').fetchall()]
if 'time' not in ml_cols:
    cur.execute("ALTER TABLE meeting_links ADD COLUMN time TEXT")
    print("✅ Added: meeting_links.time")
else:
    print("✓ Exists: meeting_links.time")

# Add scheduled_at column to quizzes if not exists
quiz_cols = [row[1] for row in cur.execute('PRAGMA table_info(quizzes)').fetchall()]
if 'scheduled_at' not in quiz_cols:
    cur.execute("ALTER TABLE quizzes ADD COLUMN scheduled_at DATETIME")
    print("✅ Added: quizzes.scheduled_at")
else:
    print("✓ Exists: quizzes.scheduled_at")

conn.commit()
conn.close()
print("\n🎉 Schedule migration completed!")
