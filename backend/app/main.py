from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from app.api.image_search import router as image_search_router
from app.api.auth import router as auth_router
from app.api.chatbot import router as chatbot_router
from app.services.artworks.embedding_image import get_model_status, is_model_loaded

app = FastAPI(title="AI Docent Backend")

# ================================
# 🔥 CORS Middleware (필수)
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["curat-backend-production.up.railway.app"],
    allow_credentials=False,
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
# 🔥 Startup Event: 서버 시작 로그
# ================================
@app.on_event("startup")
async def startup_event():
    """서버 시작 이벤트"""
    print("=" * 80)
    print("[SERVER] 서버 시작 중...")
    print("[SERVER] ⚠️ 메모리 제한으로 인해 모델은 지연 로딩됩니다 (첫 요청 시 로드)")
    print("[SERVER] 등록된 엔드포인트:")
    print("[SERVER]   - POST /chatbot/")
    print("[SERVER]   - POST /image-search/ (첫 요청 시 모델 로드)")
    print("[SERVER]   - DELETE /auth/withdraw")
    print("[SERVER]   - GET /health (헬스체크)")
    print("=" * 80)
    print("[SERVER] ✅ AI Docent Backend 서버 시작 완료")
    print("=" * 80)

# ================================
# 🔥 Router
# ================================
app.include_router(image_search_router)
app.include_router(auth_router)
app.include_router(chatbot_router)

# ================================
# 🔥 Health Check
# ================================
@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트 (모델 상태 포함)"""
    model_status = get_model_status()
    return JSONResponse({
        "status": "healthy",
        "model": model_status,
        "message": "서버가 정상 작동 중입니다" if is_model_loaded() else "서버는 작동 중이지만 모델이 로드되지 않았습니다"
    })