import sqlite3
import os

def check_and_fix_schema():
    db_path = 'scholariq.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Required columns for User model (the ones likely missing)
    required_user_columns = [
        ('subscription_plan', 'TEXT DEFAULT "free"'),
        ('subscription_expires', 'DATETIME'),
        ('subscription_started', 'DATETIME'),
        ('messages_today', 'INTEGER DEFAULT 0'),
        ('messages_reset_date', 'DATETIME')
    ]

    for col_name, col_type in required_user_columns:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to users table.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding column {col_name}: {e}")

    # Also check if consultant_messages table exists
    try:
        cursor.execute("SELECT 1 FROM consultant_messages LIMIT 1")
    except sqlite3.OperationalError:
        print("Creating consultant_messages table...")
        cursor.execute("""
            CREATE TABLE consultant_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_id TEXT DEFAULT "default",
                role TEXT,
                content TEXT,
                tokens_used INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)

    conn.commit()
    conn.close()
    print("Schema check complete.")

if __name__ == "__main__":
    check_and_fix_schema()
