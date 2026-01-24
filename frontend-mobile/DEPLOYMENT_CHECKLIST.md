# Expo 앱 배포 체크리스트 (앱스토어 & 테스트플라이트)

## 📱 1. app.json 설정 확인

### ✅ 기본 정보
- [x] **앱 이름**: "Onview" ✓
- [x] **Slug**: "ai-docent" ✓
- [ ] **버전 번호**: 현재 `1.0.0` → **배포 시 버전 업데이트 필요**
- [ ] **빌드 번호**: iOS는 `buildNumber`, Android는 `versionCode` 확인 필요

### ⚠️ 중요: 버전 관리
```json
"version": "1.0.0"  // 현재 버전 - 배포 전 업데이트 필요
```

### iOS 설정
- [x] **Bundle Identifier**: `com.ai-docent.app` ✓
- [x] **Tablet 지원**: `supportsTablet: true` ✓
- [ ] **App Store Connect에서 Bundle ID 등록 확인**
- [ ] **Apple Developer 계정 및 인증서 설정 확인**

### Android 설정
- [x] **Package Name**: `com.ai-docent.app` ✓
- [x] **Adaptive Icon 설정**: ✓
- [ ] **Google Play Console에서 패키지명 등록 확인**
- [ ] **서명 키 (Keystore) 생성 및 백업**

---

## 🔐 2. 권한 설정 (Info.plist / AndroidManifest)

### iOS 권한 (app.json에 추가 필요)
현재 `app.json`에 권한 설명이 없습니다. 다음을 추가해야 합니다:

```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "작품을 검색하기 위해 카메라 접근 권한이 필요합니다",
    "NSPhotoLibraryUsageDescription": "프로필 사진을 설정하기 위해 사진 라이브러리 접근 권한이 필요합니다",
    "NSPhotoLibraryAddUsageDescription": "사진을 저장하기 위해 사진 라이브러리 접근 권한이 필요합니다",
    "NSUserNotificationsUsageDescription": "알림을 받기 위해 알림 권한이 필요합니다"
  }
}
```

### Android 권한 (app.json에 추가 필요)
```json
"android": {
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "RECEIVE_BOOT_COMPLETED",
    "VIBRATE"
  ]
}
```

### ⚠️ 보안 설정 검토
현재 `NSAllowsArbitraryLoads: true` 설정이 있습니다. **프로덕션에서는 보안상 위험할 수 있으므로 검토 필요**:
- [ ] 특정 도메인만 허용하도록 변경 고려
- [ ] HTTPS만 허용하도록 설정 검토

---

## 🌐 3. 환경 변수 설정

### eas.json 확인
- [ ] **Production 환경 변수 확인**:
  ```json
  "EXPO_PUBLIC_API_BASE_URL": "https://api.example.com"
  ```
  → 실제 프로덕션 API URL로 변경 필요

### .env 파일
- [x] Supabase 설정: ✓
- [ ] **프로덕션 API URL 확인**: 현재 `http://10.1.100.191:8000` (로컬 주소)
  → 프로덕션 서버 URL로 변경 필요

---

## 📦 4. EAS Build 설정

### eas.json 확인 사항
- [x] **Project ID**: `a625307e-cd1b-4a85-8655-a99fa1bd9ab7` ✓
- [x] **Production 빌드 설정**: ✓
- [ ] **iOS 배포 타입**: `distribution: "store"` ✓
- [ ] **Android 배포 타입**: 확인 필요 (기본값은 "store")

### 빌드 전 확인
- [ ] `eas build:configure` 실행 확인
- [ ] `eas credentials` 확인 (iOS 인증서, Android 키스토어)
- [ ] EAS 계정 로그인 확인: `eas login`

---

## 🎨 5. 아이콘 및 스플래시 스크린

### 아이콘
- [x] **iOS 아이콘**: `./assets/images/icon.png` ✓
- [x] **Android Adaptive Icon**: 설정됨 ✓
  - [ ] 아이콘 크기 확인 (1024x1024 권장)
  - [ ] 모든 해상도에서 잘 보이는지 확인

### 스플래시 스크린
- [x] **스플래시 이미지**: `./assets/images/splash-icon.png` ✓
- [x] **다크모드 배경색**: 설정됨 ✓

---

## 🔔 6. 알림 설정 (expo-notifications)

### iOS
- [ ] **APNs 인증서 설정**: EAS에서 자동 처리되지만 확인 필요
- [ ] **Push Notification Capability**: Xcode에서 활성화 확인

### Android
- [ ] **FCM (Firebase Cloud Messaging) 설정**: 
  - Google Play Console에서 Firebase 프로젝트 연결
  - `google-services.json` 파일 필요 (EAS가 자동 처리)

---

## 📱 7. 플러그인 설정

