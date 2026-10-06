import 'dotenv/config';
import {Client,Events,GatewayIntentBits,MessageFlags} from 'discord.js';
import {createGroupBridge} from '../server/discord/groupBridge.js';
import {groupMessage,conditionModal} from '../server/discord/presentation.js';

if(!process.env.DISCORD_BOT_TOKEN||!process.env.DISCORD_GUILD_ID){console.error('DISCORD_BOT_TOKEN과 DISCORD_GUILD_ID를 .env에 설정해 주세요. 토큰을 채팅이나 Git에 올리지 마세요.');process.exit(1);}
const bridge=createGroupBridge({base:process.env.DISCORD_API_BASE||'http://127.0.0.1:3001'});
const client=new Client({intents:[GatewayIntentBits.Guilds]});
client.once(Events.ClientReady,()=>console.log('월계밥상 디스코드 봇 연결 완료'));
client.on(Events.Error,()=>console.error('디스코드 연결 오류. 네트워크와 봇 설정을 확인해 주세요.'));
client.on(Events.InteractionCreate,async i=>{
  if(!i.isChatInputCommand()&&!i.isButton()&&!i.isStringSelectMenu()&&!i.isModalSubmit())return;
  if(i.isChatInputCommand()?i.commandName!=='밥상':!i.customId.startsWith('wg:'))return;
  try{
    if(i.guildId!==process.env.DISCORD_GUILD_ID){await i.reply({content:'설정된 팀 서버에서 사용해 주세요.',flags:MessageFlags.Ephemeral});return;}
    const slash=i.isChatInputCommand();
    const [,action,rawCode,revision]=(slash?[]:i.customId.split(':'));
    const op=slash?({'만들기':'create','참여':'join','현황':'status','조건':'condition','추천':'recommend'}[i.options.getSubcommand()]):action;
    const code=(slash?i.options.getString('코드'):rawCode)?.trim().toUpperCase();
    if(op!=='create'&&!/^[A-F0-9]{12}$/.test(code||''))throw new Error('초대 코드를 확인해 주세요.');
    if(op==='condition'&&!i.isModalSubmit()){await i.showModal(conditionModal(code));return;}
    // Acknowledge immediately; AI can take longer than Discord's response deadline.
    await i.deferReply({flags:op==='create'?undefined:MessageFlags.Ephemeral});
    const guild=i.guildId,user=i.user.id,nickname=(i.member?.displayName||i.member?.nick||i.user.globalName||i.user.username).slice(0,30);
    let group;
    if(op==='create')group=await bridge.create(guild,user,i.options.getString('이름',true),nickname);
    else if(op==='join')group=await bridge.join(guild,user,code,nickname);
    else if(op==='condition')group=await bridge.condition(guild,user,code,i.fields.getTextInputValue('condition'));
    else if(op==='recommend')group=await bridge.recommend(guild,user,code);
    else if(op==='vote')group=await bridge.vote(guild,user,code,i.values,Number(revision));
    else group=await bridge.get(guild,user,code);
    await i.editReply(groupMessage(group,process.env.PUBLIC_WEB_URL));
  }catch(e){
    const known=e.message&&!/fetch|connect|token|https?:|socket/i.test(e.message);
    const payload={content:known?e.message.slice(0,350):'연결을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',embeds:[],components:[],allowedMentions:{parse:[]}};
    try{if(i.deferred||i.replied)await i.editReply(payload);else await i.reply({...payload,flags:MessageFlags.Ephemeral});}catch{console.error('디스코드 응답 전송 실패 (토큰·개인 입력은 기록하지 않음)');}
  }
});
try{await client.login(process.env.DISCORD_BOT_TOKEN);}catch{console.error('봇 로그인 실패. 토큰·네트워크·Developer Portal 설정을 확인해 주세요.');process.exitCode=1;client.destroy();}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{client.destroy();process.exit(0);});
