import sqlite3
import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(__file__), 'scholariq.db')
DATABASE_URL = f"sqlite:///{DB_PATH}"

def get_db_stats():
    print(f"Checking Database: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("DATABASE FILE NOT FOUND!")
        return

    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Found Tables: {', '.join(tables)}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    checks = [
        ("scholarships", "Scholarship"),
        ("scholarship_staging", "ScholarshipStaging"),
        ("pipeline_logs", "PipelineLog"),
        ("universities", "University"),
        ("users", "User")
    ]

    for table in tables:
        print(f"--- {table.capitalize()} (Table: {table}) ---")
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Count: {count}")
        
        # Check if title or name exists
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [c[1] for c in cursor.fetchall()]
        
        label_col = None
        if "title" in columns:
            label_col = "title"
        elif "name" in columns:
            label_col = "name"
            
        if label_col:
            cursor.execute(f"SELECT id, {label_col} FROM {table} ORDER BY id DESC LIMIT 5")
            rows = cursor.fetchall()
            for row in rows:
                print(f"  ID: {row[0]}, {label_col.capitalize()}: {row[1]}")
        print("-" * 30)

    conn.close()

if __name__ == "__main__":
    get_db_stats()
