# 월계밥상 — 지역 식사 추천과 사용자 기여 플랫폼

기존 integration/demo-v2의 React/Express 구현과 이력을 main에 반영했습니다. 새 방향은 그룹별 조건 추천·투표와 사용자 기여형 메뉴·가격 정보를 연결하는 서비스입니다. 서비스명은 가칭입니다.

## 최신 기획과 중간발표 자료

- [서비스 기획과 API 검토안](docs/product-plan.html): 파일을 내려받아 브라우저에서 엽니다.
- 중간발표 데모와 보고서는 [feat/midterm-community-demo 브랜치](https://github.com/2026-KW-HACKATHON/25_Wolgye-Defense-Squad/tree/feat/midterm-community-demo)에 있습니다.
- 해당 브랜치의 `public/midterm-demo.html`은 단독 실행 가능하며 API 키가 필요 없습니다.
- LLM은 NVIDIA NIM 사용 예정입니다. DB·추가 API·모델 선택은 검토안이며 확정 후 실제 연동합니다.

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

main은 기존 구현과 최신 기획을 보관합니다. integration/demo-v2는 원본 통합본으로 보존하고, 새 개발은 기능 브랜치에서 진행합니다.
사용자 요청으로 이전 chore/demo-foundation·feat/local-gourmet-agent-v2 브랜치는 정리합니다. 삭제 전 이력은 로컬 `.tools/branches-before-cleanup.bundle`에 보관했습니다.
