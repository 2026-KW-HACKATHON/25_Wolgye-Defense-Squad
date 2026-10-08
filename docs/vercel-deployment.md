# Vercel 배포: 화면과 API 함께 실행하기

기존 배포는 Vite 화면만 올려 `/api/community/places`가 404를 반환했습니다. 이제 `api/index.js`가 기존 Express API를 Vercel Function으로 실행하고, `vercel.json`이 `/api/*` 요청을 그 함수로 연결합니다. 로컬의 `npm run dev`와 `npm start` 흐름은 그대로입니다.

## Vercel 프로젝트 설정

1. 프로젝트의 Git 연결과 Build Command `npm run build`, Output Directory `dist`를 확인합니다.
2. **Settings → Environment Variables**에서 아래 값을 **Production**에 설정합니다. 기존 로컬 `.env`는 자동 업로드되지 않습니다. 비밀값을 Git이나 `VITE_` 변수에 넣지 마세요.

| 변수 | 값 |
| --- | --- |
| `DATA_STORE` | `postgres` |
| `DATABASE_URL` | Supabase의 PostgreSQL Session pooler 연결 주소 |
| `DATABASE_CA_FILE` | `certs/prod-ca-2021.crt` |
| `KAKAO_REST_API_KEY` | Kakao Developers REST API 키 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable 키 |
| `OPENROUTER_API_KEY` | OpenRouter API 키 (AI 기능용) |
| `AUTH_ADMIN_USER_IDS` | 관리자 Supabase 사용자 ID (관리자 기능용) |

AI 모델과 이미지 검색의 선택 변수는 `.env.example`을 참고하세요. `PORT`, `HOST`, `VITE_API_URL`, `DISCORD_BOT_TOKEN`은 Vercel 웹 API에 필요하지 않습니다. 환경변수를 저장한 다음 Production을 재배포해야 새 함수에 반영됩니다.

3. `https://운영주소/api/health`가 JSON을 반환하는지 확인합니다. 그다음 `/api/community/places`가 JSON의 `items` 배열을 반환하는지 확인합니다. 404면 함수/재작성 규칙이 배포되지 않은 상태이고, 503이면 Vercel Function 로그와 환경변수를 확인하세요. 카카오 또는 DB 연결 실패는 JSON 오류로 표시됩니다.
4. 공개 주소에서 찾기·소식·로그인·모임을 각각 테스트합니다. Supabase Authentication의 Site URL과 Redirect URLs에도 운영 주소를 등록해야 로그인 후 돌아올 수 있습니다.

이 함수는 HTTP API만 담당합니다. 계속 연결돼 있어야 하는 Discord 봇은 별도 상시 실행 서버가 필요합니다. 함수의 파일 시스템은 영속 저장소가 아니므로 `DATA_STORE=postgres`가 필수입니다.
