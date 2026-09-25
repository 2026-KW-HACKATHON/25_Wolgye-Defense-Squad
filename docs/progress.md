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

## 원격 반영 완료

- main: 790014d (통합 구현 + 기획 + 최신 작업 안내).
- feat/midterm-community-demo: 데모·보고서 구현과 main 안내 병합 완료, 원격 반영.
- integration/demo-v2: 5766f8d 그대로 보존.
- origin/chore/demo-foundation, origin/feat/local-gourmet-agent-v2 삭제 완료. 예상 커밋을 확인하는 lease와 atomic push로 동시 변경 방지.
- 최종 빌드 성공, public/midterm-demo.html과 dist/midterm-demo.html의 SHA-256 일치 확인.
- 노션에 단계별 진행 및 결과물 GitHub 링크 기록.

## 중간발표 자료 제작 (2026-09-25)

- docs/presentation/wolgye-midterm-v2.pptx: 수정 가능한 8장 발표자료. 문제, 그룹 조건, 추천·투표, 가격 수정 시연, 사용자 기여, 구현 범위, 본선 계획 구성. 발표자 노트 포함.
- docs/presentation/wolgye-midterm.pdf: 같은 내용의 제출용 PDF.
- docs/midterm-report.html: 제공된 양식의 7개 항목을 A4 1장 분량으로 축약. 주최 측 원본 양식에 복사하고 팀원 이름·역할을 입력해야 함.
- PPTX 패키지·도형 경계·폰트·네이티브 표 검사 및 재가져오기 통과. 네이티브 이미지 렌더러 오류로 PPTX 내용을 브라우저에서 렌더링해 PDF 생성. PowerPoint 자체 렌더링은 미검증.
- 발표자료 전체 화면 및 보고서 인쇄 화면 시각 검토. 보고서 PDF 1장 확인. 기존 앱 코드는 변경하지 않음.
- 사용자 요청에 따라 발표 PPT·PDF는 docs/presentation/에 로컬 보관하고 Git 추적에서 제외. 이전 업로드 커밋 이력은 유지하며 이후 발표자료는 업로드하지 않음.
