import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {recommendCommunity} from './services/communityService.js';

export function createGroupRouter({file=path.resolve('.local-data/groups.json'),recommend=recommendCommunity}={}) {
  const router=express.Router();
  const groups=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  const working=new Set();
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(groups));fs.renameSync(file+'.tmp',file);};
  const view=g=>({...g,members:g.members.map(({token,...m})=>m)});
  const member=name=>({id:randomBytes(8).toString('hex'),token:randomBytes(24).toString('hex'),name,condition:''});
  const valid=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;
  router.post('/',(req,res)=>{
    if(!valid(req.body.name,40)||!valid(req.body.nickname,30))return res.status(400).json({error:'모임 이름과 닉네임을 입력해 주세요.'});
    if(Object.keys(groups).length>=1000)return res.status(429).json({error:'모임 저장 한도에 도달했어요.'});
    let id;do{id=randomBytes(6).toString('hex').toUpperCase();}while(groups[id]);
    const m=member(req.body.nickname.trim());
    const g={id,name:req.body.name.trim(),ownerId:m.id,members:[m],revision:0,candidates:null,votes:{},answer:'',notice:''};
    groups[id]=g;persist();res.status(201).json({group:view(g),token:m.token,memberId:m.id});
  });
  router.post('/:id/join',(req,res)=>{
    const g=groups[req.params.id.toUpperCase()];if(!g)return res.status(404).json({error:'초대 코드를 찾을 수 없어요.'});
    if(!valid(req.body.nickname,30))return res.status(400).json({error:'닉네임을 입력해 주세요.'});
    if(g.members.length>=12)return res.status(409).json({error:'모임은 최대 12명까지 참여할 수 있어요.'});
    const m=member(req.body.nickname.trim());g.members.push(m);g.revision++;g.candidates=null;g.votes={};g.answer='';persist();res.json({group:view(g),token:m.token,memberId:m.id});
  });
  router.use('/:id',(req,res,next)=>{
    const g=groups[req.params.id.toUpperCase()];if(!g)return res.status(404).json({error:'모임을 찾을 수 없어요.'});
    const token=req.get('Authorization')?.replace(/^Bearer /,'');const m=g.members.find(x=>x.token===token);
    if(!m)return res.status(403).json({error:'초대 코드로 먼저 참여해 주세요.'});
    req.group=g;req.member=m;next();
  });
  router.get('/:id',(req,res)=>res.json({group:view(req.group)}));
  router.put('/:id/condition',(req,res)=>{
    if(!valid(req.body.condition,240))return res.status(400).json({error:'조건은 1~240자로 입력해 주세요.'});
    const g=req.group;req.member.condition=req.body.condition.trim();g.revision++;g.candidates=null;g.answer='';g.votes={};persist();res.json({group:view(g)});
  });
  router.post('/:id/recommend',async(req,res)=>{
    const g=req.group;
    if(req.member.id!==g.ownerId)return res.status(403).json({error:'모임장이 후보를 만들 수 있어요.'});
    if(!g.members.every(m=>m.condition))return res.status(409).json({error:'모든 참가자가 조건을 저장해야 해요.'});
    if(working.size>=2||working.has(g.id))return res.status(429).json({error:'후보를 찾고 있어요. 잠시 후 다시 시도해 주세요.'});
    if(g.lastRequest&&Date.now()-g.lastRequest<15000)return res.status(429).json({error:'15초 후 다시 시도해 주세요.'});
    g.lastRequest=Date.now();const revision=g.revision;working.add(g.id);
    try {
      const result=await recommend(g.members.map((m,i)=>`참가자 ${i+1}: ${m.condition}`).join('\n'));
      if(g.revision!==revision)return res.status(409).json({error:'참가자나 조건이 바뀌었어요. 다시 추천해 주세요.'});
      g.candidates=result.items;g.answer=result.answer;g.notice=result.notice;g.votes={};g.revision++;persist();res.json({group:view(g)});
    }catch(e){res.status(502).json({error:e.name==='TimeoutError'?'추천 시간이 초과됐어요. 다시 시도해 주세요.':e.message});}finally{working.delete(g.id);}
  });
  router.put('/:id/vote',(req,res)=>{
    const g=req.group,ids=req.body.ids;
    if(req.body.revision!==g.revision)return res.status(409).json({error:'후보가 바뀌었어요. 새로 확인해 주세요.'});
    if(!Array.isArray(ids)||!g.candidates||ids.some(id=>!g.candidates.some(p=>p.id===id)))return res.status(400).json({error:'현재 후보 중에서 선택해 주세요.'});
    g.votes[req.member.id]=[...new Set(ids)];persist();res.json({group:view(g)});
  });
  return router;
}
