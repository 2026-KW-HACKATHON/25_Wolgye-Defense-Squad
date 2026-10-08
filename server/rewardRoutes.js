import express from 'express';
import {authenticate,requireUser} from './auth.js';
import {RULES,applyEarn,applyFeed,levelOf,publicReward,rewardStore} from './services/rewardStore.js';
import {ownerMarketingStore} from './services/ownerMarketingStore.js';
import {getCommunityPlaces} from './services/communityService.js';

// 다른 기능(소식·가게 정보)에서 밥알을 줄 때 쓰는 함수. amount는 RULES의 이름 또는 숫자.
export async function earn(req,{amount,reason,key,refKey},store=rewardStore){
  if(!req.user)return 0;
  const value=typeof amount==='number'?amount:RULES[amount];
  const out=await store.update(req.user.id,row=>applyEarn(row,{amount:value,reason,key,refKey}));
  return out.earned;
}

export function createRewardRouter({store=rewardStore,coupons=ownerMarketingStore,places=getCommunityPlaces,auth=[authenticate,requireUser]}={}){
  const router=express.Router();
  router.use(...auth);
  const fail=(res,e)=>res.status(e.status||503).json({error:e.status?e.message:'리워드 정보를 불러오지 못했어요.'});
  async function couponList(row){
    const level=levelOf(row.xp||0).level,catalog=(await places()).items;
    return (await coupons.allCoupons()).map(c=>({id:c.id,title:c.title,minLevel:c.minLevel,demo:!!c.demo,placeId:c.placeId,placeName:catalog.find(p=>p.id===c.placeId)?.name||'동네 가게',unlocked:level>=c.minLevel,used:(row.usedCoupons||[]).includes(c.id)})).sort((a,b)=>a.minLevel-b.minLevel);
  }
  const reply=async(res,row,extra={})=>res.json({...publicReward(row),coupons:await couponList(row),...extra});
  router.get('/',async(req,res)=>{try{await reply(res,await store.get(req.user.id));}catch(e){fail(res,e);}});
  router.post('/checkin',async(req,res)=>{try{const out=await store.update(req.user.id,row=>applyEarn(row,{amount:RULES.checkin,reason:'출석',key:'checkin'}));await reply(res,out.row,{earned:out.earned});}catch(e){fail(res,e);}});
  router.post('/feed',async(req,res)=>{try{const out=await store.update(req.user.id,applyFeed);await reply(res,out.row,{levelUp:out.levelUp});}catch(e){fail(res,e);}});
  router.post('/coupons/:id/use',async(req,res)=>{try{
    const row=await store.get(req.user.id),list=await couponList(row),c=list.find(x=>x.id===req.params.id);
    if(!c)return res.status(404).json({error:'쿠폰을 찾지 못했어요.'});
    if(!c.unlocked)return res.status(403).json({error:`Lv.${c.minLevel}부터 쓸 수 있어요.`});
    if(c.used)return res.status(409).json({error:'이미 사용한 쿠폰이에요.'});
    const out=await store.update(req.user.id,r=>({row:{...r,usedCoupons:[...(r.usedCoupons||[]),c.id]}}));
    await reply(res,out.row,{usedCoupon:c});
  }catch(e){fail(res,e);}});
  return router;
}
