import sqlite3
import os

def fix_scholarship_schema():
    db_path = 'scholariq.db'
    if not os.path.exists(db_path):
        # Try parent dir if running from scripts/
        db_path = '../scholariq.db'
        if not os.path.exists(db_path):
            print("Database not found.")
            return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add university_name to scholarships if missing
    try:
        cursor.execute("ALTER TABLE scholarships ADD COLUMN university_name TEXT")
        print("Added column university_name to scholarships table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column university_name already exists.")
        else:
            print(f"Error: {e}")

    # Also add is_archived if missing (User mentioned it should be False)
    try:
        cursor.execute("ALTER TABLE scholarships ADD COLUMN is_archived BOOLEAN DEFAULT 0")
        print("Added column is_archived to scholarships table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column is_archived already exists.")

    conn.commit()
    conn.close()
    print("Database fix complete.")

if __name__ == "__main__":
    fix_scholarship_schema()
