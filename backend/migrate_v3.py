import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "scholariq.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column(table, column, type_str):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_str}")
        print(f"✅ Column {column} added to {table} table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"ℹ️ Column {column} already exists in {table}.")
        else:
            print(f"❌ Error adding {column} to {table}: {e}")

# --- Scholarships Table ---
scholarship_cols = [
    ("min_ielts", "FLOAT"),
    ("min_toefl", "INTEGER"),
    ("requires_work_exp", "BOOLEAN DEFAULT 0"),
    ("open_to_pakistani", "BOOLEAN DEFAULT 1"),
]

for col, dtype in scholarship_cols:
    add_column("scholarships", col, dtype)

# --- Users Table ---
user_cols = [
    ("phone_number", "VARCHAR"),
    ("current_degree", "VARCHAR"),
    ("major", "VARCHAR"),
    ("graduation_year", "INTEGER"),
    ("target_country", "VARCHAR"),
    ("target_degree", "VARCHAR"),
    ("english_proficiency", "VARCHAR"),
    ("cgpa_scale", "VARCHAR"),
    ("english_test_type", "VARCHAR"),
    ("ielts_overall", "FLOAT"),
    ("ielts_listening", "FLOAT"),
    ("ielts_reading", "FLOAT"),
    ("ielts_writing", "FLOAT"),
    ("ielts_speaking", "FLOAT"),
    ("toefl_score", "INTEGER"),
    ("pte_score", "INTEGER"),
    ("duolingo_score", "INTEGER"),
    ("target_field", "VARCHAR"),
    ("target_start_year", "INTEGER"),
    ("study_mode", "VARCHAR"),
    ("monthly_family_income", "VARCHAR"),
    ("can_afford_partial", "BOOLEAN DEFAULT 0"),
    ("max_budget_gbp", "FLOAT"),
    ("scholarship_type_pref", "VARCHAR"),
    ("work_experience_years", "VARCHAR"),
    ("work_experience_type", "VARCHAR"),
    ("has_publications", "BOOLEAN DEFAULT 0"),
    ("leadership_activities", "TEXT"),
    ("passport_valid", "BOOLEAN DEFAULT 0"),
    ("transcripts_ready", "BOOLEAN DEFAULT 0"),
    ("sop_ready", "VARCHAR"),
    ("references_count", "INTEGER DEFAULT 0"),
    ("cv_ready", "BOOLEAN DEFAULT 0"),
]

for col, dtype in user_cols:
    add_column("users", col, dtype)

conn.commit()
conn.close()
print("\n🏁 Migration complete.")
