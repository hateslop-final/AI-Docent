# app/utils/auth.py
from app.db.supabase import supabase
from fastapi import HTTPException

def get_user_from_token(access_token: str):
    res = supabase.auth.get_user(access_token)
    if not res.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return res.user