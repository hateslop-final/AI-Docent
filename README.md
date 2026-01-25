# CURAT

AI 기반 미술관 도슨트 애플리케이션 - 맞춤형 전시 안내 및 통합 예약 시스템

## 📋 프로젝트 개요

CURAT은 사용자 맞춤형 전시 안내를 제공하는 모바일 앱입니다. 사용자는 갤러리와 전시를 선택하고, AI 도슨트와 채팅하며 작품에 대해 질문할 수 있습니다. 또한 커뮤니티 기능을 통해 자신이 만든 여행 일정을 공유하고 다른 사용자들의 일정을 추천받을 수 있습니다.

### 주요 기능
- 🎨 **맞춤형 온보딩**: 연령대, 선호도, 갤러리 선택
- 🤖 **AI 도슨트 채팅**: OpenAI 기반 맞춤형 작품 설명
- 📸 **이미지 검색**: CLIP 모델 기반 유사 작품 검색
- 🏛️ **전시 관리**: 현재/과거 전시 조회 및 상세 정보
- 👤 **사용자 인증**: Supabase Auth 기반 로그인/회원가입
- 💬 **채팅 히스토리**: 전시별 최대 3개 세션 자동 저장 및 관리
- 🌙 **다크모드**: 시스템 설정 기반 자동 다크모드 지원
- 📱 **관리자 페이지**: 갤러리/전시/작품 관리 웹 인터페이스

---

## 📁 프로젝트 구조

