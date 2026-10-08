import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {getPool,transaction,useDatabase} from '../db/pool.js';

// 골목냥 키우기: 동네에 정보를 보태면 밥알을 받고, 밥알로 골목냥에게 밥을 주면 레벨이 오른다.
// 규칙을 바꾸려면 아래 숫자만 고치면 된다.
export const RULES={checkin:5,info:30,photoPost:20,post:10,dailyCap:100,feed:50};
export const LEVELS=[{level:1,name:'아기냥',xp:0},{level:2,name:'골목냥',xp:100},{level:3,name:'동네냥',xp:300},{level:4,name:'단골냥',xp:600},{level:5,name:'월계 대장냥',xp:1000}];
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
export const levelOf=xp=>[...LEVELS].reverse().find(l=>xp>=l.xp);
const fresh=()=>({bap:0,xp:0,daily:{date:today(),earned:0,keys:[]},ledger:[],usedCoupons:[]});

// 밥알 적립. key가 같으면 하루에 한 번만 준다(예: info:가게id). refKey는 나중에 회수할 때 쓴다.
export function applyEarn(row,{amount,reason,key,refKey}){
  row={...fresh(),...row};
  if(row.daily.date!==today())row.daily={date:today(),earned:0,keys:[]};
  if(key&&row.daily.keys.includes(key))return {row,earned:0};
  const earned=Math.max(0,Math.min(amount,RULES.dailyCap-row.daily.earned));
  if(!earned)return {row,earned:0};
  row.bap+=earned;row.daily.earned+=earned;if(key)row.daily.keys.push(key);
  row.ledger=[{at:new Date().toISOString(),amount:earned,reason,refKey},...row.ledger].slice(0,40);
  return {row,earned};
}
export function applyFeed(row){
  row={...fresh(),...row};
  if(row.bap<RULES.feed)throw Object.assign(new Error(`밥알이 ${RULES.feed}개 있어야 밥을 줄 수 있어요.`),{status:400});
  const before=levelOf(row.xp).level;
  row.bap-=RULES.feed;row.xp+=RULES.feed;
  return {row,levelUp:levelOf(row.xp).level>before};
}
// 관리자가 글을 지우면 그 글로 받은 밥알을 회수한다(이미 밥으로 준 만큼은 잔액에서 0까지만).
export function applyRevoke(row,refKey){
  const hit=(row.ledger||[]).filter(e=>e.refKey===refKey&&e.amount>0);
  if(!hit.length)return null;
  const amount=hit.reduce((n,e)=>n+e.amount,0);
  return {...row,bap:Math.max(0,row.bap-amount),ledger:[{at:new Date().toISOString(),amount:-amount,reason:'삭제된 글의 밥알 회수'},...row.ledger.map(e=>e.refKey===refKey?{...e,refKey:null}:e)].slice(0,40)};
}
export function publicReward(row){
  row={...fresh(),...row};
  const lv=levelOf(row.xp),next=LEVELS.find(l=>l.xp>row.xp);
  return {bap:row.bap,xp:row.xp,level:lv.level,levelName:lv.name,nextXp:next?.xp??null,nextName:next?.name??null,
    today:{date:row.daily.date===today()?row.daily.date:today(),earned:row.daily.date===today()?row.daily.earned:0,keys:row.daily.date===today()?row.daily.keys:[]},
    rules:RULES,levels:LEVELS,ledger:row.ledger.slice(0,10).map(({refKey,...e})=>e),usedCoupons:row.usedCoupons};
}

function createFileRewardStore(file=path.resolve('.local-data/rewards.json')){
  let data={users:{}};if(fs.existsSync(file))data={...data,...JSON.parse(fs.readFileSync(file,'utf8'))};
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data));fs.renameSync(file+'.tmp',file);};
  return {
    get:async id=>data.users[id]||fresh(),
    update:async(id,work)=>{const out=work(data.users[id]||fresh());if(out?.row){data.users[id]=out.row;persist();}return out;},
    revokeRef:async refKey=>{for(const [id,row] of Object.entries(data.users)){const next=applyRevoke(row,refKey);if(next){data.users[id]=next;persist();}}}
  };
}
function createPostgresRewardStore(pool){
  return {
    get:async id=>(await pool.query('SELECT data FROM wolgye.user_rewards WHERE id=$1',[id])).rows[0]?.data||fresh(),
    update:(id,work)=>transaction(pool,async c=>{
      const row=(await c.query('SELECT data FROM wolgye.user_rewards WHERE id=$1 FOR UPDATE',[id])).rows[0]?.data||fresh();
      const out=work(row);
      if(out?.row)await c.query('INSERT INTO wolgye.user_rewards(id,data) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[id,out.row]);
      return out;
    }),
    revokeRef:async refKey=>{
      const rows=(await pool.query("SELECT id,data FROM wolgye.user_rewards WHERE data->'ledger' @> $1::jsonb",[JSON.stringify([{refKey}])])).rows;
      for(const r of rows){const next=applyRevoke(r.data,refKey);if(next)await pool.query('UPDATE wolgye.user_rewards SET data=$2 WHERE id=$1',[r.id,next]);}
    }
  };
}
export const rewardStore=useDatabase()?createPostgresRewardStore(getPool()):createFileRewardStore();
export {createFileRewardStore,randomUUID};
