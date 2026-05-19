from app.db import models
from app.db.session import SessionLocal
from app.core import security
from app.api.auth import validate_email, validate_password, sanitize_input
from sqlalchemy import func

def test_auth_flow():
    db = SessionLocal()
    email = "testuser8@example.com"
    password = "Password123"
    
    # 1. Register logic simulation
    s_email = sanitize_input(email, 255).lower()
    hashed = security.get_password_hash(password)
    
    existing = db.query(models.User).filter(func.lower(models.User.email) == s_email).first()
    if existing:
        print(f"User {s_email} already exists, deleting for test...")
        db.delete(existing)
        db.commit()
        
    user = models.User(email=s_email, hashed_password=hashed, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Registered user: {user.email}")
    
    # 2. Login logic simulation
    l_email = sanitize_input(email, 255).lower()
    l_user = db.query(models.User).filter(func.lower(models.User.email) == l_email).first()
    
    if not l_user:
        print("Login failed: User not found in DB")
        return
        
    verified = security.verify_password(password, l_user.hashed_password)
    if verified:
        print("Login SUCCESS: Password verified")
    else:
        print("Login FAILED: Password verification failed")
        
    db.close()

if __name__ == "__main__":
    test_auth_flow()
