import sqlite3
import os

def repair():
    db_path = "scholariq.db"
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def add_column(table, column, type_def):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
            print(f"[OK] Added {column} to {table}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                pass
            else:
                print(f"[ERROR] Error adding {column} to {table}: {e}")

    # --- USERS TABLE ---
    user_cols = [
        ("phone_number", "TEXT"),
        ("current_degree", "TEXT"),
        ("major", "TEXT"),
        ("graduation_year", "INTEGER"),
        ("target_country", "TEXT"),
        ("target_degree", "TEXT"),
        ("english_proficiency", "TEXT"),
        ("research_experience", "BOOLEAN DEFAULT 0"),
        ("cgpa_scale", "TEXT"),
        ("english_test_type", "TEXT"),
        ("ielts_overall", "FLOAT"),
        ("ielts_listening", "FLOAT"),
        ("ielts_reading", "FLOAT"),
        ("ielts_writing", "FLOAT"),
        ("ielts_speaking", "FLOAT"),
        ("toefl_score", "INTEGER"),
        ("pte_score", "INTEGER"),
        ("duolingo_score", "INTEGER"),
        ("target_field", "TEXT"),
        ("target_start_year", "INTEGER"),
        ("study_mode", "TEXT"),
        ("monthly_family_income", "TEXT"),
        ("can_afford_partial", "BOOLEAN DEFAULT 0"),
        ("max_budget_gbp", "FLOAT"),
        ("scholarship_type_pref", "TEXT"),
        ("work_experience_years", "TEXT"),
        ("work_experience_type", "TEXT"),
        ("has_publications", "BOOLEAN DEFAULT 0"),
        ("leadership_activities", "TEXT"),
        ("passport_valid", "BOOLEAN DEFAULT 0"),
        ("transcripts_ready", "BOOLEAN DEFAULT 0"),
        ("sop_ready", "TEXT"),
        ("references_count", "INTEGER DEFAULT 0"),
        ("cv_ready", "BOOLEAN DEFAULT 0"),
        ("subscription_plan", "TEXT DEFAULT 'free'"),
        ("subscription_expires", "DATETIME"),
        ("subscription_started", "DATETIME"),
        ("messages_today", "INTEGER DEFAULT 0"),
        ("messages_reset_date", "DATETIME")
    ]
    for col, dtype in user_cols:
        add_column("users", col, dtype)

    # --- RENAME university TO university_name if it exists as VARCHAR ---
    try:
        cursor.execute("PRAGMA table_info(scholarships)")
        cols = [c[1] for c in cursor.fetchall()]
        if "university" in cols and "university_name" not in cols:
            cursor.execute("ALTER TABLE scholarships RENAME COLUMN university TO university_name")
            print("[OK] Renamed 'university' column to 'university_name'")
        elif "university" in cols and "university_name" in cols:
            # Maybe copy data if university_name is empty
            cursor.execute("UPDATE scholarships SET university_name = university WHERE university_name IS NULL")
            print("[OK] Synced 'university' to 'university_name'")
    except Exception as e:
        print(f"[ERROR] Renaming university column: {e}")

    # --- SCHOLARSHIPS TABLE ---
    scholarship_cols = [
        ("university_id", "INTEGER"),
        ("is_active", "BOOLEAN DEFAULT 1"),
        ("is_archived", "BOOLEAN DEFAULT 0"),
        ("archived_at", "DATETIME"),
        ("archive_reason", "TEXT"),
        ("tuition_fee_per_year", "TEXT"),
        ("tuition_fee_numeric", "FLOAT"),
        ("scholarship_amount_value", "TEXT"),
        ("scholarship_amount_numeric", "FLOAT"),
        ("scholarship_type", "TEXT"),
        ("currency", "TEXT"),
        ("net_cost_per_year", "TEXT"),
        ("net_cost_numeric", "FLOAT"),
        ("net_cost_assumptions", "TEXT"),
        ("tuition_verified", "TEXT DEFAULT 'not_verified'"),
        ("scholarship_verified", "TEXT DEFAULT 'not_verified'"),
        ("tuition_source_url", "TEXT"),
        ("scholarship_source_url", "TEXT"),
        ("verification_notes", "TEXT"),
        ("verified_at", "DATETIME"),
        ("min_cgpa", "FLOAT"),
        ("min_ielts", "FLOAT"),
        ("min_toefl", "INTEGER"),
        ("requires_work_exp", "BOOLEAN DEFAULT 0"),
        ("open_to_pakistani", "BOOLEAN DEFAULT 1"),
        ("application_type", "TEXT DEFAULT 'direct_form'"),
        ("button_label", "TEXT DEFAULT 'Apply Now'"),
        ("user_note", "TEXT"),
        ("fraud_risk_score", "FLOAT DEFAULT 0.0"),
        ("fraud_risk_level", "TEXT DEFAULT 'SAFE'"),
        ("fraud_reasons", "TEXT DEFAULT '[]'"),
        ("last_fraud_check", "DATETIME"),
        ("auto_flagged", "BOOLEAN DEFAULT 0")
    ]
    for col, dtype in scholarship_cols:
        add_column("scholarships", col, dtype)

    # --- UNIVERSITIES TABLE ---
    uni_cols = [
        ("phone", "TEXT"),
        ("address", "TEXT"),
        ("established_year", "INTEGER"),
        ("qs_ranking", "INTEGER"),
        ("logo_url", "TEXT"),
        ("image_url", "TEXT"),
        ("short_description", "TEXT"),
        ("campus_type", "TEXT"),
        ("official_contact_page", "TEXT"),
        ("min_cgpa", "FLOAT"),
        ("min_ielts", "FLOAT"),
        ("min_toefl", "INTEGER"),
        ("min_pte", "INTEGER"),
        ("minimum_cgpa_or_grade", "TEXT"),
        ("english_language_requirements", "TEXT"),
        ("other_academic_requirements", "TEXT"),
        ("required_documents", "TEXT"),
        ("admission_process", "TEXT"),
        ("admission_notes", "TEXT")
    ]
    for col, dtype in uni_cols:
        add_column("universities", col, dtype)

    # --- CREATE MISSING TABLES ---
    tables = {
        "consultant_messages": """
            CREATE TABLE consultant_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_id TEXT DEFAULT 'default',
                role TEXT,
                content TEXT,
                tokens_used INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """,
        "notifications": """
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                scholarship_id INTEGER,
                type TEXT,
                title TEXT,
                message TEXT,
                is_read BOOLEAN DEFAULT 0,
                action_url TEXT,
                status TEXT DEFAULT 'sent',
                sent_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
            )
        """,
        "user_scholarship_interactions": """
            CREATE TABLE user_scholarship_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                scholarship_id INTEGER,
                interaction_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
            )
        """,
        "visa_profiles": """
            CREATE TABLE visa_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                target_country TEXT,
                intake_term TEXT,
                intended_start_date DATETIME,
                passport_status TEXT,
                admission_status TEXT,
                scholarship_status TEXT,
                funding_source TEXT,
                bank_statement_available BOOLEAN DEFAULT 0,
                language_test_type TEXT,
                language_test_score TEXT,
                tuberculosis_test_status TEXT DEFAULT 'not_done',
                health_insurance_status TEXT DEFAULT 'not_done',
                previous_visa_refusal BOOLEAN DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """,
        "visa_checklists": """
            CREATE TABLE visa_checklists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                visa_profile_id INTEGER,
                country_code TEXT,
                readiness_score INTEGER,
                status_summary TEXT,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                version_tag TEXT DEFAULT 'v1.0',
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(visa_profile_id) REFERENCES visa_profiles(id)
            )
        """,
        "visa_checklist_items": """
            CREATE TABLE visa_checklist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                checklist_id INTEGER,
                document_key TEXT,
                title TEXT,
                status TEXT,
                reason TEXT,
                action_hint TEXT,
                deadline_hint TEXT,
                sort_order INTEGER DEFAULT 0,
                FOREIGN KEY(checklist_id) REFERENCES visa_checklists(id)
            )
        """
    }

    for table_name, create_sql in tables.items():
        try:
            cursor.execute(f"SELECT 1 FROM {table_name} LIMIT 1")
            print(f"[INFO] Table {table_name} already exists.")
        except sqlite3.OperationalError:
            print(f"[WORK] Creating table {table_name}...")
            cursor.execute(create_sql)
            print(f"[OK] Table {table_name} created.")

    # --- ATTEMPT DATA FIXING ---
    try:
        cursor.execute("SELECT id FROM universities LIMIT 1")
        first_uni = cursor.fetchone()
        if first_uni:
            cursor.execute("UPDATE scholarships SET university_id = ? WHERE university_id IS NULL", (first_uni[0],))
            print("[INFO] Patched missing university_id in scholarships.")
    except:
        pass

    conn.commit()
    conn.close()
    print("\n[DONE] Database repair complete.")

if __name__ == "__main__":
    repair()
