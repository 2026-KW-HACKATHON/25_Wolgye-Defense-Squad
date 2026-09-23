# 광운대 로컬 미식 AI 에이전트 (Local Gourmet Agent)

> **광운대학교 캠퍼스 골목 상권 활성화 & 능동형 식당 추천 에이전트**  
> 대학생의 공강 시간, 예산, 인원, 메뉴 취향을 종합 분석하여 광운로 인근 숨은 로컬 소상공인 맛집을 추천하고 카카오톡 공유 승인까지 지원합니다.

---

## 🌟 주요 특징 (v2 기획 반영)

1. **유저플로우 v2 (인증 및 진입)**
   - 최초 앱 실행 시 온보딩 화면 제공
   - 카카오 간편 로그인 및 게스트 즉시 체험 지원
   - 카카오톡 메시지 전송 및 캘린더 일정 추가 권한 동의 절차 포함

2. **와이어프레임 v2 (AI 대화 홈 화면)**
   - 대화형 인터페이스: 자연어 대화 흐름 중심의 UI
   - 3개 맞춤 식당 추천 카드:
     - 음식 및 식당 사진, `[로컬 맛집]` 태그
     - 편도 도보 시간 및 1인 평균 가격
     - 총 소요 시간 (왕복 이동 + 식사) vs 학생 공강 시간 여유 지표
     - 블로그 핵심 인용구 및 원문 링크
     - `이 식당 선택할게요` 선택 액션 버튼
   - **코딩 에이전트식 승인 요청 (Agentic Approval Flow)**:
     - 식당 선택 시 AI가 카카오톡 공유 승인 메시지 제안
     - 카카오톡 공유 미리보기 및 문구 수정 오버레이 (`overlay:kakao-share`)
     - 캘린더 식사 일정 추가 연동

3. **NVIDIA NIM LLM 연동**
   - 모델: `meta/llama-3.2-11b-vision-instruct`
   - 자연어 질의 제약조건(예산, 인원, 취향, 공강시간) 실시간 파악 및 친절한 대화형 추천 생성

---

## 🔒 보안 및 API Key 분리

- 사용자의 NVIDIA NIM API Key는 클라이언트에 절대 노출되지 않도록 **루트 `.env` 파일에만 보관**하며, 백엔드 프록시 서버(`server`)에서만 안전하게 호출합니다.
- `.gitignore`에 `.env`, `.env.local` 등이 지정되어 있어 **Git 커밋 시 절대 유출되지 않습니다.**

---

## 🚀 빠른 시작 (Quick Start)

### 1. 환경 변수 설정
`.env.example`을 복사하여 `.env` 파일을 생성하고 NVIDIA API Key를 입력합니다:
```bash
cp .env.example .env
```
`.env` 내용 예시:
```env
PORT=3001
NVIDIA_API_KEY=your_nvidia_nim_api_key_here
NVIDIA_MODEL=meta/llama-3.2-11b-vision-instruct
VITE_API_URL=http://localhost:3001
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행 (프론트엔드 + 백엔드 동시 실행)
```bash
npm run dev
```
- 프론트엔드: `http://localhost:5173`
- 백엔드 API: `http://localhost:3001`

### 4. 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```
`http://localhost:3001`에 접속하면 빌드된 프론트엔드와 백엔드가 함께 서빙됩니다.

---

## 📁 프로젝트 구조

```
kwhack2/
├── .env.example               # 환경변수 템플릿 (Git 포함)
├── .env                       # 실제 비공개 API Key 설정 (Git 제외!)
├── .gitignore                 # Git 보안 무시 설정
├── package.json               # 프로젝트 의존성 및 스크립트
├── index.html                 # 앱 진입 HTML
├── vite.config.js             # Vite 설정 및 API 프록시
├── tailwind.config.js         # Tailwind CSS 스타일 설정
├── server/
│   ├── index.js               # Express 백엔드 API 서버
│   ├── data/
│   │   └── restaurants.json   # 광운대 인근 로컬/소상공인 식당 DB
│   └── services/
│       └── nimService.js      # NVIDIA NIM API 연동 및 추천 알고리즘
└── src/
    ├── main.jsx               # React 마운트 지점
    ├── App.jsx                # 메인 레이아웃 및 세션 관리
    ├── index.css              # Pretendard 폰트 및 Tailwind
    └── components/
        ├── OnboardingModal.jsx    # 유저플로우 v2 온보딩/권한 동의
        ├── ChatContainer.jsx      # 와이어프레임 v2 AI 대화 홈
        ├── RestaurantCard.jsx     # 와이어프레임 v2 식당 추천 카드
        └── KakaoShareOverlay.jsx  # 와이어프레임 v2 공유 승인 모달
```
