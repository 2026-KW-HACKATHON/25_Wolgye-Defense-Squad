import express from 'express';
import {randomBytes,randomInt,randomUUID} from 'node:crypto';
import {chooseFinalWithAI,voteSummary} from './services/groupDecision.js';
import {getCommunityPlaces} from './services/communityService.js';
import {recommendGroup} from './services/groupRecommend.js';
import {createFileGroupStore,defaultGroupStore} from './services/groupStore.js';

export function createGroupRouter({file,store,recommend=members=>recommendGroup(members,{getPlaces:getCommunityPlaces}),chooseAI=chooseFinalWithAI}={}) {
  store=store||(file?createFileGroupStore(file):defaultGroupStore());
  const router=express.Router(),working=new Set(),finalizing=new Set();
  // viewer: 요청(req) 또는 참가자 id. 비밀 조건은 본인에게만 내용이 보이고, 다른 사람에게는 '비밀 조건'으로 가린다(추천에는 그대로 쓰임).
  const view=({recommendLease,...g},viewer)=>{
    const {voted,...voting}=voteSummary(g);
    const token=typeof viewer==='object'?viewer?.get?.('Authorization')?.replace(/^Bearer /,''):null;
    const me=typeof viewer==='string'?viewer:g.members.find(m=>m.token&&m.token===token)?.id;
    const hidden=new Set(g.members.filter(m=>m.conditionPrivate&&m.id!==me).map(m=>m.name));
    const mask=c=>({kind:c.kind,status:c.status,statusLabel:c.statusLabel,label:'비밀 조건',evidence:''});
    return {...g,voting,
      members:g.members.map(({token,...m})=>({...m,private:!!m.conditionPrivate,condition:m.condition&&m.conditionPrivate&&m.id!==me?'비밀 조건':m.condition})),
      understood:g.understood?.map(u=>hidden.has(u.name)?{name:u.name,private:true,wants:[],excludes:[],budget:null,hour:null}:u)??g.understood,
      candidates:g.candidates?.map(p=>p.memberChecks?{...p,memberChecks:p.memberChecks.map(mc=>hidden.has(mc.name)?{...mc,private:true,checks:mc.checks.map(mask)}:mc)}:p)??g.candidates};
  };
  const member=name=>({id:randomBytes(8).toString('hex'),token:randomBytes(24).toString('hex'),name,condition:''});
  const valid=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;
  const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
  const clear=g=>{g.revision++;g.candidates=null;g.votes={};g.submittedVotes={};g.decision=null;g.answer='';g.notice='';g.understood=null;g.recommendLease=null;};
  const authorize=(g,req)=>{if(!g)fail(404,'모임을 찾을 수 없어요.');const token=req.get('Authorization')?.replace(/^Bearer /,'');const m=g.members.find(x=>x.token===token);if(!m)fail(403,'초대 코드로 먼저 참여해 주세요.');return m;};
  const run=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){res.status(e.status||503).json({error:e.status?e.message:'모임 저장소 또는 추천에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'});}};
  router.post('/',run(async(req,res)=>{
    if(!valid(req.body.name,40)||!valid(req.body.nickname,30))fail(400,'모임 이름과 닉네임을 입력해 주세요.');
    let id;do{id=randomBytes(6).toString('hex').toUpperCase();}while(await store.get(id));
    const m=member(req.body.nickname.trim()),g={id,name:req.body.name.trim(),ownerId:m.id,members:[m],revision:0,candidates:null,votes:{},submittedVotes:{},decision:null,answer:'',notice:''};
    await store.create(g);res.status(201).json({group:view(g,m.id),token:m.token,memberId:m.id});
  }));
  router.param('id',(req,res,next,id)=>{req.params.id=id.toUpperCase();next();});
  router.post('/:id/join',run(async(req,res)=>{
    if(!valid(req.body.nickname,30))fail(400,'닉네임을 입력해 주세요.');
    const result=await store.mutate(req.params.id,g=>{if(g.members.length>=12)fail(409,'모임은 최대 12명까지 참여할 수 있어요.');const m=member(req.body.nickname.trim());g.members.push(m);clear(g);return {group:view(g,m.id),token:m.token,memberId:m.id};});res.json(result);
  }));
  router.get('/:id',run(async(req,res)=>{const g=await store.get(req.params.id);authorize(g,req);res.json({group:view(g,req)});}));
  router.put('/:id/condition',run(async(req,res)=>{
    if(!valid(req.body.condition,240))fail(400,'조건은 1~240자로 입력해 주세요.');
    const g=await store.mutate(req.params.id,g=>{const m=authorize(g,req);m.condition=req.body.condition.trim();m.conditionPrivate=req.body.private===true;clear(g);return view(g,req);});res.json({group:g});
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
      const group=await store.mutate(req.params.id,g=>{if(g.revision!==snapshot.revision||g.recommendLease!==lease)fail(409,'참가자나 조건이 바뀌었어요. 다시 추천해 주세요.');g.candidates=result.items;g.answer=result.answer;g.notice=result.notice;g.understood=result.understood||null;g.votes={};g.submittedVotes={};g.decision=null;g.revision++;g.recommendLease=null;return view(g,req);});res.json({group});
    }finally{
      working.delete(req.params.id);
      try{await store.mutate(req.params.id,g=>{if(g.recommendLease===lease)g.recommendLease=null;});}catch{}
    }
  }));
  router.put('/:id/vote',run(async(req,res)=>{
    const group=await store.mutate(req.params.id,g=>{const m=authorize(g,req),ids=req.body.ids;if(req.body.revision!==g.revision)fail(409,'후보가 바뀌었어요. 새로 확인해 주세요.');if(g.decision)fail(409,'이미 최종 가게가 결정됐어요.');if(voteSummary(g).allSubmitted)fail(409,'투표 결과가 공개됐어요. 모임장이 재투표를 시작해야 바꿀 수 있어요.');if(!Array.isArray(ids)||!g.candidates||ids.some(id=>!g.candidates.some(p=>p.id===id)))fail(400,'현재 후보 중에서 선택해 주세요.');
      g.votes[m.id]=[...new Set(ids)];g.submittedVotes||={};
      // 혼자인 모임은 고르는 즉시 완료, 여럿이면 선택을 바꿀 때마다 다시 제출해야 한다.
      if(g.members.length===1&&g.votes[m.id].length)g.submittedVotes[m.id]=true;else delete g.submittedVotes[m.id];
      return view(g,req);});res.json({group});
  }));
  router.post('/:id/vote/submit',run(async(req,res)=>{
    const group=await store.mutate(req.params.id,g=>{const m=authorize(g,req);if(g.decision||!g.candidates?.length)fail(409,'현재 투표할 후보가 없어요.');if(req.body?.revision!==g.revision)fail(409,'후보가 바뀌었어요. 새로 확인해 주세요.');if(!g.votes?.[m.id]?.length)fail(400,'갈 수 있는 가게를 하나 이상 선택해 주세요.');g.submittedVotes||={};g.submittedVotes[m.id]=true;return view(g,req);});res.json({group});
  }));
  router.post('/:id/revote',run(async(req,res)=>{
    const group=await store.mutate(req.params.id,g=>{const m=authorize(g,req);if(m.id!==g.ownerId)fail(403,'모임장만 재투표를 시작할 수 있어요.');if(!voteSummary(g).allSubmitted||g.decision)fail(409,'지금은 재투표를 시작할 수 없어요.');g.votes={};g.submittedVotes={};g.revision++;return view(g,req);});res.json({group});
  }));
  // 최종 결정: 다수결, 룰렛(투표받은 가게 중 무작위), AI(투표받은 가게 중 하나)
  router.post('/:id/finalize',run(async(req,res)=>{
    const mode=req.body?.mode;
    if(!['majority','roulette','ai'].includes(mode))fail(400,'결정 방식을 선택해 주세요.');
    if(mode==='ai'&&finalizing.has(req.params.id))fail(429,'AI가 최종 후보를 고르고 있어요.');
    const snapshot=structuredClone(await store.get(req.params.id));
    const m=authorize(snapshot,req),summary=voteSummary(snapshot);
    if(m.id!==snapshot.ownerId)fail(403,'모임장만 최종 가게를 결정할 수 있어요.');
    if(snapshot.decision)fail(409,'이미 최종 가게가 결정됐어요.');
    if(!summary.allSubmitted||!summary.voted.length)fail(409,'모든 참가자가 투표를 완료해야 해요.');
    if(mode==='majority'&&!summary.majorityId)fail(409,'과반수로 결정된 가게가 없어요.');
    let selected;
    try{
      if(mode==='majority')selected={id:summary.majorityId,reason:`${snapshot.members.length}명 중 ${summary.counts[summary.majorityId]}명이 고른 과반수 결과예요.`};
      if(mode==='roulette')selected={id:summary.voted[randomInt(summary.voted.length)].id,reason:'투표를 받은 가게들 중에서 무작위로 추첨했어요.'};
      if(mode==='ai'){finalizing.add(req.params.id);selected=await chooseAI(snapshot,summary.voted);}
    }finally{finalizing.delete(req.params.id);}
    const group=await store.mutate(req.params.id,g=>{if(g.revision!==snapshot.revision||g.decision||!voteSummary(g).allSubmitted)fail(409,'투표 상태가 바뀌었어요. 결과를 다시 확인해 주세요.');if(!summary.voted.some(p=>p.id===selected.id))fail(502,'투표된 후보 중에서 최종 가게를 고르지 못했어요.');g.decision={placeId:selected.id,mode,reason:selected.reason,createdAt:new Date().toISOString()};return view(g,req);});
    res.json({group});
  }));
  return router;
}