```
AI-Docent/
├── backend/                      # FastAPI 백엔드 서버
│   ├── app/
│   │   ├── api/                  # API 엔드포인트
│   │   │   ├── auth.py           # 인증 API
│   │   │   ├── chatbot.py        # AI 채팅 API
│   │   │   └── image_search.py   # 이미지 검색 API
│   │   ├── core/
│   │   │   └── config.py         # 환경 설정 관리
│   │   ├── db/
│   │   │   └── supabase.py       # Supabase 클라이언트
│   │   ├── models/               # Pydantic 데이터 모델
│   │   │   ├── artworks.py       # 작품 모델
│   │   │   ├── chatbot.py        # 채팅 모델
│   │   │   └── image_search.py   # 이미지 검색 모델
│   │   ├── services/             # 비즈니스 로직
│   │   │   ├── artworks/         # 작품 관련 서비스
│   │   │   │   ├── ai_review.py  # AI 작품 리뷰 생성
│   │   │   │   ├── embedding_image.py  # 이미지 임베딩 생성
│   │   │   │   └── image_search.py     # 유사 작품 검색
│   │   │   ├── auth_service.py   # 인증 서비스
│   │   │   └── chat/             # 채팅 관련 서비스
│   │   │       ├── rag_service.py      # RAG 기반 답변 생성
│   │   │       └── tavily_service.py    # Tavily 검색 통합
│   │   ├── utils/
│   │   │   └── auth.py           # 인증 유틸리티
│   │   └── main.py               # FastAPI 앱 진입점
│   ├── Dockerfile                # Docker 이미지 빌드 설정
│   ├── requirements.txt          # Python 의존성
│   ├── railway.toml               # Railway 배포 설정
│   ├── RAILWAY_DEPLOYMENT.md     # Railway 배포 가이드
│   └── FLY_DEPLOYMENT.md         # Fly.io 배포 가이드
│
├── frontend-mobile/              # React Native (Expo) 모바일 앱
│   ├── app/                      # Expo Router 기반 라우팅
│   │   ├── _layout.tsx           # 루트 레이아웃 (네비게이션 설정)
│   │   ├── index.tsx              # 초기 라우팅 로직
│   │   ├── (onboarding)/         # 온보딩 화면 그룹
│   │   │   ├── splash.tsx         # 스플래시 화면 (커스텀 애니메이션)
│   │   │   ├── onboarding.tsx    # 통합 온보딩 화면
│   │   │   ├── age.tsx            # 연령대 선택
│   │   │   ├── aesthetic.tsx     # 선호도 선택 (가볍게/적당히/깊이있게)
│   │   │   └── gallery.tsx        # 갤러리 선택
│   │   ├── (tabs)/                # 메인 탭 화면 그룹
│   │   │   ├── _layout.tsx        # 탭 레이아웃 (플로팅 탭바)
│   │   │   ├── index.tsx          # 홈 화면 (전시 카드 목록)
│   │   │   ├── chat.tsx           # AI 채팅 화면
│   │   │   ├── mypage.tsx         # 마이페이지 탭
│   │   │   └── exhibition/
│   │   │       ├── _layout.tsx    # 전시 상세 레이아웃
│   │   │       └── [id].tsx       # 전시 상세 페이지
│   │   ├── camera/                # 카메라 기능
│   │   │   ├── index.tsx          # 카메라 화면
│   │   │   ├── result.tsx         # 이미지 검색 결과
│   │   │   └── noresult.tsx       # 검색 결과 없음
│   │   ├── mypage/                # 마이페이지 서브 화면
│   │   │   ├── login.tsx          # 로그인
│   │   │   ├── signup.tsx         # 회원가입
│   │   │   ├── profile.tsx        # 프로필 관리
│   │   │   ├── settings.tsx       # 설정 (다크모드, 알림)
│   │   │   ├── features.tsx       # 기능 소개
│   │   │   └── withdraw.tsx       # 회원 탈퇴
│   │   └── past/
│   │       └── index.tsx          # 과거 전시 목록
│   ├── components/                # 재사용 가능한 컴포넌트
│   │   ├── ChatInput.tsx          # 채팅 입력 컴포넌트
│   │   ├── ExhibitionHeader.tsx  # 전시 헤더 (갤러리/전시 선택)
│   │   ├── FloatingTabBar.tsx    # 플로팅 탭바
│   │   ├── GoogleLoginButton.tsx # Google 로그인 버튼
│   │   ├── SessionListModal.tsx  # 세션 목록 모달
│   │   ├── ThemeProvider.tsx     # 다크모드 테마 제공자
│   │   ├── haptic-tab.tsx         # 햅틱 피드백 탭
│   │   └── ui/                    # UI 컴포넌트
│   │       ├── icon-symbol.tsx    # 아이콘 심볼
│   │       └── icon-symbol.ios.tsx
│   ├── services/                  # API 서비스 레이어
│   │   ├── api.ts                 # API 기본 설정
│   │   ├── auth.ts                # Supabase 인증 서비스
│   │   ├── artwork.ts             # 작품 조회 서비스
│   │   ├── chatbot.ts             # AI 채팅 서비스
│   │   ├── chathistory_service.ts # 채팅 히스토리 관리
│   │   ├── exhibition.ts          # 전시 조회 서비스
│   │   ├── gallery.ts             # 갤러리 조회 서비스
│   │   ├── photo.ts               # 사진 처리 서비스
│   │   ├── storage.ts             # 스토리지 서비스
│   │   └── supabase.ts            # Supabase 클라이언트
│   ├── store/                     # Zustand 상태 관리
│   │   ├── auth.store.ts          # 인증 상태
│   │   ├── chat.store.ts          # 채팅 상태 (메시지, 세션)
│   │   ├── onboarding.store.ts   # 온보딩 상태 (연령, 선호도, 갤러리)
│   │   └── settings.store.ts      # 설정 상태 (다크모드, 알림)
│   ├── constants/
│   │   └── theme.ts               # 테마 색상 정의
│   ├── hooks/                     # 커스텀 훅
│   │   ├── use-color-scheme.ts   # 다크모드 감지
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme-color.ts     # 테마 색상 훅
│   ├── assets/
│   │   ├── icon.png               # 앱 아이콘 (1024x1024)
│   │   └── images/                # 이미지 리소스
│   ├── app.json                   # Expo 앱 설정
│   ├── eas.json                   # EAS 빌드 설정
│   ├── package.json               # npm 의존성
│   └── tsconfig.json              # TypeScript 설정
│
├── frontend-web/                  # Next.js 관리자 페이지
│   ├── app/
│   │   ├── admin/                 # 관리자 페이지
│   │   │   ├── galleries/         # 갤러리 관리
│   │   │   │   └── page.tsx
│   │   │   ├── exhibitions/       # 전시 관리
│   │   │   │   └── page.tsx
│   │   │   ├── artworks/          # 작품 관리
│   │   │   │   └── page.tsx
│   │   │   └── database/          # 데이터베이스 스키마
│   │   │       └── page.tsx
│   │   ├── login/                 # 로그인 페이지
│   │   │   └── page.tsx
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── page.tsx               # 홈 페이지
│   │   └── globals.css            # 전역 스타일
│   ├── components/
│   │   ├── AdminSidebar.tsx       # 관리자 사이드바
│   │   ├── AuthGuard.tsx          # 인증 가드
│   │   └── LogoutButton.tsx       # 로그아웃 버튼
│   ├── lib/
│   │   ├── api.ts                 # Supabase 직접 호출 API
│   │   ├── auth.ts                # 인증 함수
│   │   ├── supabase.ts            # Supabase 클라이언트
│   │   └── types.ts               # TypeScript 타입
│   ├── package.json               # npm 의존성
│   └── tsconfig.json              # TypeScript 설정
│
├── docker-compose.dev.yml         # Docker Compose 개발 환경 설정
├── EXECUTION_FLOW.md              # 채팅 세션 저장 흐름 문서
└── README.md                      # 이 파일
```

