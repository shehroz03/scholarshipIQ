"""Add payment columns to enrollments table (SQLite-safe)."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "scholariq.db")

COLUMNS = [
    ("payment_status", "TEXT DEFAULT 'paid'"),
    ("payment_method", "TEXT"),
    ("payment_reference", "TEXT"),
    ("amount_paid", "REAL"),
    ("paid_at", "TEXT"),
]


def migrate():
    if not os.path.exists(DB_PATH):
        print(f"No database at {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(enrollments)")
    existing = {row[1] for row in cur.fetchall()}
    for name, col_type in COLUMNS:
        if name not in existing:
            cur.execute(f"ALTER TABLE enrollments ADD COLUMN {name} {col_type}")
            print(f"Added column: {name}")
        else:
            print(f"Column exists: {name}")
    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
