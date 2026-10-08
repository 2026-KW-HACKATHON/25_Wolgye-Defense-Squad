import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {getPool,transaction,useDatabase} from '../db/pool.js';

const digest=value=>createHash('sha256').update(value).digest('hex');
export const day=()=>new Date().toISOString().slice(0,10);
const validAge=new Set(['10대','20대','30대','40대','50대 이상']);
const validGender=new Set(['여성','남성','기타']);
const validTime=new Set(['아침','점심','저녁','야식']);

// 조회 통계: 같은 브라우저의 같은 가게 조회는 하루 한 번. 이용자가 고른 값만 저장한다.
export const viewHash=(placeId,viewerId)=>digest(`${day()}:${placeId}:${viewerId}`);
export function viewFields(details={}){
  const people=Number(details.people),budget=Number(details.budget);
  return {age:validAge.has(details.age)?details.age:null,gender:validGender.has(details.gender)?details.gender:null,people:Number.isInteger(people)&&people>=1&&people<=20?people:null,budget:Number.isInteger(budget)&&budget>=1000&&budget<=100000?Math.round(budget/5000)*5000:null,mealTime:validTime.has(details.mealTime)?details.mealTime:null};
}
export function mergeView(existing,fields){for(const [key,value] of Object.entries(fields))if(value!==null)existing[key]=value;return existing;}
export function buildReport(rows){
  const count=key=>rows.reduce((a,r)=>{const k=r[key]??'미응답';a[k]=(a[k]||0)+1;return a;},{});
  const days=rows.reduce((a,r)=>{a[r.date]=(a[r.date]||0)+1;return a;},{});
  return {totalViews:rows.length,days,age:count('age'),gender:count('gender'),people:count('people'),budget:count('budget'),mealTime:count('mealTime'),period:'최근 90일 · 같은 브라우저의 같은 가게 조회는 하루 한 번'};
}
export const viewCutoff=()=>new Date(Date.now()-90*86400000).toISOString().slice(0,10);
export const newAccount=(placeId,user)=>({id:randomUUID(),userId:user.id,email:user.email,placeId,status:'pending',createdAt:new Date().toISOString()});
export const accountOf=(accounts,userId)=>accounts.find(a=>a.userId===userId&&a.status==='approved')||accounts.find(a=>a.userId===userId&&a.status==='pending');

