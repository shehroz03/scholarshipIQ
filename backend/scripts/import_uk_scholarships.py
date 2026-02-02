import os
import sys
import pandas as pd
import sqlite3
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database path for SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")

def import_csv(csv_path):
    print(f"--- 🚀 Starting Import: {csv_path} ---")
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found at {csv_path}")
        return

    # 1. Read CSV using pandas
    try:
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(df)} records from CSV.")
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return

    # --- PART A: MONGODB IMPORT ---
    mongodb_uri = os.getenv("MONGODB_URI")
    if mongodb_uri:
        try:
            print("🔗 Connecting to MongoDB...")
            client = MongoClient(mongodb_uri)
            db = client.get_database() 
            collection = db['scholarships']
            
            mongo_docs = []
            for _, row in df.iterrows():
                # Map according to User Requirements
                country = row['uni_country']
                if country == "UK": country = "United Kingdom"
                
                doc = {
                    "university_name": row['uni_name'],
                    "country": country,
                    "city": row['uni_city'],
                    "location": {
                        "lat": float(row['lat']),
                        "lng": float(row['lng']),
                        "address": row['map_address']
                    },
                    "scholarship_name": row['scholarship_name'],
                    "scholarship_link": row['scholarship_link'],
                    "degree_level": row['degree_level'],
                    "field_of_study": row['field_of_study'],
                    "original_fee": float(row['original_fee_gbp']),
                    "discount_amount": float(row['scholarship_amount_gbp']),
                    "final_fee": float(row['after_scholarship_fee_gbp']),
                    "cgpa_min": float(row['cgpa_min']),
                    "deadline": str(row['deadline']),
                    "documents": str(row['documents_required']).split('|'),
                    "contacts": {
                        "email": row['international_email'],
                        "whatsapp": str(row['whatsapp']),
                        "phone": str(row['phone'])
                    },
                    "apply_steps": str(row['apply_steps']).split('|'),
                    "verified": True,
                    "has_separate_form": str(row.get('has_separate_form', 'true')).lower() == 'true',
                    "application_type": row.get('application_type', 'direct_form'),
                    "button_label": row.get('button_label', 'Apply Now 🎯'),
                    "user_note": row.get('user_note', ''),
                    "source_type": "verified_import",
                    "currency": "GBP",
                    "imported_at": datetime.now().isoformat()
                }
                mongo_docs.append(doc)
            
            if mongo_docs:
                result = collection.insert_many(mongo_docs)
                print(f"✅ MongoDB: Inserted {len(result.inserted_ids)} scholarships.")
            client.close()
        except Exception as e:
            print(f"⚠️ MongoDB Import Warning: {e}")
    else:
        print("⏭️ Skipping MongoDB import (MONGODB_URI not found).")

    # --- PART B: SQLITE IMPORT (Required for Search Engine) ---
    if not os.path.exists(DB_PATH):
        print("⚠️ SQLite DB not found. Skipping SQL import.")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        imported_count = 0
        for _, row in df.iterrows():
            # Normalize Country
            country = row['uni_country']
            if country == "UK": country = "United Kingdom"

            # 1. Manage University
            cursor.execute("SELECT id FROM universities WHERE name = ?", (row['uni_name'],))
            uni_res = cursor.fetchone()
            
            if uni_res:
                uni_id = uni_res[0]
                # Update info if needed
                cursor.execute("""
                    UPDATE universities 
                    SET city=?, country=?, latitude=?, longitude=?, website_url=?, address=?, min_cgpa=?
                    WHERE id=?
                """, (row['uni_city'], country, row['lat'], row['lng'], row['uni_link'], row['map_address'], row['cgpa_min'], uni_id))
            else:
                cursor.execute("""
                    INSERT INTO universities (name, city, country, latitude, longitude, website_url, address, min_cgpa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (row['uni_name'], row['uni_city'], country, row['lat'], row['lng'], row['uni_link'], row['map_address'], row['cgpa_min']))
                uni_id = cursor.lastrowid
            
            # 2. Manage Scholarship
            # Delete existing to refresh data
            cursor.execute("DELETE FROM scholarships WHERE title = ? AND university_id = ?", (row['scholarship_name'], uni_id))
            
            # Note: We clear old non-verified data before, so we just insert these as verified
            deadline_val = row['deadline']
            
            cursor.execute("""
                INSERT INTO scholarships (
                    title, university_id, country, city, 
                    funding_type, amount, deadline, 
                    degree_level, field_of_study, 
                    scholarship_url, website_url,
                    has_separate_form,
                    application_type, button_label, user_note,
                    tuition_fee_numeric, tuition_fee_per_year,
                    scholarship_amount_numeric, scholarship_amount_value,
                    net_cost_numeric, net_cost_per_year,
                    tuition_verified, scholarship_verified,
                    latitude, longitude, description, verified_at,
                    currency, is_suspicious
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row['scholarship_name'], uni_id, country, row['uni_city'],
                "Fully Funded" if row['scholarship_amount_gbp'] >= row['original_fee_gbp'] else "Partial",
                f"£{row['scholarship_amount_gbp']}", deadline_val,
                row['degree_level'], row['field_of_study'],
                row['scholarship_link'], row['uni_link'],
                1 if str(row.get('has_separate_form', 'true')).lower() == 'true' else 0,
                row.get('application_type', 'direct_form'),
                row.get('button_label', 'Apply Now 🎯'),
                row.get('user_note', ''),
                float(row['original_fee_gbp']), f"£{row['original_fee_gbp']} per year",
                float(row['scholarship_amount_gbp']), f"£{row['scholarship_amount_gbp']} award",
                float(row['after_scholarship_fee_gbp']), f"£{row['after_scholarship_fee_gbp']} net",
                "verified", "verified",
                row['lat'], row['lng'], 
                f"Documents: {row['documents_required']} | Steps: {row['apply_steps']}",
                datetime.now().isoformat(),
                "GBP",
                0
            ))
            imported_count += 1
            
        conn.commit()
        conn.close()
        print(f"✅ SQLite: Imported/Updated {imported_count} records.")
        
    except Exception as e:
        print(f"❌ SQL Import Error: {e}")

if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "data/UK_Masters_Top20_Verified.csv"
    import_csv(csv_file)
