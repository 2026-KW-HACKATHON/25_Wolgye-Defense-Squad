import 'dotenv/config';
import {REST,Routes} from 'discord.js';
import {commands} from '../server/discord/presentation.js';
const {DISCORD_BOT_TOKEN,DISCORD_APPLICATION_ID,DISCORD_GUILD_ID}=process.env;
if(!DISCORD_BOT_TOKEN||!/^\d{16,22}$/.test(DISCORD_APPLICATION_ID||'')||!/^\d{16,22}$/.test(DISCORD_GUILD_ID||'')){console.error('.env에 봇 토큰·Application ID·팀 서버 ID를 입력해 주세요.');process.exit(1);}
try{
  // Upsert only our command. Never bulk-delete commands belonging to other features.
  const rest=new REST({version:'10'}).setToken(DISCORD_BOT_TOKEN);
  await rest.post(Routes.applicationGuildCommands(DISCORD_APPLICATION_ID,DISCORD_GUILD_ID),{body:commands[0]});
  console.log('팀 서버에 /밥상 명령어를 등록했습니다.');
}catch(error){
  // Never print the complete REST error: it can contain credentials/request data.
  const code=String(error.code||error.cause?.code||'UNKNOWN').replace(/[^A-Z0-9_]/gi,'').slice(0,40);
  console.error(`명령어 등록 실패 (HTTP ${Number(error.status)||'없음'}, 코드 ${code}).`);
  const hints={'50001':'봇이 해당 서버에 접근할 수 없어요. 서버 ID와 bot·applications.commands 초대를 확인해 주세요.','50013':'명령어 등록 권한이 부족해요. 서버 초대 설정을 확인해 주세요.','50035':'명령어 형식이 잘못됐어요. 명령어 정의를 확인해야 합니다.','10002':'Application ID에 해당하는 앱을 찾지 못했어요.','10004':'서버 ID에 해당하는 서버를 찾지 못했어요.'};
  console.error(Number(error.status)===401?'봇 토큰 인증에 실패했어요. Bot 메뉴에서 발급한 토큰인지 확인해 주세요.':hints[code]||'앱 ID·토큰의 소속 앱 또는 네트워크 연결을 확인해 주세요.');
  process.exitCode=1;
}
