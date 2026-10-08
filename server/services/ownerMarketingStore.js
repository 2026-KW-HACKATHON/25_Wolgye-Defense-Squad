import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual} from 'node:crypto';

const digest=value=>createHash('sha256').update(value).digest('hex');
const day=()=>new Date().toISOString().slice(0,10);
const validAge=new Set(['10대','20대','30대','40대','50대 이상']);
const validGender=new Set(['여성','남성','기타']);
const validTime=new Set(['아침','점심','저녁','야식']);

export function createOwnerMarketingStore(file=path.resolve('.local-data/owner-marketing.json')){
  let data={campaigns:[],proposals:[],views:[],sessions:[],accounts:[],keywords:[]};
  if(fs.existsSync(file))data={...data,...JSON.parse(fs.readFileSync(file,'utf8'))};
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(`${file}.tmp`,JSON.stringify(data));fs.renameSync(`${file}.tmp`,file);};
  const session=token=>data.sessions.find(s=>s.expires>Date.now()&&s.hash===digest(token||''));
  const passwordHash=(password,salt)=>scryptSync(password,salt,64).toString('hex');
  const issueSession=placeId=>{const token=randomBytes(32).toString('hex');data.sessions=data.sessions.filter(s=>s.expires>Date.now());data.sessions.push({hash:digest(token),placeId,expires:Date.now()+7*86400000});persist();return token;};
  return {
    requestAccount(placeId,email,password){if(data.accounts.some(a=>a.email===email))return false;const salt=randomBytes(16).toString('hex');data.accounts.push({id:randomUUID(),placeId,email,salt,passwordHash:passwordHash(password,salt),status:'pending',createdAt:new Date().toISOString()});persist();return true;},
    pendingAccounts:()=>data.accounts.filter(a=>a.status==='pending').map(({passwordHash,salt,...a})=>a),
    approveAccount(id,approve){const a=data.accounts.find(a=>a.id===id&&a.status==='pending');if(!a)return false;a.status=approve?'approved':'rejected';a.reviewedAt=new Date().toISOString();persist();return true;},
    login(email,password){const a=data.accounts.find(a=>a.email===email&&a.status==='approved');if(!a)return null;const actual=Buffer.from(passwordHash(password,a.salt),'hex'),expected=Buffer.from(a.passwordHash,'hex');if(!timingSafeEqual(actual,expected))return null;return {token:issueSession(a.placeId),placeId:a.placeId};},
    session,
    logout(token){data.sessions=data.sessions.filter(s=>s.hash!==digest(token||''));persist();},
    campaigns:placeId=>data.campaigns.filter(c=>c.placeId===placeId),
    keywords:placeId=>data.keywords.find(row=>row.placeId===placeId)?.values||[],
    saveKeywords(placeId,values){const row=data.keywords.find(item=>item.placeId===placeId);if(row){row.values=values;row.updatedAt=new Date().toISOString();}else data.keywords.push({placeId,values,updatedAt:new Date().toISOString()});persist();return values;},
    publicCampaigns:placeId=>data.campaigns.filter(c=>c.placeId===placeId&&c.status==='published').map(({ownerNote,...c})=>c),
    saveCampaign(placeId,values,id){const i=id?data.campaigns.findIndex(c=>c.id===id&&c.placeId===placeId):-1;if(id&&i<0)return null;const row={...values,id:id||randomUUID(),placeId,createdAt:i<0?new Date().toISOString():data.campaigns[i].createdAt,updatedAt:new Date().toISOString()};if(i<0)data.campaigns.unshift(row);else data.campaigns[i]=row;persist();return row;},
    removeCampaign(placeId,id){const i=data.campaigns.findIndex(c=>c.id===id&&c.placeId===placeId);if(i<0)return false;data.campaigns.splice(i,1);persist();return true;},
    proposals:placeId=>data.proposals.filter(p=>p.placeId===placeId),
    saveProposal(placeId,values){const row={...values,id:randomUUID(),placeId,status:'review',createdAt:new Date().toISOString()};data.proposals.unshift(row);persist();return row;},
    reviewProposal(placeId,id,status){const row=data.proposals.find(p=>p.placeId===placeId&&p.id===id);if(!row)return null;row.status=status;row.updatedAt=new Date().toISOString();persist();return row;},
    recordView(placeId,viewerId,details={}){const hash=digest(`${day()}:${placeId}:${viewerId}`),existing=data.views.find(v=>v.hash===hash);const age=validAge.has(details.age)?details.age:null,gender=validGender.has(details.gender)?details.gender:null,time=validTime.has(details.mealTime)?details.mealTime:null;const people=Number(details.people),budget=Number(details.budget);const fields={age,gender,people:Number.isInteger(people)&&people>=1&&people<=20?people:null,budget:Number.isInteger(budget)&&budget>=1000&&budget<=100000?Math.round(budget/5000)*5000:null,mealTime:time};if(existing){for(const [key,value] of Object.entries(fields))if(value!==null)existing[key]=value;}else data.views.push({hash,placeId,date:day(),...fields});data.views=data.views.filter(v=>v.date>=new Date(Date.now()-90*86400000).toISOString().slice(0,10));persist();return !existing;},
    report(placeId){const rows=data.views.filter(v=>v.placeId===placeId);const count=key=>rows.reduce((a,r)=>{const k=r[key]??'미응답';a[k]=(a[k]||0)+1;return a;},{});const days=rows.reduce((a,r)=>{a[r.date]=(a[r.date]||0)+1;return a;},{});return {totalViews:rows.length,days,age:count('age'),gender:count('gender'),people:count('people'),budget:count('budget'),mealTime:count('mealTime'),period:'최근 90일 · 같은 브라우저의 같은 가게 조회는 하루 한 번'};}
  };
}
export const ownerMarketingStore=createOwnerMarketingStore();
