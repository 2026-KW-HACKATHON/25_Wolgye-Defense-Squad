import express from 'express';
import {communityStore} from './services/communityStore.js';
import {getCommunityPlaces,inDistrict} from './services/communityService.js';
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export function createContributionRouter({store=communityStore,catalog=getCommunityPlaces}={}) {
  const router=express.Router();let start=Date.now(),writes=0;
  router.use((req,res,next)=>{
    const token=req.get('authorization')?.replace(/^Bearer /,'');
    req.contributor=/^[a-f0-9]{64}$/.test(token||'')?token:null;
    if(req.method!=='GET'){
      if(!req.contributor)return res.status(401).json({error:'작성자 정보를 확인할 수 없어요. 새로고침해 주세요.'});
      if(Date.now()-start>3600000){start=Date.now();writes=0;}
      if(writes++>=300)return res.status(429).json({error:'등록 요청이 많아요. 잠시 후 다시 시도해 주세요.'});
    }
    next();
  });
  router.get('/posts',(req,res)=>res.json({items:store.posts(req.contributor)}));
  router.post('/places',async(req,res)=>{
    try{
      const {lat,lng}=req.body||{};
      const p={name:clean(req.body.name,70),kind:clean(req.body.kind,40),address:clean(req.body.address,160),phone:clean(req.body.phone,30),lat,lng};
      if(!p.name||!p.kind||!p.address||!inDistrict(lat,lng))return res.status(400).json({error:'가게 이름·업종·주소를 입력하고 월계1동 안의 위치를 선택해 주세요.'});
      const existing=(await catalog()).items;
      const normalize=s=>s.replace(/\s/g,'').toLowerCase();
      const duplicate=[...existing,...store.places()].find(x=>normalize(x.name)===normalize(p.name)&&Math.hypot((x.lat-lat)*111000,(x.lng-lng)*88000)<150);
      if(duplicate)return res.status(409).json({error:'가까운 위치에 같은 이름의 가게가 있어요. 기존 가게를 선택해 주세요.',duplicate});
      if(store.places().length>=2000)return res.status(409).json({error:'등록 가능한 가게 수를 초과했어요.'});
      res.status(201).json({place:store.addPlace(p,req.contributor)});
    }catch{res.status(502).json({error:'기존 가게 확인 또는 저장에 실패했어요. 다시 시도해 주세요.'});}
  });
  async function save(req,res){
    try{
      const b=req.body||{};
      const p={placeId:clean(b.placeId,100),title:clean(b.title,70),body:clean(b.body,2000),author:clean(b.author,30),type:clean(b.type,30),observedAt:clean(b.observedAt,10),image:typeof b.image==='string'?b.image:''};
      if(!p.title||!p.body||!p.author||!['방문 이야기','메뉴·가격','영업 소식','새로운 발견'].includes(p.type))return res.status(400).json({error:'제목·내용·작성자·소식 종류를 확인해 주세요.'});
      if(!/^\d{4}-\d{2}-\d{2}$/.test(p.observedAt)||!Number.isFinite(Date.parse(p.observedAt))||new Date(p.observedAt).toISOString().slice(0,10)!==p.observedAt||p.observedAt>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}))return res.status(400).json({error:'실제로 확인한 날짜를 오늘 이전으로 입력해 주세요.'});
      if(p.image){
        const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(p.image);
        if(!match)return res.status(400).json({error:'JPG·PNG·WebP 사진만 첨부할 수 있어요.'});
        const bytes=Buffer.from(match[2],'base64');
        const valid=match[1]==='png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a':match[1]==='jpeg'?bytes.subarray(0,3).toString('hex')==='ffd8ff':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
        if(!valid||bytes.length>1048576)return res.status(400).json({error:'1MB 이하의 올바른 사진을 선택해 주세요.'});
      }
      if(!(await catalog()).items.some(x=>x.id===p.placeId))return res.status(400).json({error:'등록된 가게를 선택해 주세요.'});
      if(!req.params.id&&store.posts().length>=1000)return res.status(409).json({error:'소식 저장 공간이 가득 찼어요.'});
      const post=store.savePost(p,req.contributor,req.params.id);
      if(!post)return res.status(403).json({error:'이 브라우저에서 작성한 소식만 수정할 수 있어요.'});
      res.json({post});
    }catch{res.status(502).json({error:'소식을 저장하지 못했어요. 다시 시도해 주세요.'});}
  }
  router.post('/posts',save);router.put('/posts/:id',save);
  router.delete('/posts/:id',(req,res)=>{if(!store.removePost(req.params.id,req.contributor))return res.status(403).json({error:'이 브라우저에서 작성한 소식만 삭제할 수 있어요.'});res.json({ok:true});});
  return router;
}