---

## 🏗️ 아키텍처

### 데이터 흐름

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         ├─── Supabase 직접 호출 ───┐
         │                          │
         │                          ▼
         │                   ┌──────────────┐
         │                   │   Supabase   │
         │                   │  (PostgreSQL)│
         │                   └──────────────┘
         │
         └─── 백엔드 API 호출 ───┐
                                │
                                ▼
                         ┌──────────────┐
                         │   FastAPI    │
                         │   Backend    │
                         │  (Railway)   │
                         └──────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │  OpenAI API  │        │  CLIP Model  │
            │  (ChatGPT)   │        │  (PyTorch)   │
            └──────────────┘        └──────────────┘
```

### 주요 특징

- ✅ **프론트엔드에서 Supabase 직접 조회**: 갤러리/전시/작품 조회는 백엔드 경유 없이 직접 호출
- ✅ **백엔드는 AI 기능만 처리**: 이미지 검색(CLIP), 채팅(OpenAI) 등 AI 기능만 담당
- ✅ **선택적 인증**: 로그인 없이도 앱 사용 가능, 마이페이지에서만 로그인 기능 제공
- ✅ **세션 관리**: 전시별 최대 3개 세션, 전시 변경 시 자동 저장 및 복원
- ✅ **RAG 기반 채팅**: 작품 정보를 컨텍스트로 활용한 맞춤형 답변
- ✅ **Tavily 검색 통합**: 작품 정보가 부족할 때 웹 검색으로 보완
- ✅ **다크모드 지원**: 시스템 설정 기반 자동 다크모드, 수동 전환 가능
- ✅ **Railway 배포**: 백엔드는 Railway에서 Docker로 배포

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18+ 및 npm
- **Python** 3.10+
- **Expo CLI** (`npm install -g eas-cli`)
- **Supabase** 계정 및 프로젝트
- **OpenAI API Key** (채팅 기능용)
- **Railway 계정** (백엔드 배포용, 선택사항)

### 1. Supabase 설정

#### 1.1 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 Anon Key 복사

#### 1.2 데이터베이스 테이블 생성

**Gallery 테이블:**
```sql
CREATE TABLE "Gallery" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Exhibition 테이블:**
```sql
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
```

**Artworks 테이블:**
```sql
CREATE TABLE "Artworks" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id INTEGER REFERENCES "Exhibition"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  description TEXT,
  image_url TEXT,
  production_year TEXT,
  embedding vector(512),  -- pgvector 확장 필요
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 인덱스 생성 (유사도 검색용)
CREATE INDEX ON "Artworks" USING ivfflat (embedding vector_cosine_ops);
```

**chat_history 테이블:**
```sql
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

-- 전시당 최대 3개 세션 제한을 위한 제약조건
CREATE UNIQUE INDEX unique_user_exhibition_session 
ON "chat_history" (user_id, exhibition_id, id);
```

**chat_messages 테이블:**
```sql
CREATE TABLE "chat_messages" (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES "chat_history"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  artwork_id UUID REFERENCES "Artworks"(id),
  image_url TEXT,  -- 선택사항: 이미지 URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.3 Storage 버킷 생성
1. Supabase Dashboard → Storage
2. 새 버킷 생성:
   - 이름: `AI_Docent`
   - Public bucket: ✅ 체크
   - 경로: `Artworks/{작가명}/{파일명}`

#### 1.4 Authentication 설정
1. Supabase Dashboard → Authentication
2. Email 인증 활성화
3. Google OAuth 설정 (선택사항)
4. 관리자 계정 생성 (관리자 페이지 로그인용)

### 2. 백엔드 설정

#### 2.1 가상환경 생성
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### 2.2 의존성 설치
```bash
pip install -r requirements.txt
```

#### 2.3 환경변수 설정
환경변수는 배포 플랫폼(Railway)에서 설정하거나, 로컬 개발 시 `.env` 파일 생성:

```env
# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI 설정
OPENAI_API_KEY=your_openai_api_key

