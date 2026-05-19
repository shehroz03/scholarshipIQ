import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'scholariq.db')

def migrate_v4_fraud():
    print(f"Migrating {DB_PATH} for Fraud Detection...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns_to_add = [
        ("fraud_risk_score", "FLOAT DEFAULT 0.0"),
        ("fraud_risk_level", "VARCHAR(50) DEFAULT 'SAFE'"),
        ("fraud_reasons", "TEXT DEFAULT '[]'"),
        ("last_fraud_check", "DATETIME"),
        ("auto_flagged", "BOOLEAN DEFAULT 0"),
        ("is_active", "BOOLEAN DEFAULT 1")
    ]

    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE scholarships ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"  Column {col_name} already exists.")
            else:
                print(f"  Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete! ✅")

if __name__ == "__main__":
    migrate_v4_fraud()
