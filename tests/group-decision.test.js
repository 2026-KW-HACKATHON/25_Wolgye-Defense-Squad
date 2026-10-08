import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {createGroupRouter} from '../server/groupRoutes.js';
import {chooseFinalWithAI,voteSummary} from '../server/services/groupDecision.js';

test('majority needs a unique top place chosen by more than half the group',()=>{
  const group={members:[{id:'a'},{id:'b'},{id:'c'}],candidates:[{id:'p1',name:'가'},{id:'p2',name:'나'}],votes:{a:['p1'],b:['p1'],c:['p2']},submittedVotes:{a:true,b:true,c:true}};
  assert.equal(voteSummary(group).majorityId,'p1');
  group.votes={a:['p1','p2'],b:['p1','p2'],c:['p2']};
  assert.equal(voteSummary(group).majorityId,'p2');
  group.votes={a:['p1','p2'],b:['p1','p2'],c:['p1','p2']};
  assert.equal(voteSummary(group).majorityId,null);
});

test('AI final choice is restricted to voted candidate IDs',async()=>{
  const previous=process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY='test-key';
  const group={members:[{condition:'4명이 조용히 먹을 곳'}]};
  const candidates=[{id:'p1',name:'첫 번째',kind:'한식'},{id:'p2',name:'두 번째',kind:'중식'}];
  try{
    const choose=content=>chooseFinalWithAI(group,candidates,{fetcher:async(_url,options)=>{
      const body=JSON.parse(options.body);
      assert.equal(body.model,process.env.GROUP_FINAL_MODEL||process.env.OPENROUTER_MODEL||'nvidia/nemotron-3-ultra-550b-a55b:free');
      const request=JSON.parse(body.messages[1].content);
      assert.deepEqual(request.conditions,['4명이 조용히 먹을 곳']);
      assert.ok(Array.isArray(request.places[0].ownerKeywords));
      assert.ok(Array.isArray(request.places[0].neighborReports));
      return {ok:true,json:async()=>({choices:[{message:{content}}]})};
    }});
    assert.equal((await choose('{"id":"p2","reason":"업종과 모임 조건을 비교했어요."}')).id,'p2');
    await assert.rejects(choose('{"id":"invented","reason":"좋아요."}'),/투표된 후보/);
  }finally{
    if(previous===undefined)delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY=previous;
  }
});

test('a single member sees results immediately after choosing a place',async()=>{
  const dir=fs.mkdtempSync(path.join(process.cwd(),'.group-single-vote-test-'));
  const file=path.join(dir,'groups.json');
  const app=express();app.use(express.json());app.use('/groups',createGroupRouter({file,recommend:async()=>({items:[{id:'p1',name:'가게 하나'}],answer:'',notice:'확인 필요'})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/groups`;
  const api=async(url,method='GET',body,token)=>{const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return await response.json();};
  try{
    const owner=await api('/','POST',{name:'점심',nickname:'가'}),id=owner.group.id;
    await api('/'+id+'/condition','PUT',{condition:'한식'},owner.token);
    const rec=await api('/'+id+'/recommend','POST',{},owner.token);
    const vote=await api('/'+id+'/vote','PUT',{ids:['p1'],revision:rec.group.revision},owner.token);
    assert.equal(vote.group.voting.submittedCount,1);
    assert.equal(vote.group.voting.allSubmitted,true);
    assert.equal(vote.group.voting.majorityId,'p1');
  }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});

test('votes finish before results and the chosen outcome persists',async()=>{
  const dir=fs.mkdtempSync(path.join(process.cwd(),'.group-decision-test-'));
  const file=path.join(dir,'groups.json');
  const app=express();app.use(express.json());app.use('/groups',createGroupRouter({file,recommend:async()=>({items:[{id:'p1',name:'가게 하나',placeUrl:'https://place.map.kakao.com/1'},{id:'p2',name:'가게 둘'}],answer:'',notice:'확인 필요'}),chooseAI:async()=>({id:'p2',reason:'입력한 조건과 제보를 비교한 결과입니다.'})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/groups`;
  const api=async(url,method='GET',body,token)=>{const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,...await response.json()};};
  try{
    const owner=await api('/','POST',{name:'점심',nickname:'가'}),id=owner.group.id;
    const friend=await api('/'+id+'/join','POST',{nickname:'나'});
    await api('/'+id+'/condition','PUT',{condition:'한식'},owner.token);
    await api('/'+id+'/condition','PUT',{condition:'1만원 이하'},friend.token);
    const rec=await api('/'+id+'/recommend','POST',{},owner.token),revision=rec.group.revision;
    await api('/'+id+'/vote','PUT',{ids:['p1'],revision},owner.token);
    await api('/'+id+'/vote','PUT',{ids:['p1'],revision},friend.token);
    assert.equal((await api('/'+id+'/finalize','POST',{mode:'majority'},owner.token)).status,409);
    await api('/'+id+'/vote/submit','POST',{revision},owner.token);
    const submitted=await api('/'+id+'/vote/submit','POST',{revision},friend.token);
    assert.equal(submitted.group.voting.allSubmitted,true);
    assert.equal(submitted.group.voting.majorityId,'p1');
    assert.equal((await api('/'+id+'/vote','PUT',{ids:['p2'],revision},friend.token)).status,409);
    const final=await api('/'+id+'/finalize','POST',{mode:'majority'},owner.token);
    assert.equal(final.group.decision.placeId,'p1');
    assert.equal((await api('/'+id+'/vote','PUT',{ids:['p2'],revision},friend.token)).status,409);
    const reloaded=JSON.parse(fs.readFileSync(file,'utf8'))[id];
    assert.equal(reloaded.decision.placeId,'p1');
    const second=await api('/','POST',{name:'저녁',nickname:'다'}),secondId=second.group.id;
    const secondFriend=await api('/'+secondId+'/join','POST',{nickname:'라'});
    await api('/'+secondId+'/condition','PUT',{condition:'조용한 곳'},second.token);
    await api('/'+secondId+'/condition','PUT',{condition:'혼밥 가능'},secondFriend.token);
    let round=await api('/'+secondId+'/recommend','POST',{},second.token);
    for(const [member,ids] of [[second,['p1']],[secondFriend,['p2']]])await api('/'+secondId+'/vote','PUT',{ids,revision:round.group.revision},member.token);
    for(const member of [second,secondFriend])await api('/'+secondId+'/vote/submit','POST',{revision:round.group.revision},member.token);
    assert.equal((await api('/'+secondId,'GET',undefined,second.token)).group.voting.majorityId,null);
    assert.equal((await api('/'+secondId+'/finalize','POST',{mode:'majority'},second.token)).status,409);
    const restarted=await api('/'+secondId+'/revote','POST',{},second.token);
    assert.deepEqual(restarted.group.votes,{});
    round=restarted;
    for(const [member,ids] of [[second,['p1']],[secondFriend,['p2']]])await api('/'+secondId+'/vote','PUT',{ids,revision:round.group.revision},member.token);
    for(const member of [second,secondFriend])await api('/'+secondId+'/vote/submit','POST',{revision:round.group.revision},member.token);
    const ai=await api('/'+secondId+'/finalize','POST',{mode:'ai'},second.token);
    assert.equal(ai.group.decision.placeId,'p2');
  }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
