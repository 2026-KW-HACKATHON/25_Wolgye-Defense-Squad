import express from 'express';
import {getCommunityPlaces,recommendCommunity} from './services/communityService.js';
export const communityRoutes=express.Router();
let active=0, windowStart=0, count=0;
communityRoutes.get('/places',async(req,res)=>{
  try{res.json(await getCommunityPlaces());}catch(e){res.status(502).json({error:e.message});}
});
communityRoutes.post('/recommend',async(req,res)=>{
  const message=req.body?.message;
  if(typeof message!=='string'||!message.trim()||message.length>3000) return res.status(400).json({error:'조건을 1~3000자 사이로 입력해 주세요.'});
  if(Date.now()-windowStart>60000){windowStart=Date.now();count=0;}
  if(active>=2||count>=12)return res.status(429).json({error:'현재 요청이 많아요. 잠시 후 다시 시도해 주세요.'});
  active++;count++;
  try{res.json(await recommendCommunity(message.trim()));}catch(e){res.status(502).json({error:e.name==='TimeoutError'?'답변이 지연되고 있어요. 다시 시도해 주세요.':e.message});}finally{active--;}
});
