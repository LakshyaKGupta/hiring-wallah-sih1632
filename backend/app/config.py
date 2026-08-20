import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env variables from a parent or local .env if it exists
load_dotenv()

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    DATABASE_URL: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    FIREBASE_PROJECT_ID: str = "hiring-wallah-prod"
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ""
    FIREBASE_ALLOW_LOCAL_TOKEN_FALLBACK: bool = True
    
    # Allow local development fallback when Neon DATABASE_URL is empty.
    DB_FALLBACK_SQLITE: bool = True
    
    # Use /tmp/ on Vercel since the root filesystem is read-only
    SQLITE_DB_PATH: str = "/tmp/hiring_wallah.db" if os.environ.get("VERCEL_URL") or os.environ.get("VERCEL_REGION") or os.environ.get("AWS_REGION") or os.environ.get("VERCEL") else "hiring_wallah.db"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["http://localhost:3000"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
