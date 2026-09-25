# 개발 진행 기록

## 2026-09-25 기획 정리

- 사용자 요청: 그룹 조건 추천·투표와 사용자 기여형 메뉴 정보를 연결한 중간발표 데모.
- main에 integration/demo-v2 기존 이력을 fast-forward로 반영.
- 보존할 브랜치: main, integration/demo-v2. 기존 두 기능 브랜치는 로컬 git bundle 백업 후 삭제.
- 팀 공유 문서: docs/product-plan.html. System Design 템플릿을 간결한 HTML로 변환.
- 서비스명: 월계밥상(가칭). 팀원 이름과 역할은 사용자가 보고서에 직접 입력.
- NVIDIA NIM은 사용자 지정. 나머지 API·DB는 검토용 제안이며 신규 실서비스 연동은 보류.
- 공식 행사: 9/28 중간발표, 10/8~9 본선, 10/11~13 전시. 출처 https://www.kw-hackathon.co.kr/ (2026-09-25 확인).
- 노션 대상 페이지 사용자 확인 완료: https://app.notion.com/p/3e6b874f2b978070b654e06106f75769

## 중간발표 데모 구현 및 검증

- 브랜치: feat/midterm-community-demo. main 기획 커밋 092411d에서 분기.
- public/midterm-demo.html: 서버·API 없이 열리는 독립 데모. React 기본 화면에서도 표시하며 기존 앱은 ?legacy=1로 접근.
- docs/midterm-report.html: 사용자 제공 보고서 양식의 7개 항목, 항목별 복사·전체 복사·인쇄. 구성원은 사용자 직접 작성.
- docs/demo-guide.md: 2분 시연 순서 및 실제 구현/시뮬레이션 구분.
- 브라우저 검증 통과: 모임 생성, 초대 미리보기, 조건 필터, 복수 투표, 중복 저장 방지, 결과, 메뉴 가격 수정, 재추천 제외, 새로고침 유지, 후보 없음, 가게 확인 대기, 모바일 폭, 보고서 복사.
- 시각 검토: 데스크톱·390px 모바일, 기획서·보고서 렌더링 확인. 모바일 초기화 버튼 숨김 문제 수정.
- npm test 통과: 기존 서버의 health·입력 검증·검색·대화·공유 준비 회귀 검사.
- npm run build 통과. 샌드박스에서 Vite 상위 폴더 읽기가 제한되어 동일 빌드를 승인된 실행 환경에서 수행.
- .tools/branches-before-cleanup.bundle에 삭제 전 브랜치 이력 보관. main 미포함 foundation 커밋도 복구 가능.
- 실서비스 API, 공동 접속, OAuth, 사진 OCR·업로드는 이번 작업 범위에서 미연동.
