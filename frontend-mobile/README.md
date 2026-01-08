# AI Docent Mobile App

React Native (Expo) 기반 모바일 애플리케이션

## 개요

AI Docent 모바일 앱은 사용자 맞춤형 전시 안내를 제공하는 크로스 플랫폼 앱입니다. iOS와 Android를 지원하며, Expo를 사용하여 개발되었습니다.

## 주요 기능

- 🎨 **온보딩**: 연령대, 선호도, 갤러리 선택
- 🏛️ **갤러리/전시 선택**: 관심있는 전시 선택
- 🤖 **AI 도슨트 채팅**: 전시 작품에 대한 질문
- 📸 **이미지 검색**: 작품 사진으로 유사 작품 찾기
- 👤 **마이페이지**: 로그인/프로필 관리 (선택사항)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트(`frontend-mobile/`)에 `.env` 파일 생성:

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

**환경 변수 확인:**
앱 실행 시 콘솔에 디버깅 로그가 표시됩니다:
- `[Supabase Debug] EXPO_PUBLIC_SUPABASE_URL: ✅ 설정됨` 또는 `❌ 없음`
- 환경 변수가 읽히지 않으면 개발 서버를 재시작하세요: `npm start -- --clear`

### 3. 앱 실행

#### 로컬 네트워크 (같은 Wi-Fi)
```bash
npm start
```
QR 코드를 스캔하여 앱 실행 (같은 Wi-Fi 네트워크 필요)

#### 모든 네트워크에서 접근 (터널 모드)
```bash
npm run start:tunnel
```
- Expo의 터널링 서비스를 사용하여 인터넷 어디서나 접근 가능
- QR 코드를 스캔하면 어떤 네트워크에서도 앱 실행 가능
- 초기 연결이 약간 느릴 수 있음

```bash
# 개발 서버 시작
npm start

# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 (개발용)
npm run web
```

## 프로젝트 구조

```
frontend-mobile/
├── app/                  # Expo Router 기반 라우팅
│   ├── (onboarding)/    # 온보딩 화면
│   │   ├── splash.tsx    # 스플래시 화면
│   │   ├── age.tsx       # 연령대 선택
│   │   ├── aesthetic.tsx # 선호도 선택
│   │   └── gallery.tsx   # 갤러리 선택
│   ├── (tabs)/          # 메인 탭 화면
│   │   ├── index.tsx     # 홈 화면
│   │   ├── chat.tsx      # 채팅 화면
│   │   └── mypage.tsx    # 마이페이지 탭
│   ├── mypage/          # 마이페이지 화면
│   │   ├── index.tsx     # 마이페이지 메인
│   │   ├── login.tsx    # 로그인
│   │   ├── profile.tsx  # 프로필
│   │   └── settings.tsx # 설정
│   └── camera/          # 카메라 화면
├── components/           # 재사용 가능한 컴포넌트
│   ├── FloatingTabBar.tsx    # 플로팅 탭바
│   └── ExhibitionHeader.tsx  # 전시 헤더
├── services/            # API 서비스
│   ├── auth.ts          # Supabase 인증
│   ├── gallery.ts       # 갤러리 조회 (Supabase 직접 호출)
│   ├── exhibition.ts    # 전시 조회 (Supabase 직접 호출)
│   └── api.ts           # API 기본 설정
├── store/               # Zustand 상태 관리
│   ├── onboarding.store.ts  # 온보딩 상태
│   └── auth.store.ts        # 인증 상태
└── constants/           # 상수
    └── theme.ts        # 테마 설정
```

## 주요 기술

- **Expo Router** - 파일 기반 라우팅
- **Zustand** - 경량 상태 관리
- **Supabase JS** - 데이터베이스 클라이언트
- **React Native Safe Area Context** - 안전 영역 처리
- **@expo/vector-icons** - 아이콘

## 데이터 흐름

### Supabase 직접 호출

모든 갤러리/전시/작품 조회는 프론트엔드에서 Supabase를 직접 호출합니다:

```typescript
// services/gallery.ts
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

### 백엔드 API 호출

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

## 플랫폼별 설정

### iOS

- 시뮬레이터: `http://127.0.0.1:8000`
- 실제 기기: 로컬 네트워크 IP 사용

### Android

- 에뮬레이터: `http://10.0.2.2:8000` (자동 변환)
- 실제 기기: 로컬 네트워크 IP 사용

API 주소는 `services/api.ts`에서 자동으로 플랫폼에 맞게 변환됩니다.

## 빌드 및 배포

### EAS Build

1. EAS CLI 설치
```bash
npm install -g eas-cli
```

2. 로그인
```bash
eas login
```

3. 빌드 설정 확인
- `eas.json` 파일 확인

4. iOS 빌드
```bash
eas build --platform ios
```

5. Android 빌드
```bash
eas build --platform android
```

### TestFlight 배포 (iOS)

1. 빌드 완료 후
2. App Store Connect에서 TestFlight 업로드
3. 테스터 초대

## 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ |
| `EXPO_PUBLIC_API_BASE` | 백엔드 API 주소 | ✅ |

## 문제 해결

### 네트워크 오류

- Android 에뮬레이터: `127.0.0.1` → `10.0.2.2`로 자동 변환
- 실제 기기: 로컬 네트워크 IP 사용 필요

### Supabase 연결 오류

**환경 변수가 읽히지 않는 경우:**
1. `.env` 파일이 `frontend-mobile/` 루트에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.local` 아님)
3. 환경 변수 이름이 `EXPO_PUBLIC_`로 시작하는지 확인
4. `.env` 파일 형식 확인:
   - `=` 앞뒤 공백 없음
   - 따옴표 없음
   - 각 줄에 하나의 변수
5. 개발 서버 완전히 재시작:
   ```bash
   # 서버 종료 후
   npm start -- --clear
   ```
6. 콘솔의 디버깅 로그 확인:
   - `[Supabase Debug] EXPO_PUBLIC_SUPABASE_URL: ✅ 설정됨` 확인
   - 값이 올바른지 확인 (URL은 `https://`로 시작해야 함)

**기타:**
- Supabase 프로젝트 설정 확인
- 네트워크 연결 확인

## 라이선스

MIT
