import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATA_STORE='file';
const {RULES,applyEarn,applyFeed,applyRevoke,levelOf,publicReward}=await import('../server/services/rewardStore.js');

test('rice is capped per day, once per place, and fed to level up the cat',()=>{
  let {row,earned}=applyEarn(undefined,{amount:RULES.info,reason:'정보',key:'info:a',refKey:'x'});
  assert.equal(earned,30);
  assert.equal(applyEarn(row,{amount:RULES.info,reason:'정보',key:'info:a'}).earned,0,'같은 가게는 하루 1번');
  for(const k of ['b','c','d'])({row}=applyEarn(row,{amount:RULES.info,reason:'정보',key:'info:'+k}));
  assert.equal(row.bap,RULES.dailyCap,'하루 최대');
  assert.equal(applyEarn(row,{amount:RULES.post,reason:'소식'}).earned,0);
  ({row}=applyFeed(row));({row}=applyFeed(row));
  assert.equal(row.xp,100);assert.equal(levelOf(row.xp).name,'골목냥');assert.equal(publicReward(row).nextXp,300);
  assert.throws(()=>applyFeed(row),/밥알이/);
});

test('rice from a deleted post is taken back',()=>{
  let {row}=applyEarn(undefined,{amount:20,reason:'사진 소식',refKey:'post:1'});
  row=applyRevoke(row,'post:1');assert.equal(row.bap,0);
  assert.equal(applyRevoke(row,'post:1'),null,'두 번 회수하지 않음');
});

test('reward API: check in, feed, unlock and use a shop coupon once',async()=>{
  const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path'),express=(await import('express')).default;
  const {createRewardRouter}=await import('../server/rewardRoutes.js');
  const {createFileRewardStore}=await import('../server/services/rewardStore.js');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-reward-'));
  const store=createFileRewardStore(path.join(dir,'rewards.json'));
  const coupons={allCoupons:async()=>[{id:'c1',placeId:'p1',title:'음료 사이즈업',minLevel:2}]};
  const app=express();app.use(express.json());
  app.use('/r',createRewardRouter({store,coupons,places:async()=>({items:[{id:'p1',name:'슬슬커피'}]}),auth:[(req,res,next)=>{req.user={id:'u1'};next();}]}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const call=async(route,method='GET')=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/r${route}`,{method});return {status:r.status,...await r.json()};};
  try{
    let d=await call('/');assert.equal(d.level,1);assert.equal(d.coupons[0].unlocked,false);
    d=await call('/checkin','POST');assert.equal(d.earned,5);assert.equal((await call('/checkin','POST')).earned,0);
    assert.equal((await call('/feed','POST')).status,400,'밥알 부족');
    await store.update('u1',row=>({row:{...row,bap:100}}));
    await call('/feed','POST');d=await call('/feed','POST');assert.equal(d.levelUp,true);assert.equal(d.level,2);assert.equal(d.coupons[0].unlocked,true);
    d=await call('/coupons/c1/use','POST');assert.equal(d.coupons[0].used,true);
    assert.equal((await call('/coupons/c1/use','POST')).status,409);
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
