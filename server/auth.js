import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
let client;
export function authConfig(){return {url:process.env.SUPABASE_URL?.trim(),key:process.env.SUPABASE_PUBLISHABLE_KEY?.trim()};}
export function isAdmin(user){return (process.env.AUTH_ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).includes(user.id);}
export async function authenticate(req,res,next){
  const token=req.get('authorization')?.replace(/^Bearer /i,'');
  if(!token){req.user=null;return next();}
  const {url,key}=authConfig();
  if(!url||!key)return res.status(503).json({error:'로그인 연결 설정을 준비 중이에요.'});
  try{
    client ||= createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await client.auth.getUser(token);
    if(error||!data.user)return res.status(401).json({error:'로그인이 만료됐어요. 다시 로그인해 주세요.'});
    req.user=data.user;req.isAdmin=isAdmin(data.user);
    // Stable account identifier, never supplied by the browser as proof of identity.
    req.accountContributor=createHash('sha256').update(`supabase:${data.user.id}`).digest('hex');
    next();
  }catch{return res.status(503).json({error:'로그인 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'});}
}
export function requireUser(req,res,next){if(!req.user)return res.status(401).json({error:'로그인 후 이용해 주세요.'});next();}
export function requireAdmin(req,res,next){if(!req.user)return res.status(401).json({error:'로그인해 주세요.'});if(!req.isAdmin)return res.status(403).json({error:'관리자만 이용할 수 있어요.'});next();}
