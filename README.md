# AI Docent

AI 기반 미술관 도슨트 애플리케이션 - 맞춤형 전시 안내 및 통합 예약 시스템

## 프로젝트 개요

AI Docent는 사용자 맞춤형 전시 안내를 제공하는 모바일 앱입니다. 사용자는 갤러리와 전시를 선택하고, AI 도슨트와 채팅하며 작품에 대해 질문할 수 있습니다. 또한 커뮤니티 기능을 통해 자신이 만든 여행 일정을 공유하고 다른 사용자들의 일정을 추천받을 수 있습니다.

## 프로젝트 구조

```
AI_Docent/
├── backend/              # FastAPI 백엔드 (이미지 검색, 채팅)
│   ├── app/
│   │   ├── api/         # API 엔드포인트
│   │   │   ├── image_search.py  # 이미지 검색 API
│   │   │   └── chatbot.py      # 채팅 API (추후 구현)
│   │   ├── services/    # 비즈니스 로직
│   │   │   └── artworks/       # 이미지 검색 서비스
│   │   └── models/      # 데이터 모델
│   └── requirements.txt
├── frontend-mobile/      # React Native (Expo) 모바일 앱
│   ├── app/              # Expo Router 기반 라우팅
│   │   ├── (onboarding)/ # 온보딩 화면
│   │   ├── (tabs)/       # 메인 탭 화면
│   │   └── mypage/       # 마이페이지
│   ├── services/         # API 서비스
│   │   ├── auth.ts       # Supabase 인증
│   │   ├── gallery.ts    # 갤러리 조회 (Supabase 직접 호출)
│   │   └── exhibition.ts # 전시 조회 (Supabase 직접 호출)
│   └── store/            # Zustand 상태 관리
├── frontend-web/         # Next.js 관리자 페이지
│   ├── app/
│   │   ├── admin/        # 관리자 페이지
│   │   │   ├── galleries/    # 갤러리 관리
│   │   │   ├── exhibitions/  # 전시 관리
│   │   │   └── artworks/     # 작품 관리
│   │   └── login/        # 로그인 페이지
│   └── lib/              # 유틸리티
│       ├── supabase.ts   # Supabase 클라이언트
│       └── api.ts        # Supabase 직접 호출 API
└── README.md
```

## 아키텍처

### 데이터 흐름

- **DB 조회**: 모든 갤러리/전시/작품 조회는 프론트엔드에서 Supabase를 직접 호출
- **백엔드 역할**: 이미지 검색(CLIP 모델), 채팅(AI) 등 AI 기능만 처리
- **인증**: Supabase Auth 사용 (선택사항, 마이페이지에서만)

### 주요 특징

- ✅ 프론트엔드에서 Supabase 직접 조회 (백엔드 경유 없음)
- ✅ 로그인 없이도 앱 사용 가능 (선택사항)
- ✅ 모바일 최적화된 온보딩 경험
- ✅ 관리자 페이지에서 갤러리/전시/작품 관리

## 환경 설정

### 1. Supabase 설정

1. Supabase 프로젝트 생성
2. 데이터베이스 테이블 생성:
   - `Gallery` - 갤러리 정보
   - `Exhibition` - 전시 정보
   - `Artworks` - 작품 정보
3. Storage 버킷 생성:
   - 버킷 이름: `AI_Docent`
   - Public bucket: 체크
   - 경로: `Artworks/{작가명}/{파일명}`
4. Authentication 설정:
   - Email 인증 활성화
   - 관리자 계정 생성

### 2. 백엔드 설정

1. Python 가상환경 생성 및 활성화
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. 의존성 설치
```bash
pip install -r requirements.txt
```

3. 환경변수 설정
`backend/app/.env` 또는 `backend/app/.env.local` 파일 생성:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CLIP_MODEL=ViT-B/32
```

4. 서버 실행
```bash
uvicorn app.main:app --reload --port 8000
```

**백엔드 API 엔드포인트:**
- `POST /image-search/` - 이미지 기반 작품 검색
- `POST /chatbot/` - AI 채팅 (추후 구현)

### 3. 모바일 앱 설정

1. 의존성 설치
```bash
cd frontend-mobile
npm install
```

2. 환경변수 설정
`frontend-mobile/.env` 파일 생성:
```env
# Supabase 설정 (필수)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 백엔드 API 주소 (필수)
EXPO_PUBLIC_API_BASE=http://127.0.0.1:8000
```

**중요 사항:**
- 파일 이름은 반드시 `.env` (`.env.local` 아님)
- `EXPO_PUBLIC_` 접두사 필수
- `=` 앞뒤 공백 없음
- 따옴표 사용하지 않음
- 각 줄에 하나의 변수
- 환경 변수 변경 후 개발 서버 재시작 필요: `npm start -- --clear`

**플랫폼별 API 주소:**
- iOS 시뮬레이터: `http://127.0.0.1:8000`
- Android 에뮬레이터: `http://10.0.2.2:8000` (자동 변환)
- 실제 기기: 로컬 네트워크 IP 사용

