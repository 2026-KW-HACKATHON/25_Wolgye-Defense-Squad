import express from 'express';
import {communityStore} from './services/communityStore.js';
import {getCommunityPlaces,inDistrict} from './services/communityService.js';
import {INFO_FIELDS,publicInfo} from './services/placeInfo.js';
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d&&d<=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export function createContributionRouter({store=communityStore,catalog=getCommunityPlaces,requireAccount=false,roleFor=async()=>'neighbor',onEarn=async()=>0,onRevoke=async()=>{}}={}) {
  const router=express.Router();let start=Date.now(),writes=0;
  router.use((req,res,next)=>{
    const token=req.get('authorization')?.replace(/^Bearer /,'');
    req.contributor=requireAccount?(req.accountContributor||null):(/^[a-f0-9]{64}$/.test(token||'')?token:null);
    if(req.method!=='GET'){
      if(!req.contributor)return res.status(401).json({error:'로그인 후 소식을 작성하거나 장소를 등록해 주세요.'});
      if(Date.now()-start>3600000){start=Date.now();writes=0;}
      if(writes++>=300)return res.status(429).json({error:'등록 요청이 많아요. 잠시 후 다시 시도해 주세요.'});
    }
    next();
  });
  router.get('/contributions',async(req,res)=>{try{res.json(await store.contributionStats(req.contributor));}catch{res.status(503).json({error:'기여 현황을 불러오지 못했어요.'});}});
  router.get('/posts',async(req,res)=>{try{res.json({items:await store.posts(req.contributor)});}catch{res.status(503).json({error:'공용 저장소에서 소식을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'});}});
  router.post('/places',async(req,res)=>{
    try{
      const {lat,lng}=req.body||{};
      const p={name:clean(req.body.name,70),kind:clean(req.body.kind,40),address:clean(req.body.address,160),phone:clean(req.body.phone,30),lat,lng};
      if(!p.name||!p.kind||!p.address||!inDistrict(lat,lng))return res.status(400).json({error:'가게 이름·업종·주소를 입력하고 월계1동 안의 위치를 선택해 주세요.'});
      const existing=(await catalog()).items;
      const normalize=s=>s.replace(/\s/g,'').toLowerCase();
      const duplicate=[...existing,...await store.places()].find(x=>normalize(x.name)===normalize(p.name)&&Math.hypot((x.lat-lat)*111000,(x.lng-lng)*88000)<150);
      if(duplicate)return res.status(409).json({error:'가까운 위치에 같은 이름의 가게가 있어요. 기존 가게를 선택해 주세요.',duplicate});
      if((await store.places()).length>=2000)return res.status(409).json({error:'등록 가능한 가게 수를 초과했어요.'});
      res.status(201).json({place:await store.addPlace(p,req.contributor)});
    }catch(e){res.status(e.status||502).json({error:e.status?e.message:'기존 가게 확인 또는 저장에 실패했어요. 다시 시도해 주세요.'});}
  });
  async function save(req,res){
    try{
      const b=req.body||{};
      const keywords=Array.isArray(b.keywords)?b.keywords:[];
      if(keywords.length>8||keywords.some(v=>typeof v!=='string'||!v.trim()||v.length>24))return res.status(400).json({error:'키워드는 최대 8개, 각각 24자 이하로 입력해 주세요.'});
      const p={keywords:[...new Set(keywords.map(v=>v.trim().replace(/^#+/,'')))].filter(Boolean),placeId:clean(b.placeId,100),title:clean(b.title,70),body:clean(b.body,2000),author:clean(req.user?.user_metadata?.nickname||b.author,30),type:clean(b.type,30),observedAt:clean(b.observedAt,10),image:typeof b.image==='string'?b.image:''};
      if(!p.title||!p.body||!p.author||!['방문 이야기','메뉴·가격','영업 소식','새로운 발견'].includes(p.type))return res.status(400).json({error:'제목·내용·작성자·소식 종류를 확인해 주세요.'});
      if(!validDate(p.observedAt))return res.status(400).json({error:'실제로 확인한 날짜를 오늘 이전으로 입력해 주세요.'});
      if(p.image){
        const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(p.image);
        if(!match)return res.status(400).json({error:'JPG·PNG·WebP 사진만 첨부할 수 있어요.'});
        const bytes=Buffer.from(match[2],'base64');
        const valid=match[1]==='png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a':match[1]==='jpeg'?bytes.subarray(0,3).toString('hex')==='ffd8ff':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
        if(!valid||bytes.length>1048576)return res.status(400).json({error:'1MB 이하의 올바른 사진을 선택해 주세요.'});
      }
      if(!(await catalog()).items.some(x=>x.id===p.placeId))return res.status(400).json({error:'등록된 가게를 선택해 주세요.'});
      if(!req.params.id&&(await store.posts()).length>=1000)return res.status(409).json({error:'소식 저장 공간이 가득 찼어요.'});
      p.authorRole=await roleFor(req,p.placeId);
      const post=await store.savePost(p,req.contributor,req.params.id);
      if(!post)return res.status(403).json({error:'내가 작성한 소식만 수정할 수 있어요.'});
      const earned=req.params.id?0:await onEarn(req,{amount:p.image?'photoPost':'post',reason:p.image?'사진 있는 소식':'소식 올리기',refKey:`post:${post.id}`}).catch(()=>0);
      res.json({post,earned});
    }catch{res.status(502).json({error:'소식을 저장하지 못했어요. 다시 시도해 주세요.'});}
  }
  router.put('/places/:id/info',async(req,res)=>{
    try{
      const b=req.body||{},fields={};
      for(const [key,{max}] of Object.entries(INFO_FIELDS))if(typeof b.fields?.[key]==='string')fields[key]=clean(b.fields[key],max);
      const observedAt=clean(b.observedAt,10),author=clean(req.user?.user_metadata?.nickname||b.author,30)||'월계 이웃';
      if(!Object.keys(fields).length)return res.status(400).json({error:'고칠 정보를 입력해 주세요.'});
      if(!validDate(observedAt))return res.status(400).json({error:'실제로 확인한 날짜를 오늘 이전으로 입력해 주세요.'});
      if(!(await catalog()).items.some(x=>x.id===req.params.id))return res.status(404).json({error:'가게를 찾지 못했어요.'});
      const info=await store.savePlaceInfo(req.params.id,fields,{role:await roleFor(req,req.params.id),author,observedAt,editorHash:req.contributor});
      if(!info)return res.status(400).json({error:'바뀐 내용이 없어요.'});
      const earned=await onEarn(req,{amount:'info',reason:'가게 정보 보태기',key:`info:${req.params.id}`}).catch(()=>0);
      res.json({info:publicInfo(info),earned});
    }catch{res.status(502).json({error:'가게 정보를 저장하지 못했어요. 다시 시도해 주세요.'});}
  });
  router.post('/posts',save);router.put('/posts/:id',save);
  // 관리자는 누구의 소식이든, 이웃이 등록한 장소든 지울 수 있다(부적절한 글 대응).
  router.delete('/places/:id',async(req,res)=>{try{if(!req.isAdmin)return res.status(403).json({error:'관리자만 장소를 지울 수 있어요.'});if(!req.params.id.startsWith('local-'))return res.status(400).json({error:'이웃이 등록한 장소만 지울 수 있어요.'});if(!await store.removePlaceAsAdmin(req.params.id))return res.status(404).json({error:'장소를 찾지 못했어요.'});res.json({ok:true});}catch{res.status(503).json({error:'장소를 지우지 못했어요.'});}});
  router.delete('/posts/:id',async(req,res)=>{try{if(req.isAdmin&&await store.removePostAsAdmin(req.params.id)){await onRevoke(`post:${req.params.id}`).catch(()=>{});return res.json({ok:true});}if(!await store.removePost(req.params.id,req.contributor))return res.status(403).json({error:'내가 작성한 소식만 삭제할 수 있어요.'});res.json({ok:true});}catch{res.status(503).json({error:'공용 저장소에 연결할 수 없어 삭제하지 못했어요.'});}});
  return router;
}
