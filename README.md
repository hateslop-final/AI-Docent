# CURAT
> AI 기반 미술관 도슨트 애플리케이션 — 맞춤형 전시 안내 및 통합 예약 시스템

<br>

## 프로젝트 개요

CURAT은 사용자 맞춤형 전시 안내를 제공하는 모바일 앱입니다. 사용자는 갤러리와 전시를 선택하고, AI 도슨트와 채팅하며 작품에 대해 질문할 수 있습니다. 

<br>

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🎨 맞춤형 온보딩 | 연령대, 선호도, 갤러리 선택 |
| 🤖 AI 도슨트 채팅 | OpenAI 기반 맞춤형 작품 설명 |
| 📸 이미지 검색 | CLIP 모델 기반 유사 작품 검색 |
| 🏛️ 전시 관리 | 현재/과거 전시 조회 및 상세 정보 |
| 👤 사용자 인증 | Supabase Auth 기반 (이메일, Google, Apple) |
| 💬 채팅 히스토리 | 전시별 최대 3개 세션 자동 저장 및 관리 |
| 🌙 다크모드 | 시스템 설정 기반 자동 다크모드 지원 |
| 📱 관리자 페이지 | 갤러리/전시/작품 관리 웹 인터페이스 |

<br>

## 기술 스택

### Backend
`FastAPI` `Supabase` `PyTorch` `OpenCLIP` `OpenAI` `Tavily` `Docker` `Railway`

### Mobile
`React Native` `Expo` `TypeScript` `Zustand` `Supabase JS` `Expo Router`

### Web Admin
`Next.js` `TypeScript` `Tailwind CSS` `Supabase JS`

<br>

## 아키텍처

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         ├─── Supabase 직접 호출 ──────────────────┐
         │                                          │
         └─── 백엔드 API 호출 ───┐                  ▼
                                 │           ┌──────────────┐
                                 │           │   Supabase   │
                                 ▼           │  (PostgreSQL)│
                          ┌──────────────┐   └──────────────┘
                          │   FastAPI    │
                          │   Backend   │
                          │  (Railway)  │
                          └──────┬───────┘
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌──────────────┐         ┌──────────────┐
            │  OpenAI API  │         │  CLIP Model  │
            │  (ChatGPT)  │         │  (PyTorch)   │
            └──────────────┘         └──────────────┘
```

- **프론트엔드 → Supabase 직접 조회**: 갤러리/전시/작품은 백엔드 경유 없이 직접 호출
- **백엔드는 AI 기능만 처리**: 이미지 검색(CLIP), 채팅(OpenAI) 담당
- **선택적 인증**: 로그인 없이도 앱 사용 가능
- **RAG 기반 채팅**: 작품 정보를 컨텍스트로 활용한 맞춤형 답변
- **Railway 배포**: 백엔드는 Railway에서 Docker로 배포

<br>

## 프로젝트 구조

```
AI-Docent/
├── backend/                      # FastAPI 백엔드
│   ├── app/
│   │   ├── api/                  # chatbot, image_search, auth
│   │   ├── services/             # RAG, Tavily, CLIP 임베딩
│   │   ├── models/               # Pydantic 모델
│   │   └── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── railway.toml
│
├── frontend-mobile/              # React Native (Expo)
│   ├── app/
│   │   ├── (onboarding)/         # 스플래시, 온보딩, 갤러리 선택
│   │   ├── (tabs)/               # 홈, 채팅, 마이페이지
│   │   ├── camera/               # 카메라 및 이미지 검색 결과
│   │   └── mypage/               # 로그인, 회원가입, 프로필, 설정
│   ├── components/               # ExhibitionHeader, FloatingTabBar 등
│   ├── services/                 # API, auth, chat, exhibition 등
│   └── store/                    # Zustand (auth, chat, onboarding, settings)
│
└── frontend-web/                 # Next.js 관리자 페이지
    ├── app/admin/                # galleries, exhibitions, artworks
    └── lib/                      # Supabase API, 타입 정의