### 현재 플러그인
- [x] `expo-router` ✓
- [x] `expo-splash-screen` ✓
- [ ] **카메라 플러그인**: `expo-camera` (app.json에 명시 필요)
- [ ] **이미지 피커 플러그인**: `expo-image-picker` (app.json에 명시 필요)
- [ ] **알림 플러그인**: `expo-notifications` (app.json에 명시 필요)

### app.json에 추가 권장:
```json
"plugins": [
  "expo-router",
  [
    "expo-splash-screen",
    { /* ... */ }
  ],
  [
    "expo-camera",
    {
      "cameraPermission": "작품을 검색하기 위해 카메라 접근 권한이 필요합니다"
    }
  ],
  [
    "expo-image-picker",
    {
      "photosPermission": "프로필 사진을 설정하기 위해 사진 라이브러리 접근 권한이 필요합니다"
    }
  ],
  [
    "expo-notifications",
    {
      "icon": "./assets/images/icon.png",
      "color": "#ffffff",
      "sounds": []
    }
  ]
]
```

---

## 🧪 8. 테스트플라이트 배포 전 확인

### 필수 사항
- [ ] **테스트 계정 준비**: 테스터 이메일 목록
- [ ] **테스트 가이드 작성**: 주요 기능 테스트 방법
- [ ] **최소 iOS 버전 확인**: 현재 설정 확인 필요
- [ ] **최소 Android 버전 확인**: 현재 설정 확인 필요

### 빌드 명령어
```bash
# iOS 테스트플라이트용 빌드
eas build --platform ios --profile preview

# Android 내부 테스트용 빌드
eas build --platform android --profile preview
```

---

## 🏪 9. 앱스토어 제출 전 확인

### iOS (App Store Connect)
- [ ] **앱 정보 작성**:
  - 앱 설명
  - 키워드
  - 카테고리
  - 스크린샷 (다양한 기기 크기)
  - 앱 아이콘
  - 개인정보 처리방침 URL
- [ ] **가격 및 판매 지역 설정**
- [ ] **연령 등급 설정**
- [ ] **개인정보 수집 및 사용 공지** (카메라, 사진, 알림 사용)

### Android (Google Play Console)
- [ ] **앱 정보 작성**:
  - 앱 설명 (짧은 설명, 긴 설명)
  - 그래픽 자산 (아이콘, 스크린샷, 피처 그래픽)
  - 카테고리
  - 콘텐츠 등급
  - 개인정보 처리방침 URL
- [ ] **데이터 안전성 섹션 작성** (권한 사용 이유 설명)
- [ ] **타겟 대상 및 콘텐츠 설정**

---

## 🔍 10. 코드 품질 확인

### 필수 확인 사항
- [ ] **콘솔 로그 제거**: `console.log`, `console.debug` 제거 또는 조건부 처리
- [ ] **에러 핸들링**: 모든 API 호출에 에러 처리 확인
- [ ] **로딩 상태**: 사용자 피드백 확인
- [ ] **오프라인 처리**: 네트워크 오류 처리 확인

### 보안
- [ ] **API 키 노출 확인**: `.env` 파일이 빌드에 포함되지 않았는지 확인
- [ ] **하드코딩된 비밀번호/토큰 제거**
- [ ] **Supabase RLS (Row Level Security) 정책 확인**

---

## 📋 11. 빌드 및 제출 프로세스

### 1단계: 프로덕션 빌드
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 2단계: 제출
```bash
# iOS (App Store)
eas submit --platform ios --profile production

# Android (Google Play)
eas submit --platform android --profile production
```

### 3단계: 모니터링
- [ ] 빌드 상태 확인: `eas build:list`
- [ ] 제출 상태 확인: App Store Connect / Google Play Console

---

## ⚠️ 12. 즉시 수정 필요 사항

### 🔴 높은 우선순위
1. **app.json에 권한 설명 추가** (iOS Info.plist)
2. **프로덕션 API URL 설정** (eas.json의 production 환경 변수)
3. **버전 번호 업데이트** (배포 전)
4. **플러그인 설정 추가** (expo-camera, expo-image-picker, expo-notifications)

### 🟡 중간 우선순위
1. **NSAppTransportSecurity 보안 설정 검토**
2. **Android 권한 명시**
3. **콘솔 로그 정리**

### 🟢 낮은 우선순위
1. **앱스토어 스크린샷 준비**
2. **앱 설명 작성**
3. **개인정보 처리방침 작성**

---

## 📝 체크리스트 요약

### 배포 전 필수 작업
- [ ] app.json 권한 설명 추가
- [ ] 프로덕션 API URL 설정
- [ ] 버전 번호 업데이트
- [ ] EAS 빌드 테스트
- [ ] 테스트플라이트 빌드 및 배포
- [ ] 앱스토어 제출 정보 작성
- [ ] 최종 프로덕션 빌드 및 제출

---

## 🔗 유용한 링크

- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 문서](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [Expo 배포 가이드](https://docs.expo.dev/distribution/introduction/)
