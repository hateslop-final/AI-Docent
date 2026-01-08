from supabase import create_client, Client
from app.core.config import settings

if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY or not settings.SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError(
        f"Supabase 환경 변수가 설정되지 않았습니다.\n"
        f"SUPABASE_URL: {'SET' if settings.SUPABASE_URL else 'NOT SET'}\n"
        f"SUPABASE_ANON_KEY: {'SET' if settings.SUPABASE_ANON_KEY else 'NOT SET'}"
        f"SUPABASE_SERVICE_ROLE_KEY: {'SET' if settings.SUPABASE_SERVICE_ROLE_KEY else 'NOT SET'}"
    )

def get_supabase_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )

supabase: Client = get_supabase_client()

def get_supabase_admin_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )

supabase_admin: Client = get_supabase_admin_client()

print("========== Supabase ENV CHECK ==========")
print("SUPABASE_URL:", settings.SUPABASE_URL)
print("SUPABASE_ANON_KEY:", "SET" if settings.SUPABASE_ANON_KEY else "NOT SET")
print("SUPABASE_SERVICE_ROLE_KEY:", "SET" if settings.SUPABASE_SERVICE_ROLE_KEY else "NOT SET")
print("=======================================")