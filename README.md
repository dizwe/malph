# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# malph.app ✨

일상에서 만나는 작은 아이디어를 뚝딱뚝딱 앱으로 만드는 개발자의 회사 페이지입니다.

## 🌟 프로젝트 소개

malph는 평범한 일상 속에서 발견한 "이런 게 있으면 좋겠다"는 작은 아이디어들을 실제로 사용할 수 있는 앱으로 만드는 두 명의 개발자(디자인/기획: malcolm, 개발: ralph)의 포트폴리오 사이트입니다.

### 특징

- 🎨 귀여운 일러스트 스타일 디자인
- 📱 반응형 웹 디자인 (모바일/데스크톱 최적화)
- 🔗 개인정보처리방침과 서비스약관 별도 페이지
- ⚡ 빠른 로딩과 부드러운 애니메이션
- 🚀 GitHub Pages 배포 준비 완료

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript
- **빌드 도구**: Vite
- **라우팅**: React Router DOM
- **스타일링**: CSS3 (CSS Modules)
- **배포**: GitHub Pages

## 🚀 시작하기

### 개발 환경 설정

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 브라우저에서 `http://localhost:5173` 접속

### 빌드 및 배포

1. 프로젝트 빌드
```bash
npm run build
```

2. GitHub Pages 배포
```bash
npm run deploy
```

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Header/         # 네비게이션 헤더
│   └── Footer/         # 푸터
├── pages/              # 페이지 컴포넌트
│   ├── Home/           # 메인 홈페이지
│   ├── PrivacyPolicy/  # 개인정보처리방침
│   └── TermsOfService/ # 서비스약관
└── App.tsx             # 메인 앱 컴포넌트
```

## 📄 페이지 구성

### 메인 페이지 (`/`)
- 히어로 섹션: 메인 소개 문구와 CTA 버튼
- 소개 섹션: malph에 대한 상세 설명
- 프로젝트 섹션: 최근 프로젝트 쇼케이스
- 연락처 섹션: 이메일 및 카카오톡 연결

### 개인정보처리방침 (`/privacy-policy`)
- 개인정보 수집 및 이용목적
- 수집하는 개인정보 항목
- 개인정보 처리 및 보유기간
- 제3자 제공 및 위탁 정보
- 정보주체의 권리 및 행사방법

### 서비스약관 (`/terms-of-service`)
- 서비스 이용 약관
- 회원가입 및 탈퇴 절차
- 회사와 회원의 권리 및 의무
- 손해배상 및 면책조항
- 분쟁해결 절차

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: `#667eea` → `#764ba2` (그라데이션)
- **Secondary**: `#ff6b6b` → `#ffa726` (그라데이션)
- **Background**: `#f8fafc`
- **Text**: `#2d3748`, `#4a5568`, `#718096`

### 타이포그래피
- **Primary Font**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Heading**: 700-800 font-weight
- **Body**: 400-500 font-weight

## 🌐 배포 설정

이 프로젝트는 GitHub Pages 배포를 위해 다음과 같이 설정되어 있습니다:

- `vite.config.ts`: base path `/malph/` 설정
- `package.json`: homepage 및 배포 스크립트 설정
- Router: basename `/malph` 설정

## 📝 라이선스

이 프로젝트는 개인 포트폴리오 목적으로 제작되었습니다.

## 📞 연락처

- 📧 Email: contact@malph.app

---

Made with ❤️ and lots of ☕ by malph

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
