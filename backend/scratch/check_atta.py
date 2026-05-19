import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent folder of 'app' to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import models
from app.recommendation.engine import get_recommendations, resolve_user_fields

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scholariq.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

def check_recommendations():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Find user ATTA
        user = db.query(models.User).filter(models.User.email.like("%atta%") | models.User.full_name.like("%ATTA%")).first()
        if not user:
            # Let's get the first user in the DB
            user = db.query(models.User).first()
            if not user:
                print("No user found in the DB!")
                return
        
        print(f"=== User Diagnostic ===")
        print(f"ID: {user.id}")
        print(f"Full Name: {user.full_name}")
        print(f"Email: {user.email}")
        print(f"CGPA: {user.cgpa}")
        print(f"Current Degree: {user.current_degree}")
        print(f"Degree Level: {user.degree_level}")
        print(f"Target Degree: {user.target_degree}")
        print(f"Target Country: {user.target_country}")
        print(f"Major: {user.major}")
        print(f"Target Field: {getattr(user, 'target_field', 'N/A')}")
        print(f"Preferred Countries: {getattr(user, 'preferred_countries', 'N/A')}")
        print(f"IELTS: {getattr(user, 'ielts_overall', 'N/A')}")
        print(f"Scholarship Type Pref: {getattr(user, 'scholarship_type_pref', 'N/A')}")
        print(f"========================\n")

        # Resolve user fields for engine
        user_fields = resolve_user_fields(user)
        print("=== Resolved Engine User Fields ===")
        for k, v in user_fields.items():
            print(f"  {k}: {v}")
        print("===================================\n")

        # Query all active, non-suspicious, non-archived scholarships
        from app.db.models import Scholarship, University
        from sqlalchemy import or_
        
        query = db.query(Scholarship).outerjoin(University).filter(
            Scholarship.is_active == True,
            or_(Scholarship.is_suspicious == False, Scholarship.is_suspicious.is_(None)),
            or_(Scholarship.is_archived == False, Scholarship.is_archived.is_(None))
        )
        
        all_active_count = query.count()
        print(f"Total Active & Non-Suspicious/Archived Scholarships in DB: {all_active_count}")

        # Check filter constraints
        # 1. Target countries
        if user_fields['target_countries']:
            country_filters = []
            for c in user_fields['target_countries']:
                country_filters.append(Scholarship.country.ilike(f"%{c}%"))
                country_filters.append(University.country.ilike(f"%{c}%"))
                if c == "united kingdom":
                    country_filters.append(Scholarship.country.ilike("%uk%"))
                    country_filters.append(University.country.ilike("%uk%"))
                elif c == "united states":
                    country_filters.append(Scholarship.country.ilike("%usa%"))
                    country_filters.append(University.country.ilike("%usa%"))
                    country_filters.append(Scholarship.country.ilike("% us%"))
                    country_filters.append(University.country.ilike("% us%"))
            
            country_query = query.filter(or_(*country_filters))
            print(f"  With target_countries filter ({user_fields['target_countries']}): {country_query.count()} matches")
        else:
            print("  No target_countries filter applied (list is empty)")
            country_query = query

        # 2. Degree level
        if user_fields['target_degree_norm']:
            degree_query = country_query.filter(Scholarship.degree_level.ilike(f"%{user_fields['target_degree_norm']}%"))
            print(f"  With target_degree filter ({user_fields['target_degree_norm']}): {degree_query.count()} matches")
        else:
            print("  No target_degree filter applied (empty)")
            degree_query = country_query

        # Run actual get_recommendations
        recs = get_recommendations(user, db)
        print(f"\nEngine returned {len(recs)} recommendations:")
        for r in recs:
            print(f"  - [{r['fit_score']}%] {r['scholarship_name']} at {r['uni_name']} ({r['country']})")

    finally:
        db.close()

if __name__ == "__main__":
    check_recommendations()
