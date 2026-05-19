import os
import sys
import csv
import sqlite3
from datetime import datetime

# Add backend dir to PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def get_currency_info(row):
    currencies = {
        "gbp": ("GBP", "£"),
        "usd": ("USD", "$"),
        "eur": ("EUR", "€"),
        "cad": ("CAD", "$")
    }
    
    for suffix, info in currencies.items():
        if f"original_fee_{suffix}" in row:
            return info
    return ("USD", "$") # Default

def import_all_verified():
    print("=== Starting Global Verified Scholarship Import ===")
    
    if not os.path.exists(DATA_DIR):
        print(f"❌ Error: Data directory not found at {DATA_DIR}")
        return

    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.csv') and not f.endswith('_fraud_log.json')]
    
    # Sort files to ensure consistency
    csv_files.sort()
        
    print(f"Found {len(csv_files)} CSV files to process.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    total_inserted = 0
    total_updated = 0

    for csv_file in csv_files:
        path = os.path.join(DATA_DIR, csv_file)
        print(f"\nProcessing: {csv_file}")
        
        try:
            with open(path, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    # Basic validation
                    if not row.get('scholarship_name') or not row.get('uni_name'):
                        continue

                    # 1. Manage University
                    country = row.get('uni_country', '')
                    if country == "UK": country = "United Kingdom"
                    
                    cursor.execute("SELECT id FROM universities WHERE name = ?", (row.get('uni_name'),))
                    uni_res = cursor.fetchone()
                    
                    uni_data = (
                        row.get('uni_city'), 
                        country, 
                        row.get('lat'), 
                        row.get('lng'), 
                        row.get('uni_link'), 
                        row.get('map_address', row.get('address', '')), 
                        row.get('cgpa_min', 0.0),
                        row.get('phone', '')
                    )

                    if uni_res:
                        uni_id = uni_res[0]
                        cursor.execute("""
                            UPDATE universities 
                            SET city=?, country=?, latitude=?, longitude=?, website_url=?, address=?, min_cgpa=?, phone=?
                            WHERE id=?
                        """, uni_data + (uni_id,))
                    else:
                        cursor.execute("""
                            INSERT INTO universities (name, city, country, latitude, longitude, website_url, address, min_cgpa, phone)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (row.get('uni_name'),) + uni_data)
                        uni_id = cursor.lastrowid

                    # 2. Extract Values
                    currency_code, currency_symbol = get_currency_info(row)
                    
                    suffix = currency_code.lower()
                    amount_val = row.get(f"scholarship_amount_{suffix}", "0").replace(",", "").replace("$", "").replace("£", "").strip()
                    fee_val = row.get(f"original_fee_{suffix}", "0").replace(",", "").replace("$", "").replace("£", "").strip()
                    net_val = row.get(f"after_scholarship_fee_{suffix}", "0").replace(",", "").replace("$", "").replace("£", "").strip()
                    
                    try:
                        amount_numeric = float(amount_val) if amount_val else 0.0
                    except:
                        amount_numeric = 0.0
                        
                    try:
                        fee_numeric = float(fee_val) if fee_val else 0.0
                    except:
                        fee_numeric = 0.0
                        
                    try:
                        net_numeric = float(net_val) if net_val else 0.0
                    except:
                        net_numeric = 0.0

                    # 3. Manage Scholarship
                    cursor.execute("SELECT id FROM scholarships WHERE title = ? AND university_id = ?", (row.get('scholarship_name'), uni_id))
                    exists = cursor.fetchone()

                    scholarship_fields = (
                        uni_id,
                        row.get('uni_name'),
                        row.get('scholarship_name'),
                        row.get('scholarship_link', ''),
                        row.get('uni_link', ''),
                        row.get('degree_level', 'Masters'),
                        row.get('field_of_study', 'All Fields'),
                        f"{currency_symbol}{amount_val}" if amount_val else "Varies",
                        amount_numeric,
                        f"{currency_symbol}{fee_val}" if fee_val else "Varies",
                        fee_numeric,
                        f"{currency_symbol}{net_val}" if net_val else "Varies",
                        net_numeric,
                        currency_code,
                        row.get('deadline', ''),
                        row.get('documents_required', row.get('eligibility', '')),
                        row.get('apply_steps', ''),
                        float(row.get('cgpa_min') or 0.0),
                        'SAFE',
                        0.0,
                        '[]',
                        True,
                        row.get('application_type', 'Manual'), # New Field
                        datetime.now().isoformat()
                    )

                    if exists:
                        cursor.execute("""
                            UPDATE scholarships 
                            SET university_id=?, university_name=?, title=?, scholarship_url=?, website_url=?, 
                                degree_level=?, field_of_study=?, scholarship_amount_value=?, scholarship_amount_numeric=?, 
                                tuition_fee_per_year=?, tuition_fee_numeric=?, net_cost_per_year=?, net_cost_numeric=?, 
                                currency=?, deadline=?, eligibility=?, description=?, min_cgpa=?, 
                                fraud_risk_level=?, fraud_risk_score=?, fraud_reasons=?, is_active=?, application_type=?
                            WHERE id=?
                        """, scholarship_fields[:-1] + (exists[0],))
                        total_updated += 1
                    else:
                        cursor.execute("""
                            INSERT INTO scholarships (
                                university_id, university_name, title, scholarship_url, website_url, 
                                degree_level, field_of_study, scholarship_amount_value, scholarship_amount_numeric, 
                                tuition_fee_per_year, tuition_fee_numeric, net_cost_per_year, net_cost_numeric, 
                                currency, deadline, eligibility, description, min_cgpa, 
                                fraud_risk_level, fraud_risk_score, fraud_reasons, is_active, application_type, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, scholarship_fields)
                        total_inserted += 1

            conn.commit()
        except Exception as e:
            print(f"  Error processing {csv_file}: {e}")
            conn.rollback()

    conn.close()
    print(f"\n=== Import Complete ===")
    print(f"Total Inserted: {total_inserted}")
    print(f"Total Updated: {total_updated}")
    print(f"Total Scholarships in DB: {total_inserted + total_updated}")

if __name__ == "__main__":
    import_all_verified()
