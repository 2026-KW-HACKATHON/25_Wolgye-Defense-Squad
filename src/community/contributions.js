const KEY='wolgye-contributor-v1';
function token(){let value=localStorage.getItem(KEY);if(!value){value=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(KEY,value);}return value;}
export async function communityApi(path,method='GET',body){
  const r=await fetch('/api/community'+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
  if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('서버에 연결할 수 없어요. 다시 시도해 주세요.');
  const d=await r.json();if(!r.ok){const error=new Error(d.error||'저장에 실패했어요.');error.duplicate=d.duplicate;throw error;}return d;
}
export const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
