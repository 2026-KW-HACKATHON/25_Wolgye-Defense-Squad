# 광운대 로컬 미식 에이전트 — 통합 검토본

팀원 React/Express 앱과 우리 브리핑·협업 문서를 합친 integration/demo-v2 브랜치입니다. main 병합 전 팀 검토가 필요합니다. 원본 브랜치와 팀원 커밋 이력은 보존했습니다.

## 실행

Node.js 22 환경에서 `npm ci`를 실행합니다.
.env.example을 .env로 복사한 후 KAKAO_REST_API_KEY와 NVIDIA_API_KEY를 설정하세요. 키는 서버에서만 사용하고 커밋하지 않습니다.
카카오 키가 없으면 실제 검색을 사용할 수 없습니다. NVIDIA 호출 실패 시 기본 소개 문구를 사용합니다.

- `npm run dev`: 웹 http://localhost:5173 / API http://localhost:3001
- `npm test`: 외부 API 모의 응답을 사용하는 서버 회귀 검증
- `npm run build` 다음 `npm start`: http://localhost:3001 에서 빌드된 앱 실행

React 앱이므로 index.html을 파일로 직접 열어 실행하지 않습니다.

## 구현 상태와 한계

- React 대화·카드 화면, Express API, 카카오 장소·블로그 검색 호출.
- 조건 분석은 정규식 기반. NVIDIA NIM은 소개·공유 확인 문구 생성에 사용.
- 가격은 업종별 추정, 이동 시간은 거리 기반 추정, 소상공인 여부는 일부 프랜차이즈 이름을 제외한 휴리스틱입니다.
- 예산·공강 시간은 점수에 반영할 뿐 초과 후보를 반드시 제외하지 않습니다.
- 카카오 로그인·권한 화면은 시뮬레이션입니다. 실제 OAuth가 아닙니다.
- 공유는 기기 공유창 또는 문구 복사. 일정은 Google Calendar 작성 화면 열기.
- 카카오 전용 공유 SDK, 공동 투표, RAG, 실제 메뉴 가격·도보 경로 검증은 미구현입니다.

## 구성

- src/: React 앱과 화면 컴포넌트
- server/: API와 카카오·NVIDIA 연동
- briefing.html + styles.css: 파일로 직접 열 수 있는 팀 브리핑
- team-briefing.html: 디자인을 포함한 단일 파일 공유본
- AGENTS.md: 프로젝트 안내
- .github/pull_request_template.md: 팀 검토 양식
- docs/integration-review.md: 통합 수정·검증·남은 작업
- ARCHITECTURE.md, LIMITATIONS.md: 팀원 원본 설명. 코드와 다른 주장·미검증 목표가 있어 통합 문서를 우선 참고하세요.

## 협업

통합 브랜치에서 검토 → PR로 main 병합 → 최신 main에서 기능별 브랜치 생성.
기존 브랜치는 팀 검토가 끝날 때까지 보존합니다.
