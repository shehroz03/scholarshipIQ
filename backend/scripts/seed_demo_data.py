import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.models import Scholarship, User, University, Base
from app.core.security import get_password_hash

def seed_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Universities
        unis = [
            {"name": "University of Oxford", "country": "United Kingdom", "city": "Oxford"},
            {"name": "Technical University of Munich", "country": "Germany", "city": "Munich"},
            {"name": "Stanford University", "country": "USA", "city": "Stanford"},
            {"name": "University of Cambridge", "country": "United Kingdom", "city": "Cambridge"},
            {"name": "Heidelberg University", "country": "Germany", "city": "Heidelberg"},
            {"name": "MIT", "country": "USA", "city": "Cambridge"},
        ]
        
        uni_map = {} # Name to ID map
        for u_data in unis:
            uni = db.query(University).filter(University.name == u_data["name"]).first()
            if not uni:
                uni = University(**u_data)
                db.add(uni)
                db.flush()
            uni_map[u_data["name"]] = uni.id
        
        # 2. Seed Scholarships (15 total)
        scholarships_data = [
            # UK
            {"title": "Clarendon Fund Scholarships", "university_name": "University of Oxford", "country": "United Kingdom", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2026, 1, 20)},
            {"title": "Gates Cambridge Scholarship", "university_name": "University of Cambridge", "country": "United Kingdom", "funding_type": "Fully Funded", "degree_level": "PhD", "deadline": datetime(2026, 1, 5)},
            {"title": "Chevening Scholarships", "university_name": "Various UK Universities", "country": "United Kingdom", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2025, 11, 1)},
            {"title": "Rhodes Scholarship", "university_name": "University of Oxford", "country": "United Kingdom", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2025, 10, 1)},
            {"title": "Commonwealth Master's Scholarships", "university_name": "Various UK Universities", "country": "United Kingdom", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2025, 12, 15)},
            
            # Germany
            {"title": "DAAD Development-Related Postgraduate Courses", "university_name": "Various German Universities", "country": "Germany", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2026, 3, 31)},
            {"title": "Heinrich Böll Foundation Scholarships", "university_name": "Various German Universities", "country": "Germany", "funding_type": "Partial Funding", "degree_level": "Masters", "deadline": datetime(2026, 3, 1)},
            {"title": "Deutschlandstipendium Program", "university_name": "Technical University of Munich", "country": "Germany", "funding_type": "Partial Funding", "degree_level": "Bachelors", "deadline": datetime(2025, 9, 30)},
            {"title": "Friedrich Ebert Foundation Scholarship", "university_name": "Various German Universities", "country": "Germany", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2026, 5, 31)},
            {"title": "KAAD Scholarships", "university_name": "Various German Universities", "country": "Germany", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2026, 1, 15)},
            
            # USA
            {"title": "Fulbright Foreign Student Program", "university_name": "Various US Universities", "country": "USA", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2026, 5, 15)},
            {"title": "Knight-Hennessy Scholars", "university_name": "Stanford University", "country": "USA", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2025, 10, 10)},
            {"title": "Hubert H. Humphrey Fellowship", "university_name": "Various US Universities", "country": "USA", "funding_type": "Fully Funded", "degree_level": "Professional", "deadline": datetime(2025, 10, 1)},
            {"title": "Rotary Foundation Global Grant", "university_name": "Various US Universities", "country": "USA", "funding_type": "Fully Funded", "degree_level": "Masters", "deadline": datetime(2026, 6, 30)},
            {"title": "AAUW International Fellowships", "university_name": "Various US Universities", "country": "USA", "funding_type": "Partial Funding", "degree_level": "Masters", "deadline": datetime(2025, 12, 1)},
        ]
        
        for s_data in scholarships_data:
            # Check if exists
            exists = db.query(Scholarship).filter(Scholarship.title == s_data["title"]).first()
            if not exists:
                # Find university_id
                uni_name = s_data["university_name"]
                uni_id = uni_map.get(uni_name)
                
                # Handle "Various" cases - create a placeholder university if needed
                if not uni_id:
                    uni = db.query(University).filter(University.name == uni_name).first()
                    if not uni:
                        uni = University(name=uni_name, country=s_data["country"])
                        db.add(uni)
                        db.flush()
                    uni_id = uni.id

                scholarship = Scholarship(
                    **s_data,
                    university_id=uni_id,
                    description=f"Demo description for {s_data['title']}.",
                    is_active=True,
                    is_suspicious=False,
                    fraud_risk_level="SAFE",
                    fraud_risk_score=0.1,
                    is_archived=False
                )
                db.add(scholarship)
        
        # 3. Seed Demo User
        user_email = "ahmed.khan@example.com"
        demo_user = db.query(User).filter(User.email == user_email).first()
        if not demo_user:
            demo_user = User(
                email=user_email,
                hashed_password=get_password_hash("ahmed123"),
                full_name="Ahmed Khan",
                nationality="Pakistani",
                cgpa=3.7,
                major="Computer Science",
                target_degree="Masters",
                is_active=True,
                subscription_plan="premium",
                subscription_expires=datetime.now() + timedelta(days=30)
            )
            db.add(demo_user)
            print(f"Created demo user: {user_email} (Password: ahmed123)")
        
        db.commit()
        print("Successfully seeded scholarships and a demo user.")
        
    except Exception as e:
        print(f"Error seeding data: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
