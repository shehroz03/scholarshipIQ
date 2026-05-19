import os
import sqlite3

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "scholariq.db")
    if not os.path.exists(db_path):
        print("Database not found!")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                triggered_by VARCHAR,
                total_found INTEGER,
                inserted INTEGER,
                skipped_fraud INTEGER,
                skipped_duplicate INTEGER,
                skipped_not_masters INTEGER,
                errors TEXT,
                new_scholarships TEXT,
                status VARCHAR
            )
        """)
        conn.commit()
        print("✅ Pipeline Logs table created successfully.")
    except Exception as e:
        print(f"❌ Migration Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
