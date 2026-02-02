import sqlite3
import os

DB_PATH = "scholariq.db"

def add_columns():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(scholarships)")
    cols = [row[1] for row in cursor.fetchall()]
    
    if 'application_type' not in cols:
        print("Adding application_type...")
        cursor.execute("ALTER TABLE scholarships ADD COLUMN application_type TEXT DEFAULT 'direct_form'")
        
    if 'button_label' not in cols:
        print("Adding button_label...")
        cursor.execute("ALTER TABLE scholarships ADD COLUMN button_label TEXT DEFAULT 'Apply Now 🎯'")
        
    if 'user_note' not in cols:
        print("Adding user_note...")
        cursor.execute("ALTER TABLE scholarships ADD COLUMN user_note TEXT")
        
    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    add_columns()