export function createOwnerMarketingStore(file=path.resolve('.local-data/owner-marketing.json')){
  let data={campaigns:[],proposals:[],views:[],accounts:[],keywords:[],coupons:[]};
  if(fs.existsSync(file))data={...data,...JSON.parse(fs.readFileSync(file,'utf8'))};
  // 예전 사장님 전용 비밀번호 계정은 통합 로그인과 연결되지 않으므로 무시한다.
  data.accounts=data.accounts.filter(a=>a.userId);delete data.sessions;
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(`${file}.tmp`,JSON.stringify(data));for(let attempt=0;;attempt++){try{fs.renameSync(`${file}.tmp`,file);break;}catch(e){if(!['EPERM','EBUSY','EACCES'].includes(e.code)||attempt>=4)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25*(attempt+1));}}};
  return {
    requestUserAccount(placeId,user){if(data.accounts.some(a=>a.userId===user.id&&a.status!=='rejected'))return false;data.accounts.push(newAccount(placeId,user));persist();return true;},
    accountForUser:id=>accountOf(data.accounts,id),
    pendingAccounts:()=>data.accounts.filter(a=>a.status==='pending'),
    approveAccount(id,approve){const a=data.accounts.find(a=>a.id===id&&a.status==='pending');if(!a)return false;a.status=approve?'approved':'rejected';a.reviewedAt=new Date().toISOString();persist();return true;},
    campaigns:placeId=>data.campaigns.filter(c=>c.placeId===placeId),
    publicCampaigns:placeId=>data.campaigns.filter(c=>c.placeId===placeId&&c.status==='published'),
    saveCampaign(placeId,values,id){const i=id?data.campaigns.findIndex(c=>c.id===id&&c.placeId===placeId):-1;if(id&&i<0)return null;const row={...values,id:id||randomUUID(),placeId,createdAt:i<0?new Date().toISOString():data.campaigns[i].createdAt,updatedAt:new Date().toISOString()};if(i<0)data.campaigns.unshift(row);else data.campaigns[i]=row;persist();return row;},
    removeCampaign(placeId,id){const i=data.campaigns.findIndex(c=>c.id===id&&c.placeId===placeId);if(i<0)return false;data.campaigns.splice(i,1);persist();return true;},
    proposals:placeId=>data.proposals.filter(p=>p.placeId===placeId),
    saveProposal(placeId,values){const row={...values,id:randomUUID(),placeId,status:'review',createdAt:new Date().toISOString()};data.proposals.unshift(row);persist();return row;},
    reviewProposal(placeId,id,status,card){const row=data.proposals.find(p=>p.placeId===placeId&&p.id===id);if(!row)return null;if(status)row.status=status;if(card)row.card=card;row.updatedAt=new Date().toISOString();persist();return row;},
    allPublicCampaigns:()=>data.campaigns.filter(c=>c.status==='published'),
    recordView(placeId,viewerId,details={}){const hash=viewHash(placeId,viewerId),existing=data.views.find(v=>v.hash===hash),fields=viewFields(details);if(existing)mergeView(existing,fields);else data.views.push({hash,placeId,date:day(),...fields});data.views=data.views.filter(v=>v.date>=viewCutoff());persist();return !existing;},
    report:placeId=>buildReport(data.views.filter(v=>v.placeId===placeId)),
    coupons:placeId=>data.coupons.filter(c=>c.placeId===placeId),
    allCoupons:()=>data.coupons,
    saveCoupon(placeId,values){const row={...values,id:randomUUID(),placeId,createdAt:new Date().toISOString()};data.coupons.unshift(row);persist();return row;},
    removeCoupon(placeId,id){const i=data.coupons.findIndex(c=>c.id===id&&c.placeId===placeId);if(i<0)return false;data.coupons.splice(i,1);persist();return true;},
    keywords:placeId=>data.keywords.find(row=>row.placeId===placeId)?.values||[],
    keywordMap:()=>Object.fromEntries(data.keywords.map(row=>[row.placeId,row.values])),
    saveKeywords(placeId,values){const row=data.keywords.find(item=>item.placeId===placeId);if(row){row.values=values;row.updatedAt=new Date().toISOString();}else data.keywords.push({placeId,values,updatedAt:new Date().toISOString()});persist();return values;}
  };
}
// 공용 DB 버전. 테이블은 server/db/schema.sql 참고.
export function createPostgresOwnerMarketingStore(pool){
  const list=async(table,where='',params=[])=>(await pool.query(`SELECT data FROM wolgye.${table} ${where} ORDER BY data->>'createdAt' DESC`,params)).rows.map(r=>r.data);
  const upsert=(c,table,row,id=row.id)=>c.query(`INSERT INTO wolgye.${table}(id,data) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,[id,row]);
  return {
    requestUserAccount:(placeId,user)=>transaction(pool,async c=>{await c.query('SELECT pg_advisory_xact_lock(7142030)');const mine=(await c.query("SELECT data FROM wolgye.owner_accounts WHERE data->>'userId'=$1",[user.id])).rows.map(r=>r.data);if(mine.some(a=>a.status!=='rejected'))return false;await upsert(c,'owner_accounts',newAccount(placeId,user));return true;}),
    accountForUser:async id=>accountOf(await list('owner_accounts',"WHERE data->>'userId'=$1",[id]),id),
    pendingAccounts:()=>list('owner_accounts',"WHERE data->>'status'='pending'"),
    approveAccount:(id,approve)=>transaction(pool,async c=>{const a=(await c.query('SELECT data FROM wolgye.owner_accounts WHERE id=$1 FOR UPDATE',[id])).rows[0]?.data;if(a?.status!=='pending')return false;await upsert(c,'owner_accounts',{...a,status:approve?'approved':'rejected',reviewedAt:new Date().toISOString()});return true;}),
    campaigns:placeId=>list('owner_campaigns',"WHERE data->>'placeId'=$1",[placeId]),
    publicCampaigns:placeId=>list('owner_campaigns',"WHERE data->>'placeId'=$1 AND data->>'status'='published'",[placeId]),
    saveCampaign:(placeId,values,id)=>transaction(pool,async c=>{const old=id?(await c.query("SELECT data FROM wolgye.owner_campaigns WHERE id=$1 AND data->>'placeId'=$2 FOR UPDATE",[id,placeId])).rows[0]?.data:null;if(id&&!old)return null;const row={...values,id:id||randomUUID(),placeId,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};await upsert(c,'owner_campaigns',row);return row;}),
    removeCampaign:async(placeId,id)=>(await pool.query("DELETE FROM wolgye.owner_campaigns WHERE id=$1 AND data->>'placeId'=$2",[id,placeId])).rowCount>0,
    proposals:placeId=>list('owner_proposals',"WHERE data->>'placeId'=$1",[placeId]),
    saveProposal:async(placeId,values)=>{const row={...values,id:randomUUID(),placeId,status:'review',createdAt:new Date().toISOString()};await upsert(pool,'owner_proposals',row);return row;},
    allPublicCampaigns:()=>list('owner_campaigns',"WHERE data->>'status'='published'"),
    reviewProposal:(placeId,id,status,card)=>transaction(pool,async c=>{const row=(await c.query("SELECT data FROM wolgye.owner_proposals WHERE id=$1 AND data->>'placeId'=$2 FOR UPDATE",[id,placeId])).rows[0]?.data;if(!row)return null;const next={...row,...(status?{status}:{}),...(card?{card}:{}),updatedAt:new Date().toISOString()};await upsert(c,'owner_proposals',next);return next;}),
    recordView:(placeId,viewerId,details={})=>transaction(pool,async c=>{const hash=viewHash(placeId,viewerId),fields=viewFields(details);const existing=(await c.query('SELECT data FROM wolgye.owner_views WHERE id=$1 FOR UPDATE',[hash])).rows[0]?.data;await upsert(c,'owner_views',existing?mergeView(existing,fields):{hash,placeId,date:day(),createdAt:new Date().toISOString(),...fields},hash);await c.query("DELETE FROM wolgye.owner_views WHERE data->>'date'<$1",[viewCutoff()]);return !existing;}),
    report:async placeId=>buildReport(await list('owner_views',"WHERE data->>'placeId'=$1",[placeId])),
    coupons:placeId=>list('owner_coupons',"WHERE data->>'placeId'=$1",[placeId]),
    allCoupons:()=>list('owner_coupons'),
    saveCoupon:async(placeId,values)=>{const row={...values,id:randomUUID(),placeId,createdAt:new Date().toISOString()};await upsert(pool,'owner_coupons',row);return row;},
    removeCoupon:async(placeId,id)=>(await pool.query("DELETE FROM wolgye.owner_coupons WHERE id=$1 AND data->>'placeId'=$2",[id,placeId])).rowCount>0,
    keywords:async placeId=>(await pool.query('SELECT data FROM wolgye.owner_keywords WHERE id=$1',[placeId])).rows[0]?.data.values||[],
    keywordMap:async()=>Object.fromEntries((await pool.query('SELECT id,data FROM wolgye.owner_keywords')).rows.map(r=>[r.id,r.data.values||[]])),
    saveKeywords:async(placeId,values)=>{await upsert(pool,'owner_keywords',{placeId,values,updatedAt:new Date().toISOString()},placeId);return values;}
  };
}
export const ownerMarketingStore=useDatabase()?createPostgresOwnerMarketingStore(getPool()):createOwnerMarketingStore();