# CLIP 모델 설정
CLIP_MODEL=ViT-B/32

# Tavily API (선택사항, 웹 검색 기능용)
TAVILY_API_KEY=your_tavily_api_key

# Railway 배포 시 포트 (자동 설정됨)
PORT=8000
```

#### 2.4 로컬 서버 실행
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**백엔드 API 엔드포인트:**
- `GET /health` - 서버 상태 확인
- `POST /image-search/` - 이미지 기반 작품 검색
- `POST /chatbot/` - AI 채팅 (OpenAI + RAG)
- `POST /auth/verify` - 인증 검증

#### 2.5 Railway 배포
자세한 배포 가이드는 `backend/RAILWAY_DEPLOYMENT.md` 참고

```bash
# Railway CLI 설치
npm i -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 초기화
cd backend
railway init

# 환경변수 설정
railway variables set SUPABASE_URL=...
railway variables set OPENAI_API_KEY=...

# 배포
railway up
```

### 3. 모바일 앱 설정

#### 3.1 의존성 설치
```bash
cd frontend-mobile
npm install
```

#### 3.2 환경변수 설정
`frontend-mobile/.env` 파일 생성:
```env
# Supabase 설정 (필수)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 백엔드 API 주소 (필수)
EXPO_PUBLIC_API_BASE=https://your-backend.railway.app
```

**중요 사항:**
- 파일 이름은 반드시 `.env` (`.env.local` 아님)
- `EXPO_PUBLIC_` 접두사 필수
- `=` 앞뒤 공백 없음
- 따옴표 사용하지 않음
- 각 줄에 하나의 변수
- 환경 변수 변경 후 개발 서버 재시작 필요: `npm start -- --clear`

**플랫폼별 API 주소:**
- iOS 시뮬레이터: `http://127.0.0.1:8000` (로컬 개발)
- Android 에뮬레이터: `http://10.0.2.2:8000` (자동 변환)
- 실제 기기: 로컬 네트워크 IP 사용 (예: `http://192.168.0.100:8000`)
- 프로덕션: Railway 배포 URL 사용

#### 3.3 앱 실행
```bash
# 개발 서버 시작
npm start

# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 (개발용)
npm run web

# 터널 모드 (모든 네트워크에서 접근 가능)
npm run start:tunnel
```

### 4. 웹 관리자 페이지 설정

#### 4.1 의존성 설치
```bash
cd frontend-web
npm install
```

#### 4.2 환경변수 설정
`frontend-web/.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4.3 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

#### 4.4 관리자 로그인
1. `http://localhost:3000/login` 접속
2. Supabase에서 생성한 관리자 계정으로 로그인

---

## 📱 주요 기능 상세

### 모바일 앱

#### 온보딩 플로우
1. **스플래시 화면** (`splash.tsx`)
   - 커스텀 애니메이션: 로고 페이드인 및 슬라이드
   - 자동으로 다음 화면으로 이동

2. **통합 온보딩** (`onboarding.tsx`)
   - 연령대 선택: 청소년 / 성인
   - 선호도 선택: 가볍게 / 적당히 / 깊이 있게
   - 갤러리 선택: Supabase에서 갤러리 목록 조회
   - 선택값은 `onboarding.store`에 저장

#### 메인 화면
- **홈** (`index.tsx`): 현재/과거 전시 카드 목록
- **채팅** (`chat.tsx`): AI 도슨트와 대화
- **마이페이지** (`mypage.tsx`): 프로필, 설정, 로그인

#### 채팅 기능
- **세션 관리**: 전시별 최대 3개 세션
- **자동 저장**: 전시 변경 시 이전 세션 자동 저장
- **컨텍스트 인식**: 현재 선택한 작품 정보를 컨텍스트로 활용
- **RAG 기반 답변**: 작품 정보를 기반으로 맞춤형 답변 생성
- **Tavily 검색**: 작품 정보가 부족할 때 웹 검색으로 보완
- **세션 모달**: 기존 세션 목록 조회 및 선택

