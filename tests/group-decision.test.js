import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// 실제 DB 대신 파일 저장을 쓰도록 먼저 설정한 뒤 불러온다.
process.env.DATA_STORE='file';
const {createGroupRouter}=await import('../server/groupRoutes.js');
const {chooseFinalWithAI,voteSummary}=await import('../server/services/groupDecision.js');

test('majority needs a unique top place chosen by more than half the group',()=>{
  const group={members:[{id:'a'},{id:'b'},{id:'c'}],candidates:[{id:'p1',name:'가'},{id:'p2',name:'나'}],votes:{a:['p1'],b:['p1'],c:['p2']},submittedVotes:{a:true,b:true,c:true}};
  assert.equal(voteSummary(group).majorityId,'p1');
  group.votes={a:['p1','p2'],b:['p1','p2'],c:['p2']};
  assert.equal(voteSummary(group).majorityId,'p2');
  group.votes={a:['p1','p2'],b:['p1','p2'],c:['p1','p2']};
  assert.equal(voteSummary(group).majorityId,null);
});

test('AI final choice only accepts a voted candidate',async()=>{
  const original=globalThis.fetch,key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test-key';
  const group={members:[{name:'가',condition:'4명이 조용히 먹을 곳'}]};
  const candidates=[{id:'p1',name:'첫 번째',kind:'한식'},{id:'p2',name:'두 번째',kind:'중식'}];
  let reply;
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
    const request=JSON.parse(JSON.parse(options.body).messages[1].content);
    assert.equal(request.conditions[0].condition,'4명이 조용히 먹을 곳');
    assert.ok(Array.isArray(request.places[0].ownerKeywords));
    return {ok:true,json:async()=>({choices:[{message:{content:reply}}]})};
  };
  try{
    reply='{"id":"p2","reason":"조건을 비교했어요."}';assert.equal((await chooseFinalWithAI(group,candidates)).id,'p2');
    reply='{"id":"invented","reason":"좋아요."}';await assert.rejects(chooseFinalWithAI(group,candidates),/투표된 후보/);
  }finally{globalThis.fetch=original;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});

test('votes are hidden until everyone submits, then the owner can finalize',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-vote-'));
  const app=express();app.use(express.json());
  app.use('/groups',createGroupRouter({file:path.join(dir,'groups.json'),recommend:async()=>({items:[{id:'p1',name:'가'},{id:'p2',name:'나'}],answer:'',notice:''}),chooseAI:async()=>({id:'p2',reason:'테스트'})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/groups`;
  const api=async(url,method='GET',body,token)=>{const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};};
  try{
    const a=await api('/','POST',{name:'점심',nickname:'가'}),id=a.group.id;const b=await api('/'+id+'/join','POST',{nickname:'나'});
    await api('/'+id+'/condition','PUT',{condition:'한식'},a.token);await api('/'+id+'/condition','PUT',{condition:'국수'},b.token);
    let g=(await api('/'+id+'/recommend','POST',{},a.token)).group;
    await api('/'+id+'/vote','PUT',{ids:['p1'],revision:g.revision},a.token);
    assert.equal((await api('/'+id+'/finalize','POST',{mode:'roulette'},a.token)).status,409);
    await api('/'+id+'/vote/submit','POST',{revision:g.revision},a.token);
    await api('/'+id+'/vote','PUT',{ids:['p1','p2'],revision:g.revision},b.token);
    g=(await api('/'+id+'/vote/submit','POST',{revision:g.revision},b.token)).group;
    assert.equal(g.voting.allSubmitted,true);assert.equal(g.voting.majorityId,'p1');
    assert.equal((await api('/'+id+'/vote','PUT',{ids:['p2'],revision:g.revision},b.token)).status,409);
    assert.equal((await api('/'+id+'/finalize','POST',{mode:'majority'},b.token)).status,403);
    g=(await api('/'+id+'/finalize','POST',{mode:'ai'},a.token)).group;
    assert.equal(g.decision.placeId,'p2');assert.equal(g.decision.mode,'ai');
    assert.equal((await api('/'+id+'/finalize','POST',{mode:'roulette'},a.token)).status,409);
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});

test('a secret condition is hidden from other members but shown to its owner',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-secret-'));
  const app=express();app.use(express.json());
  app.use('/groups',createGroupRouter({file:path.join(dir,'groups.json'),recommend:async()=>({items:[{id:'p1',name:'가',memberChecks:[{name:'나',checks:[{kind:'budget',label:'예산 10,000원',status:'met',statusLabel:'충족',evidence:'8,000원'}]}]}],understood:[{name:'나',wants:['국수'],excludes:[],budget:10000,hour:null}],answer:'',notice:''})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/groups`;
  const api=async(url,method='GET',body,token)=>{const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};};
  try{
    const a=await api('/','POST',{name:'점심',nickname:'가'}),id=a.group.id;const b=await api('/'+id+'/join','POST',{nickname:'나'});
    await api('/'+id+'/condition','PUT',{condition:'한식'},a.token);
    await api('/'+id+'/condition','PUT',{condition:'만원 이하 국수',private:true},b.token);
    let seenByA=(await api('/'+id,'GET',null,a.token)).group;
    assert.equal(seenByA.members[1].condition,'비밀 조건');assert.equal(seenByA.members[1].private,true);
    assert.equal((await api('/'+id,'GET',null,b.token)).group.members[1].condition,'만원 이하 국수');
    seenByA=(await api('/'+id+'/recommend','POST',{},a.token)).group;
    assert.equal(seenByA.understood[0].private,true);assert.deepEqual(seenByA.understood[0].wants,[]);
    assert.equal(seenByA.candidates[0].memberChecks[0].checks[0].label,'비밀 조건');
    assert.ok(!JSON.stringify(seenByA).includes('국수'));
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
