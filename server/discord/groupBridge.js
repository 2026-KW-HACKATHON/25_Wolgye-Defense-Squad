import fs from 'node:fs';
import path from 'node:path';
import {getPool,useDatabase} from '../db/pool.js';
import {createPostgresMembershipStore} from '../db/postgresStores.js';

// 디스코드 사용자의 모임 참가 토큰 보관소. 공용 DB를 쓰면 DB에, 아니면 Git 제외 파일에 둔다.
function createFileMembershipStore(file){
  const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data));fs.renameSync(file+'.tmp',file);};
  return {get:async id=>data[id],set:async(id,value)=>{data[id]=value;persist();}};
}

// 봇은 실행 중인 웹 API만 호출한다. 모임 데이터는 웹 서버만 저장한다.
export function createGroupBridge({base='http://127.0.0.1:3001',file,store,fetcher=fetch}={}){
  const url=new URL(base);
  if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Error('봇 API는 같은 PC의 로컬 서버로 연결해 주세요.');
  store=store||(file||!useDatabase()?createFileMembershipStore(file||path.resolve('.local-data/discord-memberships.json')):createPostgresMembershipStore(getPool()));
  const pending=new Set();
  const key=(guild,user,code)=>`${guild}:${user}:${code}`;
  async function request(route,method='GET',body,token){
    const response=await fetcher(new URL('/api/groups'+route,url),{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('웹 모임 서버를 먼저 실행해 주세요.');
    const data=await response.json();if(!response.ok)throw new Error(data.error||'모임 요청에 실패했어요.');return data;
  }
  async function remember(guild,user,d){await store.set(key(guild,user,d.group.id),{token:d.token,memberId:d.memberId});return d.group;}
  async function mine(guild,user,code){const m=await store.get(key(guild,user,code));if(!m)throw new Error('먼저 참여 버튼이나 /밥상 참여로 모임에 들어와 주세요.');return m;}
  const as=async(guild,user,code,route,method,body)=>(await request('/'+code+route,method,body,(await mine(guild,user,code)).token)).group;
  return {
    async create(guild,user,name,nickname){const k=key(guild,user,'create');if(pending.has(k))throw new Error('이미 모임을 만들고 있어요.');pending.add(k);try{return await remember(guild,user,await request('/','POST',{name,nickname}));}finally{pending.delete(k);}},
    async join(guild,user,code,nickname){code=code.toUpperCase();if(!/^[A-F0-9]{12}$/.test(code))throw new Error('12자리 초대 코드를 확인해 주세요.');const k=key(guild,user,code);if(pending.has(k))throw new Error('참여 처리 중이에요.');pending.add(k);try{const known=await store.get(k);if(known)return (await request('/'+code,'GET',undefined,known.token)).group;return await remember(guild,user,await request('/'+code+'/join','POST',{nickname}));}finally{pending.delete(k);}},
    // 카드에서 "내가 투표를 완료했는지" 표시하려고 내 참가자 id도 함께 돌려준다.
    async me(guild,user,code){return (await store.get(key(guild,user,code)))?.memberId||null;},
    get:(guild,user,code)=>as(guild,user,code,'','GET'),
    condition:(guild,user,code,condition,secret=false)=>as(guild,user,code,'/condition','PUT',{condition,private:secret}),
    recommend:(guild,user,code)=>as(guild,user,code,'/recommend','POST',{}),
    vote:(guild,user,code,ids,revision)=>as(guild,user,code,'/vote','PUT',{ids,revision}),
    submit:(guild,user,code,revision)=>as(guild,user,code,'/vote/submit','POST',{revision}),
    revote:(guild,user,code)=>as(guild,user,code,'/revote','POST',{}),
    finalize:(guild,user,code,mode)=>as(guild,user,code,'/finalize','POST',{mode})
  };
}
