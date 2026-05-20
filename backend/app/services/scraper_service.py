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


# ─── Per-country defaults (IELTS, TOEFL, CGPA) ───────────────────────────────
_COUNTRY_DEFAULTS = {
    "United Kingdom":  {"min_ielts": 6.5, "min_toefl": 90,  "cgpa": 3.0},
    "Canada":          {"min_ielts": 6.5, "min_toefl": 86,  "cgpa": 3.0},
    "Australia":       {"min_ielts": 6.5, "min_toefl": 79,  "cgpa": 3.0},
    "Germany":         {"min_ielts": 6.5, "min_toefl": 80,  "cgpa": 3.0},
    "United States":   {"min_ielts": 6.5, "min_toefl": 90,  "cgpa": 3.0},
    "Turkey":          {"min_ielts": 6.0, "min_toefl": 79,  "cgpa": 2.8},
    "Netherlands":     {"min_ielts": 6.5, "min_toefl": 90,  "cgpa": 3.0},
}
_DEFAULT_COUNTRY = {"min_ielts": 6.5, "min_toefl": 80, "cgpa": 3.0}

_DEGREE_DURATION = {
    "phd": "3-4 years", "doctor": "3-4 years",
    "master": "1-2 years", "msc": "1-2 years", "mba": "1-2 years",
    "bachelor": "3-4 years", "undergrad": "3-4 years",
}


def validate_and_enrich_scholarship(s: dict, target: dict) -> dict:
    """
    Ensures ALL required fields exist with proper non-zero values.
    Fills in country-specific defaults for IELTS/TOEFL/CGPA.
    Derives funding_type, duration_text, eligibility, description if missing.
    Raises ValueError if critical required fields (title, amount) are absent.
    """
    # ── Critical fields must exist ────────────────────────────────────────────
    if not s.get("title") or not str(s["title"]).strip():
        raise ValueError("Missing required field: title")
    if not s.get("scholarship_amount_value") and not s.get("cgpa_min"):
        raise ValueError(f"Scholarship '{s.get('title')}' missing amount AND cgpa — likely bad data")

    country = target.get("country", "")
    defaults = _COUNTRY_DEFAULTS.get(country, _DEFAULT_COUNTRY)

    # ── Currency symbol by country ─────────────────────────────────────────────
    currency_map = {
        "United Kingdom": ("GBP", "£"),
        "Canada":         ("CAD", "$"),
        "Australia":      ("AUD", "$"),
        "Germany":        ("EUR", "€"),
        "United States":  ("USD", "$"),
        "Turkey":         ("USD", "$"),
        "Netherlands":    ("EUR", "€"),
    }
    currency, sym = currency_map.get(country, ("USD", "$"))
    s["_currency"] = currency
    s["_sym"] = sym

    # ── Amounts ───────────────────────────────────────────────────────────────
    amt_num = float(s.get("scholarship_amount_value") or 0)
    tui_num = float(s.get("tuition_fee_per_year") or 0)

    # Reject zero-amount scholarships (bad scrape data)
    if amt_num <= 0:
        raise ValueError(f"Scholarship '{s.get('title')}' has zero/missing amount — skipping")

    s["scholarship_amount_numeric"] = amt_num
    s["tuition_fee_numeric"] = tui_num
    s["scholarship_amount_value_str"] = s.get("scholarship_amount_value_str") or f"{sym}{amt_num:,.0f} award"
    s["tuition_fee_per_year_str"] = s.get("tuition_fee_per_year_str") or (
        f"{sym}{tui_num:,.0f} per year" if tui_num > 0 else f"{sym}0 (no tuition - public university)"
    )

    # ── Funding type ──────────────────────────────────────────────────────────
    if not s.get("funding_type"):
        if tui_num > 0:
            s["funding_type"] = "Fully Funded" if amt_num >= tui_num * 0.9 else "Partial"
        else:
            s["funding_type"] = "Partial"

    # ── Criteria defaults ─────────────────────────────────────────────────────
    if not s.get("cgpa_min") or float(s.get("cgpa_min", 0)) == 0:
        s["cgpa_min"] = defaults["cgpa"]
    if not s.get("min_ielts") or float(s.get("min_ielts", 0)) == 0:
        s["min_ielts"] = defaults["min_ielts"]
    if not s.get("min_toefl") or int(s.get("min_toefl", 0)) == 0:
        s["min_toefl"] = defaults["min_toefl"]

    # ── Duration ──────────────────────────────────────────────────────────────
    if not s.get("duration_text"):
        level = (s.get("degree_level") or "").lower()
        s["duration_text"] = next(
            (v for k, v in _DEGREE_DURATION.items() if k in level),
            "1-2 years"
        )

    # ── Eligibility ───────────────────────────────────────────────────────────
    if not s.get("eligibility"):
        parts = [
            f"CGPA {s['cgpa_min']}+",
            f"IELTS {s['min_ielts']}+ / TOEFL {s['min_toefl']}+",
            f"{s.get('degree_level', 'Masters')} enrollment",
        ]
        if s.get("field_of_study") and s["field_of_study"] not in ("All", "All Fields"):
            parts.append(f"Field: {s['field_of_study']}")
        if s.get("requires_work_exp"):
            parts.append("Work experience required")
        s["eligibility"] = ". ".join(parts) + "."

    # ── Description ───────────────────────────────────────────────────────────
    if not s.get("description") or len(str(s.get("description", ""))) < 30:
        ft = s.get("funding_type", "merit-based").lower()
        field = s.get("field_of_study") or "all fields"
        level = s.get("degree_level") or "Masters"
        s["description"] = (
            f"{s['title']} is a {ft} scholarship offered to international {level} students "
            f"in {field} at {target['uni']}, {country}. "
            f"Covers {sym}{amt_num:,.0f} toward tuition and living expenses."
        )

    return s

