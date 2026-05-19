import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'scholariq.db')

def migrate():
    print(f"Migrating {DB_PATH} to add archiving fields...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    tables = ["scholarships", "scholarship_staging"]
    cols = [
        ("is_archived", "BOOLEAN DEFAULT 0"),
        ("archived_at", "DATETIME"),
        ("archive_reason", "TEXT")
    ]

    for table in tables:
        for col_name, col_type in cols:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name} to {table}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"Column {col_name} already exists in {table}")
                else:
                    print(f"Error adding {col_name} to {table}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
