// 291곳 메뉴·가격 미리 모으기 (카카오 공식 이미지 검색 + 메뉴판 사진 읽기)
//   모으기: node scripts/collect-menus.mjs        (이미 사장님·이웃이 넣은 메뉴는 건드리지 않음)
//   지우기: node scripts/collect-menus.mjs --remove (이 스크립트가 넣은 '인터넷' 정보만 지움)
// 사진은 저장하지 않고 메뉴·가격 글자, 출처 링크, 사진 날짜만 place_info에 저장한다.
import 'dotenv/config';
import {getCommunityPlaces} from '../server/services/communityService.js';
import {communityStore} from '../server/services/communityStore.js';
import {readMenuPhoto} from '../server/services/llm.js';
import {getPool,useDatabase} from '../server/db/pool.js';

const EDITOR='collector-internet-menu',MAX_AGE_DAYS=730,PHOTOS=3,PARALLEL=3;
const cutoff=new Date(Date.now()-MAX_AGE_DAYS*86400000);
const day=d=>new Date(d).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const remove=process.argv.includes('--remove'),limit=Number(process.argv.find(a=>a.startsWith('--limit='))?.split('=')[1]||0);

async function searchImages(name){
  const u=new URL('https://dapi.kakao.com/v2/search/image');u.searchParams.set('query',`${name} 메뉴판`);u.searchParams.set('size','15');
  const d=await (await fetch(u,{headers:{Authorization:`KakaoAK ${process.env.KAKAO_REST_API_KEY}`},signal:AbortSignal.timeout(10000)})).json();
  return (d.documents||[]).filter(x=>x.datetime&&new Date(x.datetime)>=cutoff).sort((a,b)=>b.datetime.localeCompare(a.datetime)).slice(0,PHOTOS);
}
async function photoData(url){
  const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Mozilla/5.0'}});
  const type=(r.headers.get('content-type')||'').split(';')[0];
  if(!r.ok||!/^image\/(jpeg|png|webp)$/.test(type))return null;
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length>4e6||buf.length<5000)return null;
  return `data:${type};base64,${buf.toString('base64')}`;
}
async function collect(place){
  let best=null;
  for(const doc of await searchImages(place.name)){
    try{
      const image=await photoData(doc.image_url);if(!image)continue;
      const read=await readMenuPhoto(image);const priced=read.items.filter(i=>i.price);
      if(priced.length<2)continue; // 가격이 거의 안 읽힌 사진은 건너뜀
      if(!best||priced.length>best.priced.length)best={doc,read,priced};
    }catch{}
  }
  if(!best)return null;
  const text=best.read.items.map(i=>`${i.name} ${i.price?i.price.toLocaleString('ko-KR')+'원':'(가격 확인 필요)'}`).join(' / ').slice(0,980);
  await communityStore.savePlaceInfo(place.id,{menu:text},{role:'internet',author:'인터넷 메뉴판',observedAt:day(best.doc.datetime),editorHash:EDITOR,sourceUrl:best.doc.doc_url});
  return best;
}
try{
  const infos=await communityStore.placeInfo();
  if(remove){
    let n=0;for(const [id,info] of Object.entries(infos))if(info.fields?.menu?.role==='internet'){await communityStore.savePlaceInfo(id,{menu:''},{role:'internet',author:'인터넷 메뉴판',observedAt:day(Date.now()),editorHash:EDITOR});n++;}
    console.log(`인터넷 메뉴판 정보 ${n}곳 삭제`);
  }else{
    let places=(await getCommunityPlaces()).items.filter(p=>{const f=infos[p.id]?.fields?.menu;return !f||f.role==='internet';});
    if(limit)places=places.slice(0,limit);
    console.log(`대상 ${places.length}곳 (사장님·이웃이 넣은 메뉴가 있는 곳은 제외, ${MAX_AGE_DAYS/365}년 이내 사진만)`);
    let done=0,found=0;const started=Date.now();
    const queue=[...places];
    await Promise.all(Array.from({length:PARALLEL},async()=>{while(queue.length){const p=queue.shift();try{const r=await collect(p);if(r){found++;console.log(`✔ ${p.name} · ${r.priced.length}개 · ${day(r.doc.datetime)}`);}}catch(e){console.log(`✖ ${p.name} · ${e.message.slice(0,60)}`);}done++;if(done%20===0)console.log(`… ${done}/${places.length} (${Math.round((Date.now()-started)/1000)}초)`);}}));
    console.log(`완료: ${places.length}곳 중 ${found}곳에 메뉴·가격 저장 (${Math.round((Date.now()-started)/1000)}초)`);
  }
}finally{if(useDatabase())await getPool().end();}
