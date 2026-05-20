import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "scholariq.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(courses)")
    cols = {row[1] for row in cur.fetchall()}
    if "subject" not in cols:
        cur.execute("ALTER TABLE courses ADD COLUMN subject TEXT")
        print("Added courses.subject")
    conn.commit()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    migrate()
