from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, scholarships, recommendations, chatbot, dashboard, applications, resume
from app.tasks import start_scheduler
from app.services.email import send_deadline_email

app = FastAPI(title="ScholarIQ API", version="0.1.0")

@app.post("/test-email")
async def test_email(to_email: str):
    await send_deadline_email(to_email, "Test Scholarship", 2)
    return {"message": "Email sent!"}

from app.db.session import init_db

@app.on_event("startup")
async def startup_event():
    init_db()  # Ensure database tables are created on startup
    start_scheduler()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(scholarships.router, prefix="/scholarships", tags=["Scholarships"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["AI Recommendations"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(applications.router, prefix="/applications", tags=["Applications ATS"])
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
from app.api import admin
app.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ScholarIQ Backend"}

# --- TEMPORARY TEST ROUTE (For Email Validation) ---
@app.get("/test-email-notification")
async def test_email_notification(email: str):
    from app.db.session import SessionLocal
    from app.db.models import User, Scholarship, University
    from app.tasks import check_deadlines_and_notify
    import datetime

    db = SessionLocal()
    try:
        # 1. Test User check/create karein
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Dummy password ke sath user create karein agar nahi hai
            user = User(email=email, hashed_password="test_hashed_password", full_name="Test User")
            db.add(user)
            db.flush()

        # 2. Koi bhi ek University dhoondein (Scholarship link karne ke liye)
        uni = db.query(University).first()
        if not uni:
            return {"error": "Database mein koi University nahi mili. Pehle data import karein."}

        # 3. Dummy Scholarship create karein (Theek 7 din baad ki deadline)
        target_date = datetime.datetime.now() + datetime.timedelta(days=7)
        test_scholarship = Scholarship(
            title="TEST: Google Generation Scholarship",
            university_id=uni.id,
            deadline=target_date,
            country="United States",
            city="Mountain View",
            funding_type="Fully Funded"
        )
        db.add(test_scholarship)
        db.flush()

        # 4. User ke 'saved_items' mein ye scholarship add karein
        if test_scholarship not in user.saved_items:
            user.saved_items.append(test_scholarship)
        
        db.commit()

        # 5. Foran Email Task trigger karein
        await check_deadlines_and_notify()

        return {
            "status": "success",
            "message": f"Dummy scholarship created for {email} with deadline {target_date.date()}. Email triggered! Check terminal and inbox."
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
# ---------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
