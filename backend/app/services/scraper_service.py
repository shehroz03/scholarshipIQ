import os
import json
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import Scholarship, University, PipelineLog, ScholarshipStaging, ReviewStatus, FraudRisk
from app.services.fraud_detection import calculate_fraud_risk

TARGET_UNIVERSITIES = [
    # UK
    {"uni": "University of Oxford", "url": "https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search", "country": "United Kingdom", "city": "Oxford", "lat": 51.7520, "lng": -1.2577},
    {"uni": "University of Cambridge", "url": "https://www.postgraduate.study.cam.ac.uk/funding/funding-search", "country": "United Kingdom", "city": "Cambridge", "lat": 52.2053, "lng": 0.1218},
    {"uni": "Imperial College London", "url": "https://www.imperial.ac.uk/study/fees-and-funding/scholarships-search/", "country": "United Kingdom", "city": "London", "lat": 51.4983, "lng": -0.1759},
    {"uni": "University of Manchester", "url": "https://www.manchester.ac.uk/study/masters/fees-and-funding/masters-scholarships/", "country": "United Kingdom", "city": "Manchester", "lat": 53.4668, "lng": -2.2338},
    {"uni": "University of Edinburgh", "url": "https://www.ed.ac.uk/student-funding/postgraduate/international/global/masters", "country": "United Kingdom", "city": "Edinburgh", "lat": 55.9445, "lng": -3.1892},
    # Canada
    {"uni": "University of Toronto", "url": "https://www.sgs.utoronto.ca/awards/", "country": "Canada", "city": "Toronto", "lat": 43.6629, "lng": -79.3957},
    {"uni": "University of British Columbia", "url": "https://www.grad.ubc.ca/awards", "country": "Canada", "city": "Vancouver", "lat": 49.2606, "lng": -123.2460},
    {"uni": "McGill University", "url": "https://www.mcgill.ca/studentaid/scholarships-awards/entrance", "country": "Canada", "city": "Montreal", "lat": 45.5048, "lng": -73.5772},
    # Australia
    {"uni": "University of Melbourne", "url": "https://scholarships.unimelb.edu.au/", "country": "Australia", "city": "Melbourne", "lat": -37.7963, "lng": 144.9614},
    {"uni": "Australian National University", "url": "https://www.anu.edu.au/study/scholarships", "country": "Australia", "city": "Canberra", "lat": -35.2777, "lng": 149.1185},
    {"uni": "University of Sydney", "url": "https://www.sydney.edu.au/scholarships/", "country": "Australia", "city": "Sydney", "lat": -33.8882, "lng": 151.1873},
    {"uni": "University of Queensland", "url": "https://scholarships.uq.edu.au/", "country": "Australia", "city": "Brisbane", "lat": -27.4975, "lng": 153.0137},
    {"uni": "Monash University", "url": "https://www.monash.edu/scholarships", "country": "Australia", "city": "Melbourne", "lat": -37.9105, "lng": 145.1362},
]

def scrape_university(target: dict) -> list:
    """Mock/Dummy scraper producing varied risk levels for testing."""
    ts = int(time.time())
    return [
        {
            "title": f"{target['uni']} Safe Award {ts}",
            "description": "A legitimate scholarship from a top university.",
            "scholarship_link": f"{target['url']}#safe_{ts}",
            "degree_level": "Masters",
            "field_of_study": "All",
            "scholarship_amount_value": 15000,
            "tuition_fee_per_year": 25000,
            "cgpa_min": 3.5,
            "international_email": f"admissions@{target['url'].split('/')[2].replace('www.', '')}"
        },
        {
            "title": f"{target['uni']} Suspicious Offer {ts}",
            "description": "You have been selected! processing fee required via western union for 100% guaranteed win.",
            "scholarship_link": f"{target['url']}#suspicious_{ts}",
            "degree_level": "Masters",
            "field_of_study": "Business",
            "scholarship_amount_value": 50000,
            "tuition_fee_per_year": 10000,
            "cgpa_min": 2.0,
            "international_email": "win-money@gmail.com"
        }
    ]

def is_masters_scholarship(scholarship: dict) -> bool:
    """Filter to ensure we only target Masters degrees."""
    level = scholarship.get("degree_level", "").lower()
    if "master" in level or "msc" in level or "ma " in level:
        return True
    return False

