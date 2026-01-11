from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from app.api.image_search import router as image_search_router
from app.api.auth import router as auth_router
from app.api.chatbot import router as chatbot_router

app = FastAPI(title="AI Docent Backend")

# ================================
# 🔥 CORS Middleware (필수)
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# 🔥 Request Logging Middleware
# ================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # 요청 시작 로그
    print(f"[REQUEST] {request.method} {request.url.path} - 시작")
    print(f"[REQUEST] Headers: {dict(request.headers)}")
    print(f"[REQUEST] Query params: {dict(request.query_params)}")
    
    response = await call_next(request)
    process_time = time.time() - start_time

    print(
        f"[REQUEST] {request.method} {request.url.path} "
        f"- {response.status_code} "
        f"- {process_time:.3f}s"
    )

    return response


# ================================
# 🔥 Router
# ================================
app.include_router(image_search_router)
app.include_router(auth_router)
app.include_router(chatbot_router)

# 서버 시작 로그
print("=" * 80)
print("[SERVER] AI Docent Backend 서버 시작 완료")
print("[SERVER] 등록된 엔드포인트:")
print("[SERVER]   - POST /chatbot/")
print("[SERVER]   - POST /image-search/")
print("[SERVER]   - DELETE /auth/withdraw")
print("=" * 80)