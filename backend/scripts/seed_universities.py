import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.db.models import University

def seed():
    db = SessionLocal()
    
    try:
        universities_data = [
            {"name": "University of Oxford", "country": "United Kingdom", "city": "Oxford", "latitude": 51.7548, "longitude": -1.2544, "website_url": "https://www.ox.ac.uk", "qs_ranking": 1},
            {"name": "University of Cambridge", "country": "United Kingdom", "city": "Cambridge", "latitude": 52.2043, "longitude": 0.1149, "website_url": "https://www.cam.ac.uk", "qs_ranking": 2},
            {"name": "Imperial College London", "country": "United Kingdom", "city": "London", "latitude": 51.4988, "longitude": -0.1749, "website_url": "https://www.imperial.ac.uk", "qs_ranking": 6},
            {"name": "University College London", "country": "United Kingdom", "city": "London", "latitude": 51.5245, "longitude": -0.1339, "website_url": "https://www.ucl.ac.uk", "qs_ranking": 9},
            {"name": "University of Edinburgh", "country": "United Kingdom", "city": "Edinburgh", "latitude": 55.9445, "longitude": -3.1892, "website_url": "https://www.ed.ac.uk", "qs_ranking": 22},
            {"name": "Technical University of Munich", "country": "Germany", "city": "Munich", "latitude": 48.1497, "longitude": 11.5679, "website_url": "https://www.tum.de", "qs_ranking": 37},
            {"name": "LMU Munich", "country": "Germany", "city": "Munich", "latitude": 48.1506, "longitude": 11.5806, "website_url": "https://www.lmu.de", "qs_ranking": 54},
            {"name": "Free University of Berlin", "country": "Germany", "city": "Berlin", "latitude": 52.4537, "longitude": 13.2932, "website_url": "https://www.fu-berlin.de", "qs_ranking": 98},
            {"name": "Humboldt University Berlin", "country": "Germany", "city": "Berlin", "latitude": 52.5170, "longitude": 13.3939, "website_url": "https://www.hu-berlin.de", "qs_ranking": 120},
            {"name": "MIT", "country": "USA", "city": "Cambridge", "latitude": 42.3601, "longitude": -71.0942, "website_url": "https://www.mit.edu", "qs_ranking": 1},
            {"name": "Harvard University", "country": "USA", "city": "Cambridge", "latitude": 42.3770, "longitude": -71.1167, "website_url": "https://www.harvard.edu", "qs_ranking": 4},
            {"name": "Stanford University", "country": "USA", "city": "Stanford", "latitude": 37.4275, "longitude": -122.1697, "website_url": "https://www.stanford.edu", "qs_ranking": 3},
            {"name": "University of Toronto", "country": "Canada", "city": "Toronto", "latitude": 43.6629, "longitude": -79.3957, "website_url": "https://www.utoronto.ca", "qs_ranking": 21},
            {"name": "University of Melbourne", "country": "Australia", "city": "Melbourne", "latitude": -37.7963, "longitude": 144.9614, "website_url": "https://www.unimelb.edu.au", "qs_ranking": 33},
            {"name": "Bilkent University", "country": "Turkey", "city": "Ankara", "latitude": 39.8674, "longitude": 32.7479, "website_url": "https://www.bilkent.edu.tr", "qs_ranking": None},
        ]
        
        added_count = 0
        for data in universities_data:
            # Check if university already exists by name
            exists = db.query(University).filter(University.name == data["name"]).first()
            if not exists:
                uni = University(**data)
                db.add(uni)
                added_count += 1
        
        db.commit()
        if added_count > 0:
            print(f"Successfully seeded {added_count} new universities!")
        else:
            print("All universities already exist in the database.")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding universities: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
