# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "FinancePro"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "https://pklyboftzpuoqqoorgly.supabase.co"
    
    # JWT
    SECRET_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHlib2Z0enB1b3Fxb29yZ2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4Mzk4MzMsImV4cCI6MjA3NzQxNTgzM30.XYLWm5JeeD9t357aUUVKeztcOmPZKekBJMioEiXUKXk"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()