def stage_scholarship(db: Session, s: dict, target: dict, fraud: dict, status: str, run_id: str) -> ScholarshipStaging:
    """Validates, enriches, then inserts a scholarship into the staging area."""
    s = validate_and_enrich_scholarship(s, target)
    uni = db.query(University).filter(University.name == target["uni"]).first()
    currency = s["_currency"]
    sym = s["_sym"]

    staged = ScholarshipStaging(
        title=s["title"],
        university_name_raw=target["uni"],
        university_id=uni.id if uni else None,
        country=target["country"],
        city=target["city"],
        description=s["description"],
        degree_level=s["degree_level"],
        field_of_study=s.get("field_of_study", "All"),
        funding_type=s["funding_type"],
        amount=f"{sym}{s['scholarship_amount_numeric']:,.0f}",
        scholarship_url=s["scholarship_link"],
        website_url=target["url"],
        eligibility=s["eligibility"],
        duration_text=s["duration_text"],

        # Financials — always populated
        scholarship_amount_value=s["scholarship_amount_value_str"],
        scholarship_amount_numeric=s["scholarship_amount_numeric"],
        tuition_fee_per_year=s["tuition_fee_per_year_str"],
        tuition_fee_numeric=s["tuition_fee_numeric"],
        currency=currency,

        # Criteria — always populated
        min_cgpa=s["cgpa_min"],
        min_ielts=s["min_ielts"],
        min_toefl=s["min_toefl"],
        requires_work_exp=bool(s.get("requires_work_exp", False)),

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
    """Validates, enriches, then inserts a scholarship directly into production."""
    s = validate_and_enrich_scholarship(s, target)
    uni = db.query(University).filter(University.name == target["uni"]).first()
    currency = s["_currency"]
    sym = s["_sym"]

    new_s = Scholarship(
        title=s["title"],
        university_id=uni.id if uni else None,
        country=target["country"],
        city=target["city"],
        description=s["description"],
        degree_level=s["degree_level"],
        field_of_study=s.get("field_of_study", "All"),
        scholarship_url=s["scholarship_link"],
        website_url=target["url"],
        eligibility=s["eligibility"],
        duration_text=s["duration_text"],
        currency=currency,
        funding_type=s["funding_type"],
        amount=f"{sym}{s['scholarship_amount_numeric']:,.0f}",
        scholarship_amount_numeric=s["scholarship_amount_numeric"],
        scholarship_amount_value=s["scholarship_amount_value_str"],
        tuition_fee_numeric=s["tuition_fee_numeric"],
        tuition_fee_per_year=s["tuition_fee_per_year_str"],
        min_cgpa=s["cgpa_min"],
        min_ielts=s["min_ielts"],
        min_toefl=s["min_toefl"],
        requires_work_exp=bool(s.get("requires_work_exp", False)),
        is_suspicious=fraud["auto_flag"],
        fraud_risk_score=fraud["risk_score"],
        fraud_risk_level=fraud["risk_level"],
        fraud_reasons=json.dumps(fraud["reasons"]),
        last_fraud_check=datetime.now(timezone.utc).replace(tzinfo=None),
        is_active=True,
        approval_status="approved",
        tuition_verified="verified",
        scholarship_verified="verified",
        has_separate_form=True,
        application_type="direct_form",
        latitude=target.get("lat"),
        longitude=target.get("lng")
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

                    # D. SAFE + Linked -> Staging (PENDING) for Auto-Verify bot
                    # No direct production insert — all go through bot pipeline
                    results["staged"] += 1
                    stage_scholarship(db, s, target, fraud, ReviewStatus.PENDING, run_id)
                    db.add(PipelineLog(
                        event_type="fraud_gate", action_taken="staged",
                        scholarship_title=s["title"], official_url=s["scholarship_link"],
                        message=f"SAFE (score={fraud['risk_score']}) — sent to Auto-Verify bot for final approval.",
                        triggered_by=triggered_by, pipeline_run_id=run_id
                    ))

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