3. 앱 실행
```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 (개발용)
npm run web
```

### 4. 웹 관리자 페이지 설정

1. 의존성 설치
```bash
cd frontend-web
npm install
```

2. 환경변수 설정
`frontend-web/.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 관리자 로그인
- `http://localhost:3000/login`에서 로그인
- Supabase에서 생성한 관리자 계정 사용

## 주요 기능

### 모바일 앱

- 🎨 **온보딩**: 연령대, 선호도, 갤러리 선택
- 🏛️ **갤러리/전시 선택**: 관심있는 전시 선택
- 🤖 **AI 도슨트 채팅**: 전시 작품에 대한 질문
- 📸 **이미지 검색**: 작품 사진으로 유사 작품 찾기
- 👤 **마이페이지**: 로그인/프로필 관리 (선택사항)

### 관리자 페이지

- 📊 **대시보드**: 갤러리/전시/작품 통계
- 🏛️ **갤러리 관리**: CRUD 작업
- 🎨 **전시 관리**: CRUD 작업
- 🖼️ **작품 관리**: CRUD 작업, 이미지 업로드
- 🔍 **검색 및 정렬**: 작품 검색 및 정렬 기능

## 기술 스택

### 백엔드
- **FastAPI** - RESTful API 프레임워크
- **Supabase** - 데이터베이스 (PostgreSQL)
- **PyTorch + OpenCLIP** - 이미지 임베딩 (CLIP 모델)
- **Python 3.10+**

### 모바일 앱
- **React Native (Expo)** - 크로스 플랫폼 모바일 앱
- **Expo Router** - 파일 기반 라우팅
- **TypeScript** - 타입 안정성
- **Zustand** - 상태 관리
- **Supabase JS** - 데이터베이스 클라이언트
- **@expo/vector-icons** - 아이콘

### 웹 관리자
- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Supabase JS** - 데이터베이스 클라이언트

## 데이터베이스 스키마

### Gallery
- `id` (int) - PK
- `name` (string) - 갤러리 이름
- `location` (string) - 위치
- `description` (string) - 설명

### Exhibition
- `id` (int) - PK
- `gallery_id` (int) - FK → Gallery
- `name` (string) - 전시 이름
- `description` (string) - 설명
- `start_date` (date) - 시작일
- `end_date` (date) - 종료일
- `is_now` (bool) - 현재 진행 중 여부

### Artworks
- `id` (UUID) - PK
- `exhibition_id` (int) - FK → Exhibition
- `title` (string) - 작품 제목
- `artist` (string) - 작가
- `description` (string) - 설명
- `image_url` (string) - 이미지 URL
- `production_year` (string) - 제작 연도
- `embedding` (float[]) - 이미지 임베딩 벡터

## 개발 가이드

### 프론트엔드에서 Supabase 직접 호출

모든 DB 조회는 프론트엔드에서 Supabase를 직접 호출합니다:

```typescript
// frontend-mobile/services/gallery.ts
import { supabase } from "./auth";

export async function fetchGalleries() {
  const { data, error } = await supabase
    .from("Gallery")
    .select("*")
    .order("name");
  
  if (error) throw new Error(error.message);
  return data || [];
}
```

### 백엔드 API 사용

이미지 검색만 백엔드를 통해 처리:

```typescript
// 이미지 검색
const formData = new FormData();
formData.append("image", imageFile);
formData.append("exhibition_id", exhibitionId);

const response = await fetch(`${API_BASE}/image-search/`, {
  method: "POST",
  body: formData,
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
```

## 배포

### 모바일 앱 (EAS Build)

1. EAS CLI 설치
```bash
npm install -g eas-cli
```

2. EAS 로그인
```bash
eas login
```

3. 빌드 설정 확인
- `frontend-mobile/eas.json` 확인

4. iOS 빌드
```bash
cd frontend-mobile
eas build --platform ios
```

5. Android 빌드
```bash
eas build --platform android
```

### 웹 관리자 페이지

Vercel, Netlify 등에 배포:

```bash
cd frontend-web
npm run build
```

환경변수 설정:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 백엔드

Docker 또는 클라우드 서버에 배포:

```bash
cd backend
docker build -t ai-docent-backend .
docker run -p 8000:8000 --env-file .env ai-docent-backend
```

## 라이선스

MIT
