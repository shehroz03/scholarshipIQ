import os
import sys
import csv
import json
import sqlite3
from datetime import datetime

# Add backend dir to PYTHONPATH to import services
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.services.fraud_detection import calculate_fraud_risk
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")

def import_csv(path: str):
    print(f"--- Starting Import: {path} ---")
    
    if not os.path.exists(path):
        print(f"❌ Error: CSV file not found at {path}")
        return

    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        inserted = 0
        skipped = 0
        flagged_log = []
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        for row in reader:
            # Handle currency variations
            amount_val = float(row.get("scholarship_amount_gbp") or row.get("scholarship_amount_cad") or row.get("scholarship_amount_eur") or row.get("scholarship_amount_usd") or 0)
            fee_val = float(row.get("original_fee_gbp") or row.get("original_fee_cad") or row.get("original_fee_eur") or row.get("original_fee_usd") or 0)
            net_val = float(row.get("after_scholarship_fee_gbp") or row.get("after_scholarship_fee_cad") or row.get("after_scholarship_fee_eur") or row.get("after_scholarship_fee_usd") or 0)

            # Build scholarship-like dict for fraud check
            scholarship_data = {
                "title": row.get("scholarship_name", ""),
                "description": row.get("apply_steps", ""),
                "scholarship_url": row.get("scholarship_link", ""),
                "website_url": row.get("uni_link", ""),
                "scholarship_amount_value": amount_val,
                "tuition_fee_per_year": fee_val,
                "cgpa_min": float(row.get("cgpa_min") or 0),
                "international_email": row.get("international_email", ""),
            }

            # Run fraud check
            fraud_result = calculate_fraud_risk(scholarship_data)

            print(f"  [{fraud_result['risk_level']}] {row['scholarship_name']} - Score: {fraud_result['risk_score']}")

            if fraud_result["risk_level"] in ["HIGH", "CRITICAL"]:
                skipped += 1
                flagged_log.append({
                    "name": row.get("scholarship_name", ""),
                    "risk_level": fraud_result["risk_level"],
                    "risk_score": fraud_result["risk_score"],
                    "reasons": fraud_result["reasons"],
                })
                print(f"  SKIPPED: {row.get('scholarship_name', '')} - Reasons: {fraud_result['reasons']}")
                continue  # Do NOT insert

            # Insert into DB (existing logic)
            country = row.get('uni_country', '')
            if country == "UK": country = "United Kingdom"

            # 1. Manage University
            cursor.execute("SELECT id FROM universities WHERE name = ?", (row.get('uni_name', ''),))
            uni_res = cursor.fetchone()
            
            if uni_res:
                uni_id = uni_res[0]
                cursor.execute("""
                    UPDATE universities 
                    SET city=?, country=?, latitude=?, longitude=?, website_url=?, address=?, min_cgpa=?
                    WHERE id=?
                """, (row.get('uni_city'), country, row.get('lat'), row.get('lng'), row.get('uni_link'), row.get('map_address'), row.get('cgpa_min'), uni_id))
            else:
                cursor.execute("""
                    INSERT INTO universities (name, city, country, latitude, longitude, website_url, address, min_cgpa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (row.get('uni_name'), row.get('uni_city'), country, row.get('lat'), row.get('lng'), row.get('uni_link'), row.get('map_address'), row.get('cgpa_min')))
                uni_id = cursor.lastrowid
            
            # 2. Manage Scholarship
            cursor.execute("DELETE FROM scholarships WHERE title = ? AND university_id = ?", (row.get('scholarship_name'), uni_id))
            
            if "original_fee_cad" in row:
                currency = "CAD"
                currency_symbol = "$"
            elif "original_fee_eur" in row:
                currency = "EUR"
                currency_symbol = "€"
            elif "original_fee_usd" in row:
                currency = "USD"
                currency_symbol = "$"
            else:
                currency = "GBP"
                currency_symbol = "£"

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
                    currency, is_suspicious, fraud_risk_score, fraud_risk_level, fraud_reasons, last_fraud_check
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row.get('scholarship_name'), uni_id, country, row.get('uni_city'),
                "Fully Funded" if amount_val >= fee_val and fee_val > 0 else "Partial",
                f"{currency_symbol}{amount_val}", row.get('deadline'),
                row.get('degree_level'), row.get('field_of_study'),
                row.get('scholarship_link'), row.get('uni_link'),
                1 if str(row.get('has_separate_form', 'true')).lower() == 'true' else 0,
                row.get('application_type', 'direct_form'),
                row.get('button_label', 'Apply Now 🎯'),
                row.get('user_note', ''),
                fee_val, f"{currency_symbol}{fee_val} per year",
                amount_val, f"{currency_symbol}{amount_val} award",
                net_val, f"{currency_symbol}{net_val} net",
                "verified", "verified",
                row.get('lat'), row.get('lng'), 
                f"Documents: {row.get('documents_required', '')} | Steps: {row.get('apply_steps', '')}",
                datetime.now().isoformat(),
                currency,
                0,
                fraud_result["risk_score"],
                fraud_result["risk_level"],
                json.dumps(fraud_result["reasons"]),
                datetime.now().isoformat()
            ))
            
            inserted += 1
            print(f"  INSERTED: {row.get('scholarship_name')}")

        conn.commit()
        conn.close()

        # Final summary
        print("\n" + "="*50)
        print(f"Total processed : {inserted + skipped}")
        print(f"Inserted (safe) : {inserted}")
        print(f"Skipped (fraud) : {skipped}")

        if flagged_log:
            print("\nFlagged scholarships:")
            for f in flagged_log:
                print(f"  - {f['name']} | {f['risk_level']} | Score: {f['risk_score']}")
                print(f"    Reasons: {', '.join(f['reasons'])}")
        print("="*50)

        # Save flagged log to file
        log_path = path.replace('.csv', '_fraud_log.json')
        with open(log_path, 'w') as lf:
            json.dump(flagged_log, lf, indent=2)
        print(f"Fraud log saved: {log_path}")

if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "data/UK_Masters_Top20_Verified.csv"
    import_csv(csv_file)
