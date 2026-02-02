import os
import sys
import pandas as pd
import sqlite3
from datetime import datetime
try:
    from pymongo import MongoClient
except ImportError:
    MongoClient = None
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database path for SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")

def import_csv(csv_path):
    print(f"--- 🚀 Starting Australia Import: {csv_path} ---")
    
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

    # --- PART A: MONGODB IMPORT (Optional) ---
    mongodb_uri = os.getenv("MONGODB_URI")
    if mongodb_uri and MongoClient:
        try:
            print("🔗 Connecting to MongoDB...")
            client = MongoClient(mongodb_uri)
            db = client.get_database() 
            collection = db['scholarships']
            
            mongo_docs = []
            for _, row in df.iterrows():
                doc = {
                    "university_name": row['uni_name'],
                    "country": row['uni_country'],
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
                    "original_fee": float(row['original_fee_aud']),
                    "discount_amount": float(row['scholarship_amount_aud']),
                    "final_fee": float(row['after_scholarship_fee_aud']),
                    "cgpa_min": float(row['cgpa_min']),
                    "deadline": str(row['deadline']),
                    "contacts": {
                        "email": row['international_email'],
                        "whatsapp": str(row['whatsapp']),
                        "phone": str(row['phone'])
                    },
                    "apply_steps": str(row['apply_steps']).split('|'),
                    "verified": True,
                    "application_type": row.get('application_type', 'direct_form'),
                    "button_label": row.get('button_label', 'Apply Now 🎯'),
                    "user_note": row.get('user_note', ''),
                    "source_type": "verified_import",
                    "currency": "AUD",
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
        print("⏭️ Skipping MongoDB import.")

    # --- PART B: SQLITE IMPORT ---
    if not os.path.exists(DB_PATH):
        print("⚠️ SQLite DB not found. Skipping SQL import.")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        imported_count = 0
        for _, row in df.iterrows():
            country = row['uni_country']
            
            # 1. Manage University
            cursor.execute("SELECT id FROM universities WHERE name = ?", (row['uni_name'],))
            uni_res = cursor.fetchone()
            
            if uni_res:
                uni_id = uni_res[0]
                cursor.execute("""
                    UPDATE universities 
                    SET city=?, country=?, latitude=?, longitude=?, website_url=?, address=?, 
                        established_year=?, qs_ranking=?, min_cgpa=?, 
                        logo_url=?, image_url=?
                    WHERE id=?
                """, (row['uni_city'], country, row['lat'], row['lng'], row['uni_link'], row['map_address'], 
                      row['founded_year'], row['ranking'], row['cgpa_min'], 
                      row['uni_logo'], row['uni_image'], uni_id))
            else:
                cursor.execute("""
                    INSERT INTO universities (name, city, country, latitude, longitude, website_url, address, 
                                            established_year, qs_ranking, min_cgpa, logo_url, image_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (row['uni_name'], row['uni_city'], country, row['lat'], row['lng'], row['uni_link'], row['map_address'],
                      row['founded_year'], row['ranking'], row['cgpa_min'], row['uni_logo'], row['uni_image']))
                uni_id = cursor.lastrowid
            
            # 2. Manage Scholarship
            cursor.execute("DELETE FROM scholarships WHERE title = ? AND university_id = ?", (row['scholarship_name'], uni_id))
            
            cursor.execute("""
                INSERT INTO scholarships (
                    title, university_id, country, city, 
                    funding_type, amount, deadline, 
                    degree_level, field_of_study, 
                    scholarship_url, website_url,
                    application_type, button_label, user_note,
                    tuition_fee_numeric, tuition_fee_per_year,
                    scholarship_amount_numeric, scholarship_amount_value,
                    net_cost_numeric, net_cost_per_year,
                    tuition_verified, scholarship_verified,
                    latitude, longitude, description, verified_at,
                    currency, is_suspicious
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row['scholarship_name'], uni_id, country, row['uni_city'],
                "Fully Funded" if row['scholarship_amount_aud'] >= row['original_fee_aud'] else "Partial",
                f"A${row['scholarship_amount_aud']}", row['deadline'],
                row['degree_level'], row['field_of_study'],
                row['scholarship_link'], row['uni_link'],
                row['application_type'], row['button_label'], row['user_note'],
                float(row['original_fee_aud']), f"A${row['original_fee_aud']} per year",
                float(row['scholarship_amount_aud']), f"A${row['scholarship_amount_aud']} award",
                float(row['after_scholarship_fee_aud']), f"A${row['after_scholarship_fee_aud']} net",
                "verified", "verified",
                row['lat'], row['lng'], 
                f"Documents: {row['documents_required']} | Steps: {row['apply_steps']}",
                datetime.now().isoformat(),
                "AUD",
                0
            ))
            imported_count += 1
            
        conn.commit()
        conn.close()
        print(f"✅ SQLite: Imported/Updated {imported_count} records.")
        
    except Exception as e:
        print(f"❌ SQL Import Error: {e}")

if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "data/australia_scholarships.csv"
    import_csv(csv_file)
