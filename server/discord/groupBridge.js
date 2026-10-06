import fs from 'node:fs';
import path from 'node:path';

// The bot calls the running web API: only that server writes groups.json.
export function createGroupBridge({base='http://127.0.0.1:3001',file=path.resolve('.local-data/discord-memberships.json'),fetcher=fetch}={}){
  const url=new URL(base);
  if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Error('봇 API는 같은 PC의 로컬 서버로 연결해 주세요.');
  const memberships=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  const pending=new Set();
  const key=(guild,user,code)=>`${guild}:${user}:${code}`;
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(memberships));fs.renameSync(file+'.tmp',file);};
  async function request(route,method='GET',body,token){
    const response=await fetcher(new URL('/api/groups'+route,url),{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(65000)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('웹 모임 서버를 먼저 실행해 주세요.');
    const data=await response.json();if(!response.ok)throw new Error(data.error||'모임 요청에 실패했어요.');return data;
  }
  function remember(guild,user,d){memberships[key(guild,user,d.group.id)]={token:d.token,memberId:d.memberId};persist();return d.group;}
  function mine(guild,user,code){const m=memberships[key(guild,user,code)];if(!m)throw new Error('먼저 참여 버튼이나 /밥상 참여로 모임에 들어와 주세요.');return m;}
  return {
    async create(guild,user,name,nickname){const k=key(guild,user,'create');if(pending.has(k))throw new Error('이미 모임을 만들고 있어요.');pending.add(k);try{return remember(guild,user,await request('/','POST',{name,nickname}));}finally{pending.delete(k);}},
    async join(guild,user,code,nickname){code=code.toUpperCase();if(!/^[A-F0-9]{12}$/.test(code))throw new Error('12자리 초대 코드를 확인해 주세요.');const k=key(guild,user,code);if(pending.has(k))throw new Error('참여 처리 중이에요.');pending.add(k);try{if(memberships[k])return (await request('/'+code,'GET',undefined,memberships[k].token)).group;return remember(guild,user,await request('/'+code+'/join','POST',{nickname}));}finally{pending.delete(k);}},
    async get(guild,user,code){return (await request('/'+code,'GET',undefined,mine(guild,user,code).token)).group;},
    async condition(guild,user,code,condition){return (await request('/'+code+'/condition','PUT',{condition},mine(guild,user,code).token)).group;},
    async recommend(guild,user,code){return (await request('/'+code+'/recommend','POST',{},mine(guild,user,code).token)).group;},
    async vote(guild,user,code,ids,revision){return (await request('/'+code+'/vote','PUT',{ids,revision},mine(guild,user,code).token)).group;}
  };
}
