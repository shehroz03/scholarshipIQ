import os
from pydantic_settings import BaseSettings
from typing import Optional
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class Settings(BaseSettings):
    PROJECT_NAME: str = "ScholarIQ"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Admin Credentials - MUST be set in environment
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ADMIN_PASSWORD_HASH: str = ""

    # Database - SQLite for development, PostgreSQL for production
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", "sqlite:///./scholariq.db")
    
    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SECRET_KEY:
            raise RuntimeError("SECRET_KEY must be set in environment")
        # Hash admin password at startup
        self.ADMIN_PASSWORD_HASH = pwd_context.hash(self.ADMIN_PASSWORD)

    class Config:
        env_file = ".env"
        extra = "ignore"

try:
    settings = Settings()
except Exception as e:
    # If Pydantic validation fails (e.g. missing field), or our custom check fails
    error_str = str(e)
    if "SECRET_KEY" in error_str:
        raise RuntimeError("SECRET_KEY must be set in environment")
    if "ADMIN_USERNAME" in error_str:
        raise RuntimeError("ADMIN_USERNAME must be set in environment for secure admin access")
    if "ADMIN_PASSWORD" in error_str:
        raise RuntimeError("ADMIN_PASSWORD must be set in environment for secure admin access")
    raise e
