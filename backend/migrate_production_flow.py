import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'scholariq.db')

def migrate_production_flow():
    print(f"Migrating {DB_PATH} for Production-Style Flow...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create ScholarshipStaging table
    print("Creating scholarship_staging table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scholarship_staging (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR NOT NULL,
            university_name_raw VARCHAR,
            university_id INTEGER,
            country VARCHAR,
            city VARCHAR,
            description TEXT,
            degree_level VARCHAR,
            field_of_study VARCHAR,
            funding_type VARCHAR,
            amount VARCHAR,
            deadline DATETIME,
            eligibility TEXT,
            min_ielts FLOAT,
            min_toefl INTEGER,
            scholarship_url VARCHAR,
            fraud_risk_score FLOAT DEFAULT 0.0,
            fraud_risk_level VARCHAR DEFAULT 'SAFE',
            fraud_reasons TEXT DEFAULT '[]',
            review_status VARCHAR DEFAULT 'pending',
            import_source VARCHAR,
            pipeline_run_id VARCHAR,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_payload_json TEXT
        )
    """)

    # 2. Add columns to pipeline_logs
    print("Updating pipeline_logs table columns...")
    new_logs_columns = [
        ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
        ("pipeline_run_id", "VARCHAR"),
        ("source_url", "VARCHAR"),
        ("event_type", "VARCHAR"),
        ("action_taken", "VARCHAR"),
        ("scholarship_title", "VARCHAR"),
        ("official_url", "VARCHAR"),
        ("message", "TEXT")
    ]

    for col_name, col_type in new_logs_columns:
        try:
            print(f"  Adding column {col_name} to pipeline_logs...")
            cursor.execute(f"ALTER TABLE pipeline_logs ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"    Column {col_name} already exists.")
            else:
                print(f"    Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete! ✅")

if __name__ == "__main__":
    migrate_production_flow()
