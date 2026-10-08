# 디스코드 봇 연결

웹 모임 서버와 같은 모임을 쓰는 추가 입구입니다. Discord Gateway 연결을 사용하므로 명령어·버튼 동작에는 웹 공개 주소나 임시 터널이 필요하지 않습니다. 웹 서버와 봇 프로세스는 켜두어야 합니다.

## 사용 준비

1. https://discord.com/developers/applications 에서 New Application으로 앱 생성.
2. General Information의 Application ID 복사. Bot에서 토큰 발급. **토큰은 이 프로젝트의 `.env`에만 입력하고 채팅·GitHub에 올리지 않습니다.**
3. 디스코드 사용자 설정 → 고급 → 개발자 모드 활성화. 사용할 팀 서버를 우클릭해 서버 ID 복사.
4. Developer Portal의 OAuth2 URL Generator에서 `bot`, `applications.commands` 선택. 권한은 View Channels, Send Messages, Embed Links만 선택해 팀 서버에 초대. Administrator 권한은 필요 없습니다.
5. `.env`에 아래 값을 입력. Message Content 등 Privileged Gateway Intents는 켜지 않습니다. Interactions Endpoint URL은 비워둡니다.

```dotenv
DISCORD_BOT_TOKEN=발급한_봇_토큰
DISCORD_APPLICATION_ID=앱_ID
DISCORD_GUILD_ID=팀_서버_ID
DISCORD_API_BASE=http://127.0.0.1:3001
PUBLIC_WEB_URL=
```

`PUBLIC_WEB_URL`은 선택입니다. HTTPS 공유 주소를 넣으면 ‘웹에서 열기’ 버튼이 추가되며 같은 모임 코드가 입력된 웹 화면으로 연결됩니다. 임시 주소가 바뀌면 수정 후 봇을 재시작하세요. 비워두어도 디스코드 기능은 동작합니다.

## 실행

Node.js 22.12 이상에서 프로젝트 폴더를 열고:

```powershell
npm.cmd run server
```

다른 터미널에서 최초 1회(또는 명령어 변경 시):

```powershell
npm.cmd run discord:register
npm.cmd run discord:bot
```

Node가 PATH에 없으면 각 터미널에서 먼저:

```powershell
$env:PATH="$PWD\.tools\node-v22.23.3-win-x64;$env:PATH"
```

## 팀원이 사용하는 흐름

명령어는 두 개뿐이에요. 나머지는 채널에 올라간 **모임 카드 하나**의 버튼으로 진행하고, 누가 누르든 그 카드가 그 자리에서 최신 상태로 바뀌어요.

1. `/밥상 만들기 이름:점심 모임` → 채널에 모임 카드가 올라와요. (웹에서 만든 모임은 `/밥상 참여 코드:12자리코드`로 카드를 불러와요.)
2. 각자 **조건 입력하기**를 눌러 원하는 조건을 적어요. 처음 누르면 자동으로 모임에 참여돼요.
3. 모두 입력하면 모임장이 **후보 추천**을 눌러요.
4. 각자 후보 선택 칸에서 갈 수 있는 곳을 모두 고르고 **투표 완료**를 눌러요. 모두 완료하기 전에는 표 수가 보이지 않아요.
5. 모두 완료하면 표 수가 공개되고, 모임장이 **다수결로 확정**(과반수일 때) / **재투표** / **랜덤 룰렛** / **AI에게 맡기기** 중 하나로 정해요.
6. 정해지면 채널에 "🎉 오늘은 ○○!" 알림과 카카오맵 길 찾기 버튼이 올라와요.

- 나에게만 필요한 안내(“투표 완료를 눌러야 반영돼요”, “모임장만 후보를 추천할 수 있어요” 등)는 누른 사람에게만 짧게 보여요.
- 조건·투표·결정은 웹과 공유돼요. 웹 계정과 디스코드는 아직 연결되지 않아 같은 사람이라도 따로 참가자로 취급돼요.

## 구현과 한계

- 생성 카드만 채널에 공개하고 이후 명령 결과는 기본적으로 본인에게만 표시. 메시지에서 원문 조건·참가 토큰은 노출하지 않지만 그룹 참가자는 웹 API에서 조건을 볼 수 있습니다.
- 동일 Discord 사용자/서버/코드의 중복 참여 방지, 작성자별 권한, 모임장 추천, 이전 후보 투표 거절, 최대 12명, 기존 AI 제한 재사용.
- 봇은 로컬 웹 API만 호출하며 groups.json에 직접 쓰지 않습니다. 참가 토큰은 공용 DB(`wolgye.discord_memberships`)에 보관해요. `DATA_STORE=file`이면 Git 제외 `.local-data/discord-memberships.json`에 보관해요.
- 자동 테스트는 실제 Express 모임 서버와 가짜 추천으로 검사. Discord 계정·토큰을 통한 실제 서버 시연은 발급 후 확인해야 합니다. 봇 구현과 실제 운영 연결 완료를 구분합니다.

공식 문서: [Discord Gateway](https://docs.discord.com/developers/events/gateway), [Application commands](https://docs.discord.com/developers/interactions/application-commands), [discord.js](https://discord.js.org/docs/packages/discord.js/main).

## Vercel 배포 방향
웹 프런트는 Vercel에 배포할 수 있지만 현재 Express 파일 저장과 상시 Gateway 봇은 별도 실행 서버가 필요합니다. 프런트만 배포하면 API가 자동 연결되지 않습니다. 고정 백엔드 주소로 `/api` 프록시와 공용 DB/Storage 전환을 구성한 뒤 `PUBLIC_WEB_URL`을 Vercel HTTPS 주소로 변경합니다. 현재는 Vercel에 배포한 상태가 아닙니다.
