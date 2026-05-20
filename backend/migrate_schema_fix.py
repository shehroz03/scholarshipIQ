"""Add missing columns for teacher dashboard (SQLite)."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "scholariq.db")

MIGRATIONS = [
    ("courses", "subject", "TEXT"),
    ("quizzes", "scheduled_at", "TEXT"),
]


def migrate():
    if not os.path.exists(DB_PATH):
        print("No database found")
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    for table, column, col_type in MIGRATIONS:
        cur.execute(f"PRAGMA table_info({table})")
        existing = {row[1] for row in cur.fetchall()}
        if column not in existing:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"Added {table}.{column}")
    conn.commit()
    conn.close()
    print("Schema migration complete.")


if __name__ == "__main__":
    migrate()
