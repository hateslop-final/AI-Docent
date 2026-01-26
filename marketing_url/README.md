# CURAT 마케팅 페이지

CURAT 앱의 주요 기능을 소개하는 정적 마케팅 웹사이트입니다.

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 정적 사이트 빌드

```bash
npm run build
```

빌드된 파일은 `out/` 폴더에 생성됩니다.

## 📦 배포

### Vercel 배포

```bash
npm install -g vercel
vercel
```

### Netlify 배포

```bash
npm run build
netlify deploy --prod --dir=out
```

### GitHub Pages 배포

```bash
npm run build
# out 폴더의 내용을 gh-pages 브랜치에 푸시
```

## 🎨 주요 섹션

- **Hero**: 앱 소개 및 주요 메시지
- **Features**: 6가지 주요 기능 소개
- **How It Works**: 4단계 사용 방법
- **Download**: 앱 다운로드 링크
- **Footer**: 연락처 및 링크

## 🛠️ 기술 스택

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
