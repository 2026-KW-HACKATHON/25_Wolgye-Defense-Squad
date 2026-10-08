import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import {createGroupRouter} from '../server/groupRoutes.js';
import {createGroupBridge} from '../server/discord/groupBridge.js';
import {commands,groupMessage,conditionModal,decisionAnnouncement} from '../server/discord/presentation.js';

test('Discord and web share groups, isolate users, restore membership, invalidate stale ballots',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-discord-'));
  const app=express();app.use(express.json());app.use('/api/groups',createGroupRouter({file:path.join(dir,'groups.json'),recommend:async()=>({items:[{id:'a',name:'테스트 가게',kind:'한식',reason:'업종 근거'}],answer:'확인 후보',notice:'확인 필요'})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}`,file=path.join(dir,'discord.json');
  const bot=createGroupBridge({base,file});
  try{
    let g=await bot.create('guild','alice','점심','앨리스');const code=g.id;
    assert.equal(g.members.length,1);assert.ok(!JSON.stringify(g).includes('token'));
    await assert.rejects(()=>bot.get('guild','eve',code));
    g=await bot.join('guild','bob',code,'밥');assert.equal(g.members.length,2);
    g=await bot.join('guild','bob',code,'밥');assert.equal(g.members.length,2);
    assert.equal((await createGroupBridge({base,file}).join('guild','bob',code,'밥')).members.length,2);
    await assert.rejects(()=>bot.recommend('guild','alice',code),/모든 참가자/);
    await bot.condition('guild','alice',code,'한식');await bot.condition('guild','bob',code,'만원 이하');
    await assert.rejects(()=>bot.recommend('guild','bob',code),/모임장/);
    g=await bot.recommend('guild','alice',code);const revision=g.revision;
    await bot.vote('guild','alice',code,['a'],revision);g=await bot.vote('guild','bob',code,['a'],revision);assert.equal(Object.values(g.votes).length,2);
    const card=groupMessage(g,'https://example.com');assert.ok(!JSON.stringify(card).includes('token'));assert.equal(card.components[1].components[0].max_values,1);assert.deepEqual(card.allowedMentions,{parse:[]});const webButton=card.components.flatMap(row=>row.components).find(c=>c.label==='웹에서 열기');assert.ok(webButton);assert.equal(new URL(webButton.url).searchParams.get('group'),code);
    const web=await fetch(base+'/api/groups/'+code+'/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:'웹 사용자'})});assert.equal(web.status,200);
    g=await bot.get('guild','alice',code);assert.equal(g.members.length,3);assert.equal(g.candidates,null);
    await assert.rejects(()=>bot.vote('guild','bob',code,['a'],revision),/후보가 바뀌/);
    await assert.rejects(()=>bot.get('other-guild','alice',code));
        assert.equal(conditionModal(code).components[0].components[0].max_length,240);assert.equal(commands[0].options.length,5);
    assert.throws(()=>createGroupBridge({base:'https://example.com',file}),/로컬 서버/);
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});

test('Discord card hides tallies until everyone submits, then the owner decides',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-discord-vote-'));
  const app=express();app.use(express.json());app.use('/api/groups',createGroupRouter({file:path.join(dir,'groups.json'),recommend:async()=>({items:[{id:'a',name:'국수집',kind:'국수',placeUrl:'https://place.map.kakao.com/1'},{id:'b',name:'분식집',kind:'분식'}],answer:'',notice:''})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const bot=createGroupBridge({base:`http://127.0.0.1:${server.address().port}`,file:path.join(dir,'discord.json')});
  try{
    let g=await bot.create('guild','alice','점심','앨리스');const code=g.id;
    await bot.join('guild','bob',code,'밥');await bot.condition('guild','alice',code,'국수');await bot.condition('guild','bob',code,'분식');
    g=await bot.recommend('guild','alice',code);
    await bot.vote('guild','alice',code,['a'],g.revision);g=await bot.submit('guild','alice',code,g.revision);
    const hidden=groupMessage(g,'',await bot.me('guild','alice',code));
    assert.ok(!hidden.embeds[0].fields.some(f=>/표$/.test(f.name)));assert.ok(JSON.stringify(hidden).includes('투표 완료됨'));
    await bot.vote('guild','bob',code,['a','b'],g.revision);g=await bot.submit('guild','bob',code,g.revision);
    const shown=groupMessage(g);assert.ok(shown.embeds[0].fields.some(f=>f.name.endsWith('2표')));
    assert.ok(JSON.stringify(shown).includes('wg:finalize:'+code+':majority'));
    await assert.rejects(()=>bot.finalize('guild','bob',code,'majority'),/모임장/);
    g=await bot.finalize('guild','alice',code,'majority');assert.equal(g.decision.placeId,'a');
    const done=groupMessage(g);assert.ok(done.embeds[0].fields[0].name.includes('국수집'));assert.ok(JSON.stringify(done).includes('카카오맵에서 길 찾기'));
    assert.ok(decisionAnnouncement(g).embeds[0].title.includes('국수집'));
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