def stage_scholarship(db: Session, s: dict, target: dict, fraud: dict, status: str, run_id: str) -> ScholarshipStaging:
    """Inserts a scholarship into the staging area for manual review."""
    uni = db.query(University).filter(University.name == target["uni"]).first()
    
    currency = "GBP" if "United Kingdom" in target["country"] else "CAD" if "Canada" in target["country"] else "AUD"
    amount_sym = "£" if currency == "GBP" else "$"

    staged = ScholarshipStaging(
        title=s["title"],
        university_name_raw=target["uni"],
        university_id=uni.id if uni else None,
        country=target["country"],
        city=target["city"],
        description=s["description"],
        degree_level=s["degree_level"],
        field_of_study=s["field_of_study"],
        funding_type="Partial" if s['scholarship_amount_value'] < s['tuition_fee_per_year'] else "Fully Funded",
        amount=f"{amount_sym}{s['scholarship_amount_value']}",
        scholarship_url=s["scholarship_link"],
        website_url=target["url"],
        
        # Financials
        scholarship_amount_value=f"{amount_sym}{s['scholarship_amount_value']} award",
        scholarship_amount_numeric=float(s['scholarship_amount_value']),
        tuition_fee_per_year=f"{amount_sym}{s['tuition_fee_per_year']} per year",
        tuition_fee_numeric=float(s['tuition_fee_per_year']),
        currency=currency,
        
        # Criteria
        min_cgpa=s['cgpa_min'],
        min_ielts=s.get('min_ielts', 6.5),
        min_toefl=s.get('min_toefl', 90),
        
        # Metadata
        fraud_risk_score=fraud["risk_score"],
        fraud_risk_level=fraud["risk_level"],
        fraud_reasons=json.dumps(fraud["reasons"]),
        review_status=status,
        import_source="automated_scraper",
        pipeline_run_id=run_id,
        raw_payload_json=json.dumps(s)
    )
    db.add(staged)
    db.commit()
    db.refresh(staged)
    return staged

def insert_scholarship(db: Session, s: dict, target: dict, fraud: dict) -> Scholarship:
    """Inserts a scholarship directly into production (SAFE only)."""
    uni = db.query(University).filter(University.name == target["uni"]).first()
    
    currency = "GBP" if "United Kingdom" in target["country"] else "CAD" if "Canada" in target["country"] else "AUD"
    amount_sym = "£" if currency == "GBP" else "$"

    new_s = Scholarship(
        title=s["title"],
        university_id=uni.id,
        country=target["country"],
        city=target["city"],
        description=s["description"],
        degree_level=s["degree_level"],
        field_of_study=s["field_of_study"],
        scholarship_url=s["scholarship_link"],
        website_url=target["url"],
        currency=currency,
        funding_type="Partial" if s['scholarship_amount_value'] < s['tuition_fee_per_year'] else "Fully Funded",
        amount=f"{amount_sym}{s['scholarship_amount_value']}",
        scholarship_amount_numeric=float(s['scholarship_amount_value']),
        scholarship_amount_value=f"{amount_sym}{s['scholarship_amount_value']} award",
        tuition_fee_numeric=float(s['tuition_fee_per_year']),
        tuition_fee_per_year=f"{amount_sym}{s['tuition_fee_per_year']} per year",
        min_cgpa=s['cgpa_min'],
        is_suspicious=fraud["auto_flag"],
        fraud_risk_score=fraud["risk_score"],
        fraud_risk_level=fraud["risk_level"],
        fraud_reasons=json.dumps(fraud["reasons"]),
        last_fraud_check=datetime.now(timezone.utc).replace(tzinfo=None),
        is_active=True,
        tuition_verified="verified",
        scholarship_verified="verified",
        has_separate_form=True,
        application_type="direct_form",
        latitude=target["lat"],
        longitude=target["lng"]
    )
    db.add(new_s)
    db.commit()
    db.refresh(new_s)
    return new_s

def save_pipeline_log(db: Session, results: dict):
    status = "success"
    if len(results["errors"]) > 0:
        status = "partial" if results["inserted"] > 0 or results["staged"] > 0 else "failed"

    log = PipelineLog(
        triggered_by=results["triggered_by"],
        pipeline_run_id=results.get("pipeline_run_id"),
        total_found=results["total_found"],
        inserted=results["inserted"],
        staged=results.get("staged", 0),
        skipped_fraud=results["skipped_fraud"],
        skipped_duplicate=results["skipped_duplicate"],
        skipped_not_masters=results["skipped_not_masters"],
        errors=json.dumps(results["errors"]),
        new_scholarships=json.dumps(results["new_scholarships"]),
        status=status,
    )
    db.add(log)
    db.commit()

