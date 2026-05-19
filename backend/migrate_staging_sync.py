import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'scholariq.db')

def migrate_staging_fields():
    print(f"Migrating staging table in {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    new_cols = [
        ("tuition_fee_per_year", "TEXT"),
        ("tuition_fee_numeric", "FLOAT"),
        ("scholarship_amount_value", "TEXT"),
        ("scholarship_amount_numeric", "FLOAT"),
        ("scholarship_type", "TEXT"),
        ("currency", "TEXT"),
        ("net_cost_per_year", "TEXT"),
        ("net_cost_numeric", "FLOAT"),
        ("min_cgpa", "FLOAT"),
        ("requires_work_exp", "BOOLEAN DEFAULT 0"),
        ("open_to_pakistani", "BOOLEAN DEFAULT 1"),
        ("website_url", "TEXT")
    ]

    for col_name, col_type in new_cols:
        try:
            cursor.execute(f"ALTER TABLE scholarship_staging ADD COLUMN {col_name} {col_type}")
            print(f"Added column: {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate_staging_fields()
