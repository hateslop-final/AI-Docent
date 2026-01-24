# Fly.io 배포 가이드

## 📋 사전 준비

### 1. Fly.io CLI 설치
```bash
# macOS
curl -L https://fly.io/install.sh | sh

# 또는 Homebrew
brew install flyctl

# 설치 확인
flyctl version
```

### 2. Fly.io 계정 로그인
```bash
flyctl auth login
```

## 🚀 배포 단계

### 1. Fly.io 앱 생성 (처음 한 번만)
```bash
cd backend
flyctl launch
```

이 명령어를 실행하면:
- `fly.toml` 파일이 이미 있으므로 기존 설정 사용
- 앱 이름 확인: `ai-docent-backend`
- 리전 선택 (가까운 지역 선택, 예: `nrt` - Tokyo, `iad` - Virginia)

### 2. 환경 변수 설정
```bash
# Supabase 설정
flyctl secrets set SUPABASE_URL="your-supabase-url"
flyctl secrets set SUPABASE_ANON_KEY="your-supabase-anon-key"
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OpenAI 설정
flyctl secrets set OPENAI_API_KEY="your-openai-api-key"

# Tavily API (선택사항)
flyctl secrets set TAVILY_API_KEY="your-tavily-api-key"

# CLIP 모델 (선택사항, 기본값: ViT-B/32)
flyctl secrets set CLIP_MODEL="ViT-B/32"
```

### 3. 메모리 설정 확인
`fly.toml`에 이미 1GB로 설정되어 있습니다:
```toml
[vm]
  memory_mb = 1024
```

필요시 변경:
```bash
flyctl scale vm shared-cpu-1x --memory 1024
```

### 4. 배포 실행
```bash
flyctl deploy
```

### 5. 배포 확인
```bash
# 앱 상태 확인
flyctl status

# 로그 확인
flyctl logs

# 헬스체크
flyctl open /health
```

## 🔧 유용한 명령어

### 앱 관리
```bash
# 앱 목록
flyctl apps list

# 앱 정보
flyctl info

# 앱 재시작
flyctl apps restart ai-docent-backend

# 앱 삭제
flyctl apps destroy ai-docent-backend
```

### 로그 및 모니터링
```bash
# 실시간 로그
flyctl logs

# 특정 기간 로그
flyctl logs --since 1h

# SSH 접속
flyctl ssh console
```

### 환경 변수 관리
```bash
# 환경 변수 확인
flyctl secrets list

# 환경 변수 설정
flyctl secrets set KEY="value"

# 환경 변수 삭제
flyctl secrets unset KEY
```

### 스케일링
```bash
# 메모리 변경
flyctl scale vm shared-cpu-1x --memory 2048

# 인스턴스 수 변경
flyctl scale count 2
```

## 🌐 도메인 설정

### 기본 도메인
배포 후 자동으로 할당되는 도메인:
```
https://ai-docent-backend.fly.dev
```

### 커스텀 도메인 (선택사항)
```bash
# 도메인 추가
flyctl certs add your-domain.com

# DNS 설정 안내 확인
flyctl certs show your-domain.com
```

## ⚙️ 설정 파일 설명

### fly.toml
- `app`: 앱 이름
- `internal_port`: 내부 포트 (8000)
- `memory_mb`: 메모리 크기 (1024MB = 1GB)
- `auto_stop_machines`: 유휴 시 자동 중지
- `auto_start_machines`: 요청 시 자동 시작

### Dockerfile
- Python 3.11 기반
- PyTorch CPU 버전
- 포트 8000 사용
- Fly.io의 PORT 환경 변수 자동 인식

## 🔍 문제 해결

### 메모리 부족
```bash
# 메모리 증가
flyctl scale vm shared-cpu-1x --memory 2048
```

### 배포 실패
```bash
# 로그 확인
flyctl logs

# 로컬에서 빌드 테스트
docker build -t test-image .
```

### 환경 변수 확인
```bash
# 모든 시크릿 확인
flyctl secrets list

# SSH로 접속하여 확인
flyctl ssh console
# Python에서 확인
python -c "import os; print(os.getenv('SUPABASE_URL'))"
```

## 📝 배포 후 확인 사항

1. ✅ 헬스체크: `https://ai-docent-backend.fly.dev/health`
2. ✅ 환경 변수 확인: `flyctl secrets list`
3. ✅ 로그 확인: `flyctl logs`
4. ✅ 프론트엔드 API URL 업데이트: `EXPO_PUBLIC_API_BASE_URL`

## 💰 비용

Fly.io 무료 플랜:
- 3개의 shared-cpu-1x VM (256MB 메모리)
- 월 160GB 네트워크 전송

현재 설정 (1GB 메모리):
- 약 $1.94/월 (shared-cpu-1x, 1GB)

## 🔗 참고 링크

- [Fly.io 공식 문서](https://fly.io/docs/)
- [Fly.io 가격](https://fly.io/docs/about/pricing/)
- [FastAPI 배포 가이드](https://fly.io/docs/languages-and-frameworks/python/)
