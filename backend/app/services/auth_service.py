from app.db.supabase import supabase_admin
from app.utils.auth import get_user_from_token

class AuthService:

    @staticmethod
    def withdraw_user(access_token: str):
        """
        회원 탈퇴:
        1. 토큰으로 유저 식별
        2. DB 데이터 삭제
        3. Auth 유저 삭제
        """

        user = get_user_from_token(access_token)
        user_id = user.id

        supabase_admin.table("user_history").delete().eq("user_id", user_id).execute()
        supabase_admin.table("users").delete().eq("id", user_id).execute()

        # 🔥 Auth 유저 완전 삭제
        supabase_admin.auth.admin.delete_user(user_id)

        return {"message": "Account deleted successfully"}