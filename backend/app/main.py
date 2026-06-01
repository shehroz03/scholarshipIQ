from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api import auth, users, scholarships, recommendations, chatbot, dashboard, applications, consultant, sop_writer, notifications, visa, subscriptions, teacher, courses
from app.tasks import start_scheduler
from app.services.email import send_deadline_email
from app.core.config import settings


# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ─── Security Headers Middleware ───────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


from app.db.session import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    yield

# ─── App Initialisation ────────────────────────────────────────────────────────
app = FastAPI(
    title="ScholarIQ API",
    version="1.0.0",
    description="AI-Powered Scholarship Discovery Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)
app.state.startup_time = datetime.now(timezone.utc).replace(tzinfo=None)
app.state.limiter = limiter

# CORS Middleware - MUST be first!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:50528",
        "http://localhost:50528",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach rate limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore
app.add_middleware(SlowAPIMiddleware)

# Security headers
app.add_middleware(SecurityHeadersMiddleware)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*"],
)


# ─── DB + Scheduler Startup (Moved to lifespan) ───────────────────────────────────


# ─── Core Routes ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    uptime = (datetime.now(timezone.utc).replace(tzinfo=None) - app.state.startup_time).seconds
    return {"status": "healthy", "service": "ScholarIQ Backend", "uptime_seconds": uptime}


@app.post("/test-email", include_in_schema=False)
async def test_email(to_email: str):
    await send_deadline_email(to_email, "Test Scholarship", 2)
    return {"message": "Email sent!"}


# ─── API Routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/auth",            tags=["Authentication"])
app.include_router(users.router,           prefix="/users",           tags=["Users"])
app.include_router(scholarships.router,    prefix="/scholarships",    tags=["Scholarships"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["AI Recommendations"])
app.include_router(chatbot.router,         prefix="/api/chat",        tags=["Chatbot"])
app.include_router(dashboard.router,       prefix="/dashboard",       tags=["Dashboard"])
app.include_router(applications.router,    prefix="/applications",    tags=["Applications"])

app.include_router(consultant.router,      prefix="/consultant",      tags=["Consultant"])
app.include_router(sop_writer.router,      prefix="/sop-writer",      tags=["SOP Writer"])
app.include_router(notifications.router,   prefix="/notifications",   tags=["Notifications"])
app.include_router(visa.router,            prefix="/visa",            tags=["Visa Guidance"])
app.include_router(subscriptions.router,   prefix="/subscriptions",   tags=["Subscriptions"])

from app.api import admin
app.include_router(admin.router,           prefix="/admin",           tags=["Admin Panel"])
app.include_router(teacher.router,         prefix="",                 tags=["Teacher"])
app.include_router(courses.router,         prefix="",                 tags=["Courses"])


# ─── Static Files (CV Uploads) ────────────────────────────────────────────────
import os
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