```

<br>

## 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.10+
- Supabase 계정 및 프로젝트
- OpenAI API Key
- Railway 계정 (백엔드 배포용, 선택사항)

---

### 1. Supabase 설정

**1.1 프로젝트 생성**

[Supabase](https://supabase.com)에서 새 프로젝트를 생성하고 URL과 Anon Key를 복사합니다.

**1.2 데이터베이스 테이블 생성**

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- Gallery
CREATE TABLE "Gallery" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exhibition
CREATE TABLE "Exhibition" (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER REFERENCES "Gallery"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_now BOOLEAN DEFAULT false,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks (이미지 임베딩 벡터 포함)
CREATE TABLE "Artworks" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id INTEGER REFERENCES "Exhibition"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  description TEXT,
  image_url TEXT,
  production_year TEXT,
  embedding vector(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX ON "Artworks" USING ivfflat (embedding vector_cosine_ops);

-- chat_history
CREATE TABLE "chat_history" (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exhibition_id INTEGER REFERENCES "Exhibition"(id) ON DELETE CASCADE,
  title TEXT,
  age_group TEXT,
  expertise_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- chat_messages
CREATE TABLE "chat_messages" (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES "chat_history"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  artwork_id UUID REFERENCES "Artworks"(id),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**1.3 Storage 버킷 생성**

Supabase Dashboard → Storage에서 버킷을 생성합니다.
- 이름: `AI_Docent` / Public: ✅ / 경로: `Artworks/{작가명}/{파일명}`

**1.4 Authentication 설정**

Email 인증을 활성화하고 Google, Apple OAuth를 선택적으로 설정합니다.
Apple 로그인 상세 설정은 `APPLE_LOGIN_SETUP.md`를 참고하세요.

---

### 2. 백엔드 설정

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`.env` 파일 생성:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
CLIP_MODEL=ViT-B/32
TAVILY_API_KEY=your_tavily_api_key  # 선택사항
PORT=8000
```

로컬 실행:

```bash
uvicorn app.main:app --reload --port 8000
```

**API 엔드포인트**

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/image-search/` | 이미지 기반 작품 검색 |
| POST | `/chatbot/` | AI 채팅 (OpenAI + RAG) |
| POST | `/auth/verify` | 인증 검증 |

Railway 배포는 `backend/RAILWAY_DEPLOYMENT.md`를 참고하세요.

---

### 3. 모바일 앱 설정

```bash
cd frontend-mobile
npm install
```

`.env` 파일 생성:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE=https://your-backend.railway.app
```

> **주의:** 파일명은 반드시 `.env` (`.env.local` 아님), `EXPO_PUBLIC_` 접두사 필수, `=` 앞뒤 공백 없음

**플랫폼별 로컬 API 주소**

| 플랫폼 | 주소 |
|--------|------|
| iOS 시뮬레이터 | `http://127.0.0.1:8000` |
| Android 에뮬레이터 | `http://10.0.2.2:8000` |
| 실제 기기 | `http://192.168.x.x:8000` |
| 프로덕션 | Railway 배포 URL |

```bash
npm start          # 개발 서버
npm run ios        # iOS 시뮬레이터
npm run android    # Android 에뮬레이터
npm run start:tunnel  # 터널 모드
```

---

### 4. 웹 관리자 페이지 설정

```bash
cd frontend-web
npm install
```

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
# http://localhost:3000/login 에서 관리자 계정으로 로그인
```

<br>

## 데이터베이스 스키마

```typescript
// Gallery
{ id: number; name: string; location?: string; description?: string; }

// Exhibition
{ id: number; gallery_id: number; name: string; is_now: boolean; poster_url?: string; }

// Artworks
{ id: string; exhibition_id: number; title: string; artist?: string;
  image_url?: string; embedding?: number[]; /* 512차원 벡터 */ }

// chat_history
{ id: number; user_id: string; exhibition_id: number;
  age_group?: string; expertise_level?: string; }

// chat_messages
{ id: number; session_id: number; role: "user" | "assistant";
  content: string; artwork_id?: string; }
```

<br>

