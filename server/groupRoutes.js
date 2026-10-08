import express from 'express';
import {randomBytes,randomUUID} from 'node:crypto';
import {getCommunityPlaces} from './services/communityService.js';
import {recommendGroup} from './services/groupRecommend.js';
import {createFileGroupStore,defaultGroupStore} from './services/groupStore.js';

export function createGroupRouter({file,store,recommend=members=>recommendGroup(members,{getPlaces:getCommunityPlaces})}={}) {
  store=store||(file?createFileGroupStore(file):defaultGroupStore());
  const router=express.Router(),working=new Set();
  const view=({recommendLease,...g})=>({...g,members:g.members.map(({token,...m})=>m)});
  const member=name=>({id:randomBytes(8).toString('hex'),token:randomBytes(24).toString('hex'),name,condition:''});
  const valid=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;
  const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
  const clear=g=>{g.revision++;g.candidates=null;g.votes={};g.answer='';g.notice='';g.understood=null;g.recommendLease=null;};
  const authorize=(g,req)=>{if(!g)fail(404,'모임을 찾을 수 없어요.');const token=req.get('Authorization')?.replace(/^Bearer /,'');const m=g.members.find(x=>x.token===token);if(!m)fail(403,'초대 코드로 먼저 참여해 주세요.');return m;};
  const run=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){res.status(e.status||503).json({error:e.status?e.message:'모임 저장소 또는 추천에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'});}};
  router.post('/',run(async(req,res)=>{
    if(!valid(req.body.name,40)||!valid(req.body.nickname,30))fail(400,'모임 이름과 닉네임을 입력해 주세요.');
    let id;do{id=randomBytes(6).toString('hex').toUpperCase();}while(await store.get(id));
    const m=member(req.body.nickname.trim()),g={id,name:req.body.name.trim(),ownerId:m.id,members:[m],revision:0,candidates:null,votes:{},answer:'',notice:''};
    await store.create(g);res.status(201).json({group:view(g),token:m.token,memberId:m.id});
  }));
  router.param('id',(req,res,next,id)=>{req.params.id=id.toUpperCase();next();});
  router.post('/:id/join',run(async(req,res)=>{
    if(!valid(req.body.nickname,30))fail(400,'닉네임을 입력해 주세요.');
    const result=await store.mutate(req.params.id,g=>{if(g.members.length>=12)fail(409,'모임은 최대 12명까지 참여할 수 있어요.');const m=member(req.body.nickname.trim());g.members.push(m);clear(g);return {group:view(g),token:m.token,memberId:m.id};});res.json(result);
  }));
  router.get('/:id',run(async(req,res)=>{const g=await store.get(req.params.id);authorize(g,req);res.json({group:view(g)});}));
  router.put('/:id/condition',run(async(req,res)=>{
    if(!valid(req.body.condition,240))fail(400,'조건은 1~240자로 입력해 주세요.');
    const g=await store.mutate(req.params.id,g=>{authorize(g,req).condition=req.body.condition.trim();clear(g);return view(g);});res.json({group:g});
  }));
  router.post('/:id/recommend',run(async(req,res)=>{
    if(working.size>=2||working.has(req.params.id))fail(429,'후보를 찾고 있어요. 잠시 후 다시 시도해 주세요.');
    const lease=randomUUID();working.add(req.params.id);
    try{
      const snapshot=await store.mutate(req.params.id,g=>{
        const m=authorize(g,req);if(m.id!==g.ownerId)fail(403,'모임장이 후보를 만들 수 있어요.');
        if(!g.members.every(m=>m.condition))fail(409,'모든 참가자가 조건을 저장해야 해요.');
        if(g.recommendLease&&Date.now()-g.lastRequest<65000)fail(429,'후보를 찾고 있어요. 잠시 후 다시 시도해 주세요.');
        if(g.lastRequest&&Date.now()-g.lastRequest<15000)fail(429,'15초 후 다시 시도해 주세요.');
        g.lastRequest=Date.now();g.recommendLease=lease;return structuredClone(g);
      });
      const result=await recommend(snapshot.members.map(m=>({name:m.name,condition:m.condition})));
      const group=await store.mutate(req.params.id,g=>{if(g.revision!==snapshot.revision||g.recommendLease!==lease)fail(409,'참가자나 조건이 바뀌었어요. 다시 추천해 주세요.');g.candidates=result.items;g.answer=result.answer;g.notice=result.notice;g.understood=result.understood||null;g.votes={};g.revision++;g.recommendLease=null;return view(g);});res.json({group});
    }finally{
      working.delete(req.params.id);
      try{await store.mutate(req.params.id,g=>{if(g.recommendLease===lease)g.recommendLease=null;});}catch{}
    }
  }));
  router.put('/:id/vote',run(async(req,res)=>{
    const group=await store.mutate(req.params.id,g=>{const m=authorize(g,req),ids=req.body.ids;if(req.body.revision!==g.revision)fail(409,'후보가 바뀌었어요. 새로 확인해 주세요.');if(!Array.isArray(ids)||!g.candidates||ids.some(id=>!g.candidates.some(p=>p.id===id)))fail(400,'현재 후보 중에서 선택해 주세요.');g.votes[m.id]=[...new Set(ids)];return view(g);});res.json({group});
  }));
  return router;
}
