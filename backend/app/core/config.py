import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ScholarIQ"
    
    # Security - Use environment variable in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SECRET_KEY_FOR_DEVELOPMENT_ONLY_CHANGE_IN_PRODUCTION")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database - SQLite for development, PostgreSQL for production
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", "sqlite:///./scholariq.db")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
