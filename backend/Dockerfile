FROM python:3.11-slim

WORKDIR /backend

# 시스템 라이브러리 (numpy, torch 대비)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# pip 업그레이드
RUN pip install --upgrade pip

# requirements.txt를 먼저 복사하여 캐시 활용
COPY requirements.txt .

# PyTorch CPU 버전 먼저 설치 (더 작고 빠름)
RUN pip install --no-cache-dir torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cpu

# 나머지 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY app ./app

# 포트 설정 (Render는 PORT 환경 변수를 자동으로 설정)
ENV PORT=8000
EXPOSE 8000

# 프로덕션 모드 (--reload 제거, 워커 추가)
# ENTRYPOINT 사용으로 JSON 형식 경고 방지 및 환경 변수 처리
ENTRYPOINT ["sh", "-c"]
CMD ["uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]