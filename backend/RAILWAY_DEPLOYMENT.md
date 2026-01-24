# Railway 배포 가이드

## 📋 사전 준비

### 1. Railway 계정 생성
1. [Railway](https://railway.app) 접속
2. GitHub 계정으로 로그인 (권장)

### 2. Railway CLI 설치 (선택사항)
```bash
# macOS
brew install railway

# 또는 npm으로 설치
npm i -g @railway/cli

# 설치 확인
railway --version
```

## 🚀 배포 방법

### 방법 1: Railway 웹 대시보드 사용 (권장)

#### 1단계: 새 프로젝트 생성
1. Railway 대시보드 접속: https://railway.app/dashboard
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. GitHub 저장소 선택
5. 저장소의 `backend` 폴더를 선택하거나 루트에서 Dockerfile 경로 지정

#### 2단계: Dockerfile 설정
- Railway가 자동으로 `Dockerfile`을 감지합니다
- 루트 디렉토리가 아닌 경우, Settings → Build → Dockerfile Path 설정

#### 3단계: 환경 변수 설정
Settings → Variables에서 다음 환경 변수 추가:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
TAVILY_API_KEY=your-tavily-api-key (선택사항)
CLIP_MODEL=ViT-B/32 (선택사항, 기본값)
PORT=8000 (자동 설정됨)
```

#### 4단계: 메모리 설정
1. Settings → Resources
2. Memory: **1GB (1024MB)** 이상 설정 (모델 로딩을 위해)
3. CPU: Shared CPU 또는 Dedicated CPU 선택

#### 5단계: 포트 설정
1. Settings → Networking
2. Port: `8000` 확인
3. Public Domain 생성 (자동으로 할당됨)

#### 6단계: 배포 확인
- Deployments 탭에서 배포 상태 확인
- Logs 탭에서 로그 확인
- 생성된 도메인으로 접속 테스트

### 방법 2: Railway CLI 사용

#### 1단계: 로그인
```bash
railway login
```

#### 2단계: 프로젝트 초기화
```bash
cd backend
railway init
```

#### 3단계: 환경 변수 설정
```bash
# 개별 설정
railway variables set SUPABASE_URL="your-url"
railway variables set SUPABASE_ANON_KEY="your-key"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-key"
railway variables set OPENAI_API_KEY="your-key"

# 또는 .env 파일에서 일괄 설정
railway variables
```

#### 4단계: 배포
```bash
railway up
```

#### 5단계: 로그 확인
```bash
railway logs
```

## ⚙️ Railway 설정 파일 (선택사항)

프로젝트 루트에 `railway.json` 또는 `railway.toml` 파일을 생성하여 설정할 수 있습니다:

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### railway.toml (더 권장)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## 🔧 Dockerfile 확인

Railway는 Dockerfile을 사용하므로 현재 Dockerfile이 그대로 작동합니다:

```dockerfile
FROM python:3.11-slim
WORKDIR /backend
# ... (기존 Dockerfile 내용)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}", "--workers", "1"]
```

**중요**: Railway는 `PORT` 환경 변수를 자동으로 설정하므로 Dockerfile의 CMD가 이를 사용합니다.

## 🌐 도메인 설정

### 기본 도메인
Railway는 배포 시 자동으로 도메인을 할당합니다:
```
https://your-app-name.up.railway.app
```

### 커스텀 도메인
1. Settings → Networking
2. "Custom Domain" 클릭
3. 도메인 입력
4. DNS 설정 안내에 따라 CNAME 레코드 추가

## 📊 모니터링 및 로그

### 웹 대시보드
- **Metrics**: CPU, 메모리, 네트워크 사용량
- **Logs**: 실시간 로그 확인
- **Deployments**: 배포 이력

### CLI
```bash
# 실시간 로그
railway logs --follow

# 특정 기간 로그
railway logs --since 1h

# 메트릭 확인
railway status
```

## 🔍 문제 해결

### 메모리 부족
1. Settings → Resources
2. Memory를 1GB 이상으로 증가
3. 재배포

### 배포 실패
1. Logs 탭에서 에러 확인
2. 환경 변수 확인
3. Dockerfile 빌드 테스트:
   ```bash
   docker build -t test .
   ```

### 포트 오류
- Railway는 `PORT` 환경 변수를 자동 설정
- Dockerfile의 CMD가 `${PORT}`를 사용하는지 확인

### 환경 변수 확인
```bash
# CLI로 확인
railway variables

# 또는 웹 대시보드에서 확인
# Settings → Variables
```

## 💰 비용

### Railway 무료 플랜
- $5 크레딧/월 (자동 충전)
- 사용한 만큼만 과금
- 약 500시간 무료 실행 가능

### 예상 비용 (1GB 메모리)
- 약 $5-10/월 (사용량에 따라)

## 📝 배포 후 확인 사항

1. ✅ 헬스체크: `https://your-app.up.railway.app/health`
2. ✅ 환경 변수 확인: Settings → Variables
3. ✅ 로그 확인: Logs 탭
4. ✅ 프론트엔드 API URL 업데이트:
   ```env
   EXPO_PUBLIC_API_BASE=https://your-app.up.railway.app
   ```

## 🔄 자동 배포 설정

### GitHub 연동 (권장)
1. Settings → Source
2. GitHub 저장소 연결
3. Branch 선택 (예: `main`)
4. 자동 배포 활성화

이제 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

## 🚀 빠른 시작 체크리스트

- [ ] Railway 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 생성
- [ ] 환경 변수 설정 (5개)
- [ ] 메모리 1GB 이상 설정
- [ ] 배포 실행
- [ ] 헬스체크 확인
- [ ] 프론트엔드 API URL 업데이트

## 🔗 참고 링크

- [Railway 공식 문서](https://docs.railway.app/)
- [Railway 가격](https://railway.app/pricing)
- [Railway Discord](https://discord.gg/railway)

## 💡 Railway vs Fly.io vs Render 비교

| 기능 | Railway | Fly.io | Render |
|------|---------|--------|--------|
| 무료 플랜 | $5/월 크레딧 | 3개 VM (256MB) | 512MB 메모리 |
| 메모리 설정 | 유연함 | 설정 가능 | 제한적 |
| 자동 배포 | GitHub 연동 | 수동/CI | GitHub 연동 |
| 설정 난이도 | 쉬움 | 중간 | 쉬움 |
| 가격 | 사용량 기반 | VM 기반 | 플랜 기반 |

**Railway 장점:**
- 설정이 간단함
- GitHub 연동이 쉬움
- 사용량 기반 과금 (무료 크레딧 제공)
- 실시간 로그 및 메트릭
