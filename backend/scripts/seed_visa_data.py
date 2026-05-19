import sys
import os
import json
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, engine
from app.db.models import Base, VisaRequirementTemplate, VisaCountryGuide

def seed_visa_data():
    print("Initializing Visa Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. SEED COUNTRY GUIDES
        guides = [
            {
                "country_code": "AU",
                "overview": "Australia Student Visa (Subclass 500) allows you to stay in Australia for up to 5 years for full-time study.",
                "common_mistakes": "Inconsistent GTE (Genuine Temporary Entrant) statements, insufficient financial proof for the full year, and missing OSHC insurance coverage dates.",
                "financial_proof_notes": "Minimum $21,041 AUD per year for living costs + Tuition fees. Funds must be held for at least 3 months.",
                "document_format_notes": "All documents must be color scans. Non-English documents must have NAATI certified translations."
            },
            {
                "country_code": "UK",
                "overview": "The UK Student Visa (formerly Tier 4) is for students who want to study in the UK for more than 6 months.",
                "common_mistakes": "Applying before receiving the CAS, incorrect 28-day rule application for bank statements, and missing TB test results.",
                "financial_proof_notes": "£1,334 per month (London) or £1,023 per month (Outside London) for up to 9 months. 28-day rule applies strictly.",
                "document_format_notes": "Documents must be in PDF format. Translations must be verifiable with the translator's credentials."
            },
            {
                "country_code": "DE",
                "overview": "Germany Student Visa is required for non-EU students to study in German universities.",
                "common_mistakes": "Incomplete Blocked Account (Sperrkonto) proof, missing health insurance (TK/AOK), and poor motivation letter quality.",
                "financial_proof_notes": "Blocked Account (Sperrkonto) with at least €11,208 for one year is mandatory.",
                "document_format_notes": "Original documents + 2 sets of copies are usually required for the embassy interview."
            }
        ]

        for g in guides:
            exists = db.query(VisaCountryGuide).filter(VisaCountryGuide.country_code == g["country_code"]).first()
            if not exists:
                db.add(VisaCountryGuide(**g))

        # 2. SEED REQUIREMENT TEMPLATES
        # Common docs for all
        common_docs = [
            {"key": "passport", "title": "Valid Passport", "desc": "Current valid passport with at least 6 months validity from intake date."},
            {"key": "admission_letter", "title": "Confirmation of Enrollment / Admission", "desc": "Official document from university (CoE for AU, CAS for UK, Zulassungsbescheid for DE)."},
            {"key": "bank_statement", "title": "Financial Proof (Bank Statement)", "desc": "Proof of funds covering tuition and living expenses."},
            {"key": "language_test", "title": "Language Proficiency Result", "desc": "Valid IELTS, TOEFL, or PTE score report."},
            {"key": "academic_transcripts", "title": "Academic Transcripts & Degrees", "desc": "Copies of previous qualifications (Bachelors/Masters)."},
            {"key": "sop", "title": "Statement of Purpose / Motivation Letter", "desc": "Detailed letter explaining your study goals and return plans."}
        ]

        countries = ["AU", "UK", "DE"]
        for country in countries:
            for idx, doc in enumerate(common_docs):
                exists = db.query(VisaRequirementTemplate).filter(
                    VisaRequirementTemplate.country_code == country,
                    VisaRequirementTemplate.document_key == doc["key"]
                ).first()
                if not exists:
                    db.add(VisaRequirementTemplate(
                        country_code=country,
                        document_key=doc["key"],
                        title=doc["title"],
                        description=doc["desc"],
                        is_required=True,
                        display_order=idx
                    ))

        # Specific docs
        specific_docs = [
            {"country": "AU", "key": "oshc", "title": "OSHC Health Insurance", "desc": "Overseas Student Health Cover for the entire duration of stay."},
            {"country": "UK", "key": "tb_test", "title": "TB Test Certificate", "desc": "Tuberculosis test result from a Home Office approved clinic."},
            {"country": "DE", "key": "blocked_account", "title": "Blocked Account (Sperrkonto)", "desc": "Confirmation of blocked account with €11,208 minimum."}
        ]

        for doc in specific_docs:
            exists = db.query(VisaRequirementTemplate).filter(
                VisaRequirementTemplate.country_code == doc["country"],
                VisaRequirementTemplate.document_key == doc["key"]
            ).first()
            if not exists:
                db.add(VisaRequirementTemplate(
                    country_code=doc["country"],
                    document_key=doc["key"],
                    title=doc["title"],
                    description=doc["desc"],
                    is_required=True,
                    display_order=10
                ))

        db.commit()
        print("Visa Data Seeded Successfully!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_visa_data()
