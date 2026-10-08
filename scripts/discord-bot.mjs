import 'dotenv/config';
import {Client,Events,GatewayIntentBits,MessageFlags} from 'discord.js';
import {createGroupBridge} from '../server/discord/groupBridge.js';
import {groupMessage,conditionModal,decisionAnnouncement} from '../server/discord/presentation.js';

if(!process.env.DISCORD_BOT_TOKEN||!process.env.DISCORD_GUILD_ID){console.error('DISCORD_BOT_TOKEN과 DISCORD_GUILD_ID를 .env에 설정해 주세요. 토큰을 채팅이나 Git에 올리지 마세요.');process.exit(1);}
const bridge=createGroupBridge({base:process.env.DISCORD_API_BASE||'http://127.0.0.1:3001'});
const client=new Client({intents:[GatewayIntentBits.Guilds]});
// 조건 창을 열어둔 사람 표시: 모임 코드별 {디스코드 사용자: {이름, 참가자 id, 시각}}. 3분이 지나면 지운다.
const typing=new Map(),lastGroup=new Map(),lastMessage=new Map();
const TYPING_MS=180000;
const typingList=code=>[...(typing.get(code)||new Map()).values()].filter(t=>Date.now()-t.at<TYPING_MS);
const card=g=>{lastGroup.set(g.id,g);return groupMessage(g,process.env.PUBLIC_WEB_URL,typingList(g.id));};
async function refreshCard(code){const g=lastGroup.get(code),m=lastMessage.get(code);if(g&&m)try{await m.edit(card(g));}catch{}}
// 입력 창에서 체크박스 값 읽기 (라벨 안에 들어 있는 구성요소까지 찾는다)
function checkboxValue(i,id){const walk=list=>{for(const c of list||[]){if(c.customId===id||c.custom_id===id)return c.value===true;const r=walk(c.components||(c.component?[c.component]:[]));if(r!==undefined)return r;}};return walk(i.components)??false;}
// 누른 사람에게만 보이는 짧은 안내. 카드는 쌓이지 않는다.
const note=(i,content)=>i.followUp({content,flags:MessageFlags.Ephemeral,allowedMentions:{parse:[]}});

client.once(Events.ClientReady,()=>console.log('월계밥상 디스코드 봇 연결 완료'));
client.on(Events.Error,()=>console.error('디스코드 연결 오류. 네트워크와 봇 설정을 확인해 주세요.'));
client.on(Events.InteractionCreate,async i=>{
  if(!i.isChatInputCommand()&&!i.isButton()&&!i.isStringSelectMenu()&&!i.isModalSubmit())return;
  if(i.isChatInputCommand()?i.commandName!=='밥상':!i.customId.startsWith('wg:'))return;
  try{
    if(i.guildId!==process.env.DISCORD_GUILD_ID){await i.reply({content:'설정된 팀 서버에서 사용해 주세요.',flags:MessageFlags.Ephemeral});return;}
    const guild=i.guildId,user=i.user.id,nickname=(i.member?.displayName||i.member?.nick||i.user.globalName||i.user.username).slice(0,30);

    // 명령어: 채널에 모임 카드를 하나 올린다.
    if(i.isChatInputCommand()){
      await i.deferReply();
      const group=i.options.getSubcommand()==='만들기'
        ?await bridge.create(guild,user,i.options.getString('이름',true),nickname)
        :await bridge.join(guild,user,i.options.getString('코드',true).trim().toUpperCase(),nickname);
      await i.editReply(card(group));return;
    }

    const [,action,code,extra]=i.customId.split(':');
    if(!/^[A-F0-9]{12}$/.test(code||''))throw new Error('초대 코드를 확인해 주세요.');
    // 조건 입력: 창을 먼저 띄운다(창은 첫 응답이어야 한다).
    if(action==='condition'&&!i.isModalSubmit()){
      const known=lastGroup.get(code),memberId=await bridge.me(guild,user,code).catch(()=>null);
      const mine=known?.members.find(m=>m.id===memberId);
      await i.showModal(conditionModal(code,mine?.condition&&mine.condition!=='비밀 조건'?mine.condition:''));
      // 카드에 "✏️ 조건 입력 중…"을 바로 띄우고, 3분 뒤에는 자동으로 지운다.
      if(!typing.has(code))typing.set(code,new Map());
      typing.get(code).set(user,{name:nickname,memberId,at:Date.now()});lastMessage.set(code,i.message);
      await refreshCard(code);setTimeout(()=>refreshCard(code),TYPING_MS+1000);
      return;
    }

    // 버튼·선택·조건 창: 새 카드를 보내지 않고, 이 카드를 그 자리에서 고친다.
    await i.deferUpdate();
    let group,tip='';
    if(action==='condition'){
      await bridge.join(guild,user,code,nickname); // 처음이면 자동 참여
      typing.get(code)?.delete(user);
      const secret=checkboxValue(i,'private');
      group=await bridge.condition(guild,user,code,i.fields.getTextInputValue('condition'),secret);tip=secret?'조건을 비밀로 저장했어요. 카드에는 🔒로만 보여요.':'조건을 저장했어요.';
    }else if(action==='recommend'){tip='후보를 찾았어요.';group=await bridge.recommend(guild,user,code);}
    else if(action==='vote'){
      group=await bridge.vote(guild,user,code,i.values,Number(extra));
      const names=group.candidates.filter(p=>i.values.includes(p.id)).map(p=>p.name);
      tip=names.length?`고른 후보: ${names.join(', ')} · **투표 완료**를 눌러야 반영돼요.`:'선택을 모두 지웠어요.';
    }
    else if(action==='submit'){group=await bridge.submit(guild,user,code,Number(extra));tip='투표를 완료했어요. 선택을 바꾸면 다시 완료해 주세요.';}
    else if(action==='join'){group=await bridge.join(guild,user,code,nickname);tip='모임에 참여했어요. 조건 입력하기를 눌러 주세요.';} // 예전 카드의 참여 버튼
    else if(action==='revote')group=await bridge.revote(guild,user,code);
    else if(action==='finalize')group=await bridge.finalize(guild,user,code,extra);
    else group=await bridge.get(guild,user,code);
    if(i.message)lastMessage.set(group.id,i.message);
    await i.editReply(card(group));
    if(action==='finalize'&&group.decision)await i.followUp(decisionAnnouncement(group));
    else if(tip)await note(i,tip);
  }catch(e){
    const known=e.message&&!/fetch|connect|token|https?:|socket/i.test(e.message);
    const content=known?e.message.slice(0,350):'연결을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
    // 카드는 그대로 두고, 누른 사람에게만 이유를 알려준다.
    try{if(i.deferred||i.replied)await note(i,content);else await i.reply({content,flags:MessageFlags.Ephemeral});}catch{console.error('디스코드 응답 전송 실패 (토큰·개인 입력은 기록하지 않음)');}
  }
});
try{await client.login(process.env.DISCORD_BOT_TOKEN);}catch{console.error('봇 로그인 실패. 토큰·네트워크·Developer Portal 설정을 확인해 주세요.');process.exitCode=1;client.destroy();}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{client.destroy();process.exit(0);});