#### 이미지 검색
- **카메라 촬영**: `expo-camera`로 작품 사진 촬영
- **CLIP 임베딩**: 백엔드에서 이미지를 벡터로 변환
- **유사도 검색**: 전시 내 유사 작품 검색 (pgvector)

#### 다크모드
- **자동 감지**: 시스템 설정 기반 자동 다크모드
- **수동 전환**: 설정에서 수동으로 다크모드 전환 가능
- **테마 일관성**: 모든 화면에서 일관된 다크모드 지원

### 관리자 페이지

#### 갤러리 관리
- CRUD 작업 (생성, 조회, 수정, 삭제)
- Supabase 직접 호출

#### 전시 관리
- 갤러리별 전시 목록
- 전시 정보 수정
- 포스터 이미지 업로드

#### 작품 관리
- 전시별 작품 목록
- 작품 정보 및 이미지 업로드
- 이미지 임베딩 자동 생성 (백엔드 API 호출)

---

## 🛠️ 기술 스택

### 백엔드
- **FastAPI** 0.115.0 - RESTful API 프레임워크
- **Supabase** 2.10.0 - 데이터베이스 클라이언트
- **PyTorch** 2.5.1 - 딥러닝 프레임워크 (CPU 버전)
- **OpenCLIP** 2.24.0+ - CLIP 모델 (이미지 임베딩)
- **OpenAI** 1.0+ - ChatGPT API
- **Tavily** 0.3.0+ - 웹 검색 API
- **Python** 3.10+
- **Docker** - 컨테이너화
- **Railway** - 배포 플랫폼

### 모바일 앱
- **React Native** 0.81.5 - 크로스 플랫폼 프레임워크
- **Expo** ~54.0.30 - 개발 도구 및 런타임
- **Expo Router** ~6.0.21 - 파일 기반 라우팅
- **TypeScript** 5.9.2 - 타입 안정성
- **Zustand** 5.0.9 - 상태 관리
- **Supabase JS** 2.89.0 - 데이터베이스 클라이언트
- **React Navigation** 7.x - 네비게이션 (스택, 탭)
- **expo-camera** ~17.0.10 - 카메라 기능
- **expo-image-picker** 17.0.10 - 이미지 선택
- **expo-notifications** 0.32.16 - 푸시 알림
- **expo-linear-gradient** 15.0.8 - 그라디언트
- **react-native-svg** 15.15.1 - SVG 렌더링
- **@expo/vector-icons** 15.0.3 - 아이콘
- **EAS Build** - 클라우드 빌드 서비스

### 웹 관리자
- **Next.js** 16.1.1 - React 프레임워크
- **TypeScript** 5.x - 타입 안정성
- **Tailwind CSS** 4.x - 스타일링
- **Supabase JS** 2.39.0 - 데이터베이스 클라이언트

---

## 🗄️ 데이터베이스 스키마

### Gallery
```typescript
{
  id: number;              // PK, 자동 증가
  name: string;            // 갤러리 이름
  location?: string;       // 위치
  description?: string;     // 설명
  created_at: Date;
  updated_at: Date;
}
```

### Exhibition
```typescript
{
  id: number;              // PK, 자동 증가
  gallery_id: number;      // FK → Gallery
  name: string;            // 전시 이름
  description?: string;     // 설명
  start_date?: Date;       // 시작일
  end_date?: Date;         // 종료일
  is_now: boolean;         // 현재 진행 중 여부
  poster_url?: string;     // 포스터 이미지 URL
  created_at: Date;
  updated_at: Date;
}
```

### Artworks
```typescript
{
  id: string;             // PK, UUID
  exhibition_id: number;   // FK → Exhibition
  title: string;           // 작품 제목
  artist?: string;         // 작가
  description?: string;     // 설명
  image_url?: string;       // 이미지 URL
  production_year?: string; // 제작 연도
  embedding?: number[];    // 이미지 임베딩 벡터 (512차원)
  created_at: Date;
  updated_at: Date;
}
```

### chat_history
```typescript
{
  id: number;              // PK, 자동 증가
  user_id: string;         // FK → auth.users
  exhibition_id: number;  // FK → Exhibition
  title?: string;          // 세션 제목
  age_group?: string;      // "teen" | "adult"
  expertise_level?: string; // "light" | "medium" | "deep"
  created_at: Date;
  updated_at: Date;
}
```

