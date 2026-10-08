import 'dotenv/config';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {getCommunityPlaces} from '../server/services/communityService.js';
import {communityStore} from '../server/services/communityStore.js';
import {readMenuPhoto} from '../server/services/llm.js';
import {getPool,transaction} from '../server/db/pool.js';
import {applyInfoEdit} from '../server/services/placeInfo.js';
import {saveReview,decideReview,classifyMenu,menuFingerprint} from '../server/services/menuReview.js';
const pool=getPool(),runId=randomUUID(),cutoff=new Date();cutoff.setFullYear(cutoff.getFullYear()-2);
const limit=Number(process.argv.find(x=>x.startsWith('--limit='))?.split('=')[1]||0);
const refresh=process.argv.includes('--refresh'),remove=process.argv.includes('--remove');
const day=d=>new Date(d).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
function canonical(value){try{const u=new URL(value);const host=u.hostname.replace(/^m\./,'');if(host.endsWith('blog.naver.com')){const parts=u.pathname.split('/').filter(Boolean);return 'naver:'+ (u.searchParams.get('blogId')||parts[0])+':'+(u.searchParams.get('logNo')||parts[1]);}return host+u.pathname.replace(/\/$/,'');}catch{return '';}}
async function search(type,query){const u=new URL('https://dapi.kakao.com/v2/search/'+type);u.searchParams.set('query',query);u.searchParams.set('size','15');const r=await fetch(u,{headers:{Authorization:`KakaoAK ${process.env.KAKAO_REST_API_KEY}`},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('search HTTP '+r.status);return (await r.json()).documents||[];}
async function candidates(place){const all=new Map(),blogs=new Set();for(const area of ['광운대','월계동','석계역']){const [images,posts]=await Promise.all([search('image',`${place.name} ${area} 메뉴판`),search('blog',`${place.name} ${area}`)]);for(const p of posts)blogs.add(canonical(p.url));for(const d of images){const date=new Date(d.datetime);if(date>=cutoff&&date<=new Date()&&/^https?:\/\//.test(d.doc_url))all.set(d.image_url,d);}}
 return [...all.values()].map(d=>({...d,blogMatch:blogs.has(canonical(d.doc_url))})).sort((a,b)=>Number(b.blogMatch)-Number(a.blogMatch)||b.datetime.localeCompare(a.datetime)).slice(0,2);}
async function photoData(value){const u=new URL(value);if(u.protocol!=='https:'||!['pstatic.net','daumcdn.net','kakaocdn.net','naver.net'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return null;
 const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(15000)});const type=(r.headers.get('content-type')||'').split(';')[0];if(!r.ok||!/^image\/(jpeg|png|webp)$/.test(type))return null;
 const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>4000000)throw Error('image size');chunks.push(chunk);}if(size<5000)return null;return `data:${type};base64,${Buffer.concat(chunks).toString('base64')}`;}
async function backupAndClear(){return transaction(pool,async c=>{const rows=(await c.query("SELECT id,data FROM wolgye.place_info WHERE data->'fields'->'menu'->>'role'='internet' FOR UPDATE")).rows;
 fs.mkdirSync('.local-data/menu-backups',{recursive:true});const file=`.local-data/menu-backups/${runId}.json`;fs.writeFileSync(file,JSON.stringify({createdAt:new Date().toISOString(),rows},null,2),{flag:'wx'});
 for(const {id,data} of rows){const next=applyInfoEdit(data,id,{menu:''},{role:'internet',author:'인터넷 메뉴 재검증',observedAt:day(Date.now()),editorHash:runId});await c.query('UPDATE wolgye.place_info SET data=$2 WHERE id=$1',[id,next]);}console.log(JSON.stringify({backup:file,cleared:rows.length}));});}
let lock;
try{
 lock=await pool.connect();if(!(await lock.query('SELECT pg_try_advisory_lock(7142039) AS ok')).rows[0].ok)throw Error('Another collector is active');
 if(refresh||remove)await backupAndClear();
 if(!remove){const infos=await communityStore.placeInfo();let places=(await getCommunityPlaces()).items.filter(p=>!infos[p.id]?.fields?.menu||infos[p.id].fields.menu.role==='internet');if(limit)places=places.slice(0,limit);
 const rows=[],queue=[...places];let done=0,errors=0;console.log('대상 '+places.length+'곳');
 await Promise.all(Array.from({length:2},async()=>{while(queue.length){const p=queue.shift();try{for(const d of await candidates(p)){const image=await photoData(d.image_url);if(!image)continue;const read=await readMenuPhoto(image,p);if(read.items.filter(i=>i.price!==null).length<2)continue;
 const text=read.items.map(i=>`${i.name} ${i.price?i.price.toLocaleString('ko-KR')+'원':'(가격 확인 필요)'}`).join(' / ').slice(0,980);
 const row={id:randomUUID(),runId,placeId:p.id,name:p.name,kind:p.kind,text,sourceUrl:d.doc_url,sourceDate:day(d.datetime),createdAt:new Date().toISOString(),blogMatch:d.blogMatch,verification:read.verification,fingerprint:menuFingerprint(text)};row.status=classifyMenu(row);await saveReview(row);if(row.status!=='rejected'){rows.push(row);break;}
 }}catch(e){errors++;console.log('실패 '+p.id+' '+(e.message||'error').slice(0,80));}finally{done++;if(done%20===0)console.log('진행 '+done+'/'+places.length);}}}));
 const fingerprints=new Map();for(const r of rows){if(!fingerprints.has(r.fingerprint))fingerprints.set(r.fingerprint,new Set());fingerprints.get(r.fingerprint).add(r.placeId);}
 let approved=0,pending=0;for(const r of rows){if(fingerprints.get(r.fingerprint).size>1){r.status='pending';r.duplicate=true;await saveReview(r);}if(r.status==='eligible'){try{await decideReview(r.id,true,'collector:'+runId);approved++;}catch{r.status='pending';r.reason='수집 중 정보 변경 또는 저장 실패';await saveReview(r);pending++;}}else pending++;}
 console.log(JSON.stringify({runId,total:places.length,approved,pending,errors}));
 }
}catch(e){console.error('수집 중단:',e.message);process.exitCode=1;}finally{if(lock){await lock.query('SELECT pg_advisory_unlock(7142039)').catch(()=>{});lock.release();}await pool.end();}
