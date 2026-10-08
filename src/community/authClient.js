import {createClient} from '@supabase/supabase-js';
let promise;
export function getAuth(){
  if(!promise)promise=fetch('/api/auth/config').then(async r=>{const c=await r.json();if(!r.ok||!c.url||!c.key)throw new Error('로그인 연결 설정을 준비 중이에요.');return createClient(c.url,c.key);}).catch(e=>{promise=null;throw e;});
  return promise;
}
export async function authHeaders(){const c=await getAuth();const {data}=await c.auth.getSession();return data.session?{Authorization:`Bearer ${data.session.access_token}`}:{ };}
export async function accountRequest(path,options={}){
 const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...await authHeaders(),...options.headers}});
 const d=await r.json();if(!r.ok)throw new Error(d.error||'요청을 처리하지 못했어요.');return d;
}
