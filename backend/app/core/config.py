from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    ENV: str = "development"

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    CLIP_MODEL: str = "ViT-B/32"
    TAVILY_API_KEY: str = ""
    
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

# 환경 변수 검증 (앱 시작 시 에러 방지)
try:
    settings = Settings()
    # 필수 환경 변수 확인
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        print("[WARNING] Supabase 환경 변수가 설정되지 않았습니다. 일부 기능이 작동하지 않을 수 있습니다.")
    if not settings.OPENAI_API_KEY:
        print("[WARNING] OpenAI API 키가 설정되지 않았습니다. 챗봇 기능이 작동하지 않을 수 있습니다.")
except Exception as e:
    print(f"[ERROR] 설정 로드 실패: {e}")
    # 기본값으로 설정 객체 생성 (앱이 시작되도록)
    settings = Settings(
        SUPABASE_URL="",
        SUPABASE_ANON_KEY="",
        SUPABASE_SERVICE_ROLE_KEY="",
        OPENAI_API_KEY=""
    )