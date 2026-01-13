from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    ENV: str = "development"

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    OPENAI_API_KEY : str
    OPENAI_MODEL : str = "gpt-4o-mini"
    CLIP_MODEL: str = "ViT-B/32"
    TAVILY_API_KEY: str=""
    class Config:
        env_file = [
            Path("/backend/app/.env.local"),
            Path("/backend/app/.env"),
            Path(__file__).parent.parent / ".env.local",
            Path(__file__).parent.parent / ".env",
            Path(__file__).parent / ".env.local",
            Path(__file__).parent / ".env",
            ".env.local",
            ".env"
        ]
        case_sensitive = False
        env_file_encoding = 'utf-8'
        env_ignore_empty = False

settings = Settings()