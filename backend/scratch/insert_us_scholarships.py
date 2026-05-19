import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))

def insert_us_scholarships():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Define the scholarships to insert
    future_deadline = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")

    scholarships = [
        (
            "Knight-Hennessy Scholars Program",  # title
            62,  # university_id (Stanford)
            "USA",  # country
            "Stanford",  # city
            "Full Tuition",  # funding_type
            "Full Tuition + $40,000 Stipend",  # amount
            future_deadline,  # deadline
            "85000",  # tuition_fee_per_year
            85000.0,  # tuition_fee_numeric
            "125000",  # scholarship_amount_value
            125000.0,  # scholarship_amount_numeric
            "0",  # net_cost_per_year
            0.0,  # net_cost_numeric
            "A prestigious fellowship supporting outstanding graduate students at Stanford University across all disciplines.",  # description
            "Masters",  # degree_level
            "Computer Science",  # field_of_study
            "Highly competitive global fellowship",  # eligibility
            "2 Years",  # duration_text
            0,  # is_suspicious
            "https://knight-hennessy.stanford.edu/",  # website_url
            "https://knight-hennessy.stanford.edu/admission",  # scholarship_url
            0,  # has_separate_form
            "Online",  # application_type
            "Apply via Stanford",  # button_label
            2.5,  # min_cgpa
            6.5,  # min_ielts
            1,  # is_active
            0  # is_archived
        ),
        (
            "Harvard Graduate Fellowship",  # title
            61,  # university_id (Harvard)
            "USA",  # country
            "Cambridge",  # city
            "Full Tuition",  # funding_type
            "Full Tuition + Health Insurance",  # amount
            future_deadline,  # deadline
            "75000",  # tuition_fee_per_year
            75000.0,  # tuition_fee_numeric
            "75000",  # scholarship_amount_value
            75000.0,  # scholarship_amount_numeric
            "0",  # net_cost_per_year
            0.0,  # net_cost_numeric
            "Full tuition fellowship awarded to exceptional international master's students demonstrating academic excellence.",  # description
            "Masters",  # degree_level
            "Computer Science",  # field_of_study
            "Merit-based funding for graduate scholars",  # eligibility
            "1-2 Years",  # duration_text
            0,  # is_suspicious
            "https://www.harvard.edu/",  # website_url
            "https://gsas.harvard.edu/financial-support",  # scholarship_url
            0,  # has_separate_form
            "Online",  # application_type
            "Apply via Harvard",  # button_label
            2.7,  # min_cgpa
            6.5,  # min_ielts
            1,  # is_active
            0  # is_archived
        ),
        (
            "MIT Presidential Graduate Fellowship",  # title
            60,  # university_id (MIT)
            "USA",  # country
            "Cambridge",  # city
            "Full Tuition",  # funding_type
            "Full Tuition + Monthly Stipend",  # amount
            future_deadline,  # deadline
            "90000",  # tuition_fee_per_year
            90000.0,  # tuition_fee_numeric
            "130000",  # scholarship_amount_value
            130000.0,  # scholarship_amount_numeric
            "0",  # net_cost_per_year
            0.0,  # net_cost_numeric
            "Prestigious fellowship awarded to outstanding incoming graduate students, covering tuition and living expenses.",  # description
            "Masters",  # degree_level
            "Computer Science",  # field_of_study
            "Top-tier graduate recruits in STEM and CS",  # eligibility
            "1 Year (Renewable)",  # duration_text
            0,  # is_suspicious
            "https://www.mit.edu/",  # website_url
            "https://oge.mit.edu/fellowships/mit-fellowships/",  # scholarship_url
            0,  # has_separate_form
            "Online",  # application_type
            "Apply via MIT",  # button_label
            2.7,  # min_cgpa
            7.0,  # min_ielts
            1,  # is_active
            0  # is_archived
        )
    ]

    # Insert into database
    query = """
        INSERT INTO scholarships (
            title, university_id, country, city, funding_type, amount, deadline,
            tuition_fee_per_year, tuition_fee_numeric, scholarship_amount_value, scholarship_amount_numeric,
            net_cost_per_year, net_cost_numeric, description, degree_level, field_of_study,
            eligibility, duration_text, is_suspicious, website_url, scholarship_url,
            has_separate_form, application_type, button_label, min_cgpa, min_ielts, is_active, is_archived
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        );
    """

    for s in scholarships:
        # Check if already exists
        cursor.execute("SELECT id FROM scholarships WHERE title = ? AND university_id = ?;", (s[0], s[1]))
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(query, s)
            print(f"Successfully inserted: {s[0]}")
        else:
            print(f"Already exists: {s[0]}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    insert_us_scholarships()