async def scrape_and_import(db: Session, triggered_by: str = "auto") -> dict:
    run_id = f"run_{int(time.time())}"
    results = {
        "total_found": 0,
        "inserted": 0,
        "staged": 0,
        "skipped_fraud": 0,
        "skipped_duplicate": 0,
        "skipped_not_masters": 0,
        "errors": [],
        "new_scholarships": [],
        "triggered_by": triggered_by,
        "pipeline_run_id": run_id,
        "timestamp": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
    }

    for target in TARGET_UNIVERSITIES:
        try:
            scholarships = scrape_university(target)

            for s in scholarships:
                try:
                    results["total_found"] += 1

                    # 1. Masters only filter
                    if not is_masters_scholarship(s):
                        results["skipped_not_masters"] += 1
                        continue

                    # 2. Duplicate check (Production)
                    exists = db.query(Scholarship).filter(Scholarship.scholarship_url == s["scholarship_link"]).first()
                    if exists:
                        results["skipped_duplicate"] += 1
                        db.add(PipelineLog(
                            event_type="discovery", action_taken="skipped",
                            scholarship_title=s["title"], official_url=s["scholarship_link"],
                            message="Duplicate found in production.", triggered_by=triggered_by, pipeline_run_id=run_id
                        ))
                        continue

                    # 3. Fraud check
                    fraud = calculate_fraud_risk(s)
                    
                    # 4. University Linking
                    uni = db.query(University).filter(University.name == target["uni"]).first()
                    
                    # --- ROUTING LOGIC ---
                    
                    # A. CRITICAL Risk -> Blocked (Staged but blocked)
                    if fraud["risk_level"] == FraudRisk.CRITICAL:
                        results["skipped_fraud"] += 1
                        results["staged"] += 1
                        stage_scholarship(db, s, target, fraud, ReviewStatus.BLOCKED, run_id)
                        db.add(PipelineLog(
                            event_type="fraud_gate", action_taken="blocked",
                            scholarship_title=s["title"], official_url=s["scholarship_link"],
                            message=f"CRITICAL risk blocked. Reasons: {', '.join(fraud['reasons'])}",
                            triggered_by=triggered_by, pipeline_run_id=run_id
                        ))
                        continue

                    # B. Missing University -> Staging (missing_uni)
                    if not uni:
                        results["staged"] += 1
                        stage_scholarship(db, s, target, fraud, ReviewStatus.MISSING_UNI, run_id)
                        db.add(PipelineLog(
                            event_type="discovery", action_taken="staged",
                            scholarship_title=s["title"], official_url=s["scholarship_link"],
                            message="University not found. Sent to staging for linking.",
                            triggered_by=triggered_by, pipeline_run_id=run_id
                        ))
                        continue

                    # C. MEDIUM/HIGH Risk -> Staging (pending)
                    if fraud["risk_level"] in [FraudRisk.MEDIUM, FraudRisk.HIGH]:
                        results["staged"] += 1
                        stage_scholarship(db, s, target, fraud, ReviewStatus.PENDING, run_id)
                        db.add(PipelineLog(
                            event_type="fraud_gate", action_taken="staged",
                            scholarship_title=s["title"], official_url=s["scholarship_link"],
                            message=f"Manual review required ({fraud['risk_level']}). Reasons: {', '.join(fraud['reasons'])}",
                            triggered_by=triggered_by, pipeline_run_id=run_id
                        ))
                        continue

                    # D. SAFE + Linked -> Production
                    new_s_obj = insert_scholarship(db, s, target, fraud)
                    results["inserted"] += 1
                    results["new_scholarships"].append(new_s_obj.title)
                    
                    db.add(PipelineLog(
                        event_type="enrichment", action_taken="inserted",
                        scholarship_title=new_s_obj.title, official_url=new_s_obj.scholarship_url,
                        message="Safe record inserted directly to production.",
                        triggered_by=triggered_by, pipeline_run_id=run_id
                    ))

                    # Notify
                    from app.services.notification_service import NotificationService
                    NotificationService.notify_new_matches(db, new_s_obj)

                except Exception as e:
                    results["errors"].append(f"Scholarship {s.get('title', 'Unknown')}: {str(e)}")
                    db.add(PipelineLog(
                        event_type="error", action_taken="failed",
                        scholarship_title=s.get('title'),
                        message=f"Error processing record: {str(e)}",
                        triggered_by=triggered_by, pipeline_run_id=run_id
                    ))

            time.sleep(0.1)

        except Exception as e:
            results["errors"].append(f"Target {target['uni']}: {str(e)}")
            db.add(PipelineLog(
                event_type="error", action_taken="failed",
                message=f"Error processing {target['uni']}: {str(e)}",
                triggered_by=triggered_by, pipeline_run_id=run_id
            ))

    save_pipeline_log(db, results)
    db.add(PipelineLog(
        event_type="run_summary",
        action_taken="success" if results["inserted"] > 0 or results["staged"] > 0 else "failed",
        message=f"Pipeline run complete. Inserted: {results['inserted']}, Staged: {results['staged']}, Found: {results['total_found']}",
        triggered_by=triggered_by, pipeline_run_id=run_id
    ))

    db.commit()
    return results