### chat_messages
```typescript
{
  id: number;              // PK, 자동 증가
  session_id: number;      // FK → chat_history
  role: "user" | "assistant";
  content: string;         // 메시지 내용
  artwork_id?: string;     // FK → Artworks (관련 작품)
  image_url?: string;      // 이미지 URL (선택사항)
  created_at: Date;
}
```

---

## 💻 개발 가이드

### 프론트엔드에서 Supabase 직접 호출

모든 DB 조회는 프론트엔드에서 Supabase를 직접 호출합니다:

```typescript
// frontend-mobile/services/gallery.ts
import { supabase } from "./supabase";

export async function fetchGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabase
    .from("Gallery")
    .select("*")
    .order("name");
  
  if (error) throw new Error(error.message);
  return data || [];
}
```

### 백엔드 API 사용

이미지 검색과 채팅만 백엔드를 통해 처리:

```typescript
// 이미지 검색
const formData = new FormData();
formData.append("image", imageFile);
formData.append("exhibition_id", exhibitionId.toString());

const response = await fetch(`${API_BASE}/image-search/`, {
  method: "POST",
  body: formData,
});

// AI 채팅
const response = await fetch(`${API_BASE}/chatbot/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: userMessage,
    artwork_id: currentArtworkId,
    age_group: age,
    expertise_level: aesthetic,
  }),
});
```

### 인증 (선택사항)

로그인 없이도 앱 사용 가능. 마이페이지에서만 로그인 기능 제공:

```typescript
// 로그인
import { signIn } from "@/services/auth";
await signIn(email, password);

// 현재 사용자 확인
import { getCurrentUser } from "@/services/auth";
const user = await getCurrentUser();

// 로그아웃
import { signOut } from "@/services/auth";
await signOut();
```

### 채팅 세션 관리

전시 변경 시 자동으로 세션 저장 및 생성:

```typescript
// ExhibitionHeader.tsx에서 자동 처리
// 1. 전시 변경 감지
// 2. 이전 전시의 세션 DB 저장
// 3. 새 전시의 기존 세션 확인
// 4. 없으면 새 세션 생성 (최대 3개 제한)
```

자세한 흐름은 `EXECUTION_FLOW.md` 참고

### 상태 관리 (Zustand)

```typescript
// 온보딩 상태
import { useOnboardingStore } from "@/store/onboarding.store";
const age = useOnboardingStore((s) => s.age);
const setAge = useOnboardingStore((s) => s.setAge);

// 채팅 상태
import { useChatStore } from "@/store/chat.store";
const messages = useChatStore((s) => s.getChatHistory(exhibitionId));
useChatStore.getState().addMessage(exhibitionId, message);

// 인증 상태
import { useAuth } from "@/store/auth.store";
const { user, initialized } = useAuth();

// 설정 상태 (다크모드)
import { useSettingsStore } from "@/store/settings.store";
const { theme, toggleTheme } = useSettingsStore();
```

---

## 🚢 배포

### 모바일 앱 (EAS Build)

1. **EAS CLI 설치**
```bash
npm install -g eas-cli
```

2. **EAS 로그인**
```bash
eas login
```

3. **빌드 설정 확인**
- `frontend-mobile/eas.json` 확인
- iOS/Android 빌드 프로필 설정
- 환경변수 확인 (Supabase, API URL)

4. **iOS 빌드**
```bash
cd frontend-mobile
eas build --platform ios --profile production
```

5. **Android 빌드**
```bash
eas build --platform android --profile production
```

6. **앱 스토어 제출**
- iOS: App Store Connect
- Android: Google Play Console

**빌드 프로필:**
- `development`: 개발 클라이언트 빌드
- `preview`: 내부 테스트용 빌드
- `production`: 앱 스토어 제출용 빌드

### 웹 관리자 페이지

**Vercel 배포:**
```bash
cd frontend-web
npm run build
vercel deploy
```

환경변수 설정:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Netlify 배포:**
```bash
npm run build
netlify deploy --prod
```

### 백엔드

**Railway 배포 (권장):**
자세한 가이드는 `backend/RAILWAY_DEPLOYMENT.md` 참고

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
cd backend
railway init

# 환경변수 설정
railway variables set SUPABASE_URL=...
railway variables set OPENAI_API_KEY=...

# 배포
railway up
```

