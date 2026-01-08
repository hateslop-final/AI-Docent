# app/routers/auth.py
from fastapi import APIRouter, Header, HTTPException
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.delete("/withdraw")
async def withdraw_user(
    authorization: str = Header(...)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    access_token = authorization.replace("Bearer ", "")

    return AuthService.withdraw_user(access_token)