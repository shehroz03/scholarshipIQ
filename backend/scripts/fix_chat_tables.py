
import sys
import os
import sqlite3

# Add backend to path
sys.path.append(os.path.join(os.getcwd()))

from app.db.session import engine
from app.db.models import Base

def fix_schema():
    db_path = 'scholariq.db'
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Checking chat_messages table...")
    cursor.execute("PRAGMA table_info(chat_messages)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'session_id' not in columns:
        print("Missing 'session_id' in chat_messages. Dropping and recreating table to align with model...")
        cursor.execute("DROP TABLE IF EXISTS chat_messages")
        conn.commit()
    
    conn.close()

    print("Running Base.metadata.create_all to ensure all tables and columns match models...")
    Base.metadata.create_all(bind=engine)
    print("Database schema synchronization complete!")

if __name__ == "__main__":
    fix_schema()