**Docker 배포:**
```bash
cd backend
docker build -t ai-docent-backend .
docker run -p 8000:8000 --env-file .env ai-docent-backend
```

**다른 클라우드 서버 배포:**
- AWS EC2, Google Cloud Run, Heroku 등
- 환경변수 설정 필수
- 포트 8000 노출 (또는 Railway가 자동 설정)

---

## 📚 주요 파일 설명

### 백엔드

- `app/main.py`: FastAPI 앱 진입점, CORS 설정, 라우터 등록, 헬스 체크
- `app/api/chatbot.py`: AI 채팅 API, RAG 및 Tavily 통합
- `app/api/image_search.py`: 이미지 검색 API, CLIP 임베딩
- `app/services/chat/rag_service.py`: RAG 기반 답변 생성 로직
- `app/services/artworks/embedding_image.py`: 이미지 임베딩 생성 (지연 로딩)
- `app/core/config.py`: 환경변수 관리 (Pydantic Settings)
- `Dockerfile`: Docker 이미지 빌드 설정 (CPU PyTorch)
- `railway.toml`: Railway 배포 설정

### 모바일 앱

- `app/_layout.tsx`: 루트 레이아웃, 네비게이션 애니메이션 설정
- `app/(onboarding)/splash.tsx`: 스플래시 화면 (커스텀 애니메이션)
- `app/(tabs)/chat.tsx`: AI 채팅 화면, 메시지 관리, 세션 처리
- `app/(tabs)/index.tsx`: 홈 화면, 전시 카드 목록
- `components/ExhibitionHeader.tsx`: 전시 헤더, 세션 자동 저장 로직
- `components/ThemeProvider.tsx`: 다크모드 테마 제공자
- `services/chathistory_service.ts`: 채팅 히스토리 DB 관리
- `store/chat.store.ts`: 채팅 상태 관리 (Zustand)
- `store/settings.store.ts`: 설정 상태 관리 (다크모드, 알림)
- `app.json`: Expo 앱 설정 (아이콘, 권한, 플러그인)
- `eas.json`: EAS 빌드 설정 (환경변수, 프로필)

### 웹 관리자

- `app/admin/galleries/page.tsx`: 갤러리 관리 페이지
- `app/admin/exhibitions/page.tsx`: 전시 관리 페이지
- `app/admin/artworks/page.tsx`: 작품 관리 페이지
- `lib/api.ts`: Supabase 직접 호출 API 함수들

---

## 🔧 문제 해결

### 모바일 앱

**환경변수가 적용되지 않음:**
- `.env` 파일 이름 확인 (`.env.local` 아님)
- `EXPO_PUBLIC_` 접두사 확인
- 개발 서버 재시작: `npm start -- --clear`

**백엔드 API 연결 실패:**
- iOS 시뮬레이터: `http://127.0.0.1:8000`
- Android 에뮬레이터: `http://10.0.2.2:8000`
- 실제 기기: 로컬 네트워크 IP 사용
- 프로덕션: Railway 배포 URL 확인 (`https://` 프로토콜 포함)

**이미지 검색이 작동하지 않음:**
- 백엔드 서버 실행 확인
- `EXPO_PUBLIC_API_BASE` 환경변수 확인
- 네트워크 연결 확인

**아이콘이 제대로 표시되지 않음:**
- 아이콘 파일이 1024x1024 PNG 형식인지 확인
- `app.json`의 `icon` 경로 확인
- 빌드 후 캐시 클리어

### 백엔드

**CLIP 모델 로딩 실패:**
- PyTorch 설치 확인
- 모델 다운로드 확인 (첫 실행 시 자동 다운로드)
- 메모리 부족 시 더 작은 모델 사용 (`ViT-B/32`)
- Railway 배포 시 메모리 제한 확인 (최소 1GB 권장)

**OpenAI API 오류:**
- API 키 확인
- 요청 한도 확인
- 네트워크 연결 확인

**Railway 배포 실패:**
- `railway.toml` 설정 확인
- 환경변수 설정 확인
- Docker 빌드 로그 확인
- 포트 설정 확인 (Railway가 자동 설정)

### 웹 관리자

**로그인이 안 됨:**
- Supabase 인증 설정 확인
- 관리자 계정 생성 확인
- 환경변수 확인

---

## 📝 라이선스

MIT

---

## 👥 기여

프로젝트 개선을 위한 제안과 기여를 환영합니다!

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
