import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import {createGroupRouter} from '../server/groupRoutes.js';
import {createGroupBridge} from '../server/discord/groupBridge.js';
import {commands,groupMessage,conditionModal} from '../server/discord/presentation.js';

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
    const card=groupMessage(g,'https://example.com');assert.ok(!JSON.stringify(card).includes('token'));assert.equal(card.components[1].components[0].max_values,1);assert.deepEqual(card.allowedMentions,{parse:[]});assert.equal(card.components[2].components[0].label,'웹에서 열기');assert.equal(new URL(card.components[2].components[0].url).searchParams.get('group'),code);
    const web=await fetch(base+'/api/groups/'+code+'/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:'웹 사용자'})});assert.equal(web.status,200);
    g=await bot.get('guild','alice',code);assert.equal(g.members.length,3);assert.equal(g.candidates,null);
    await assert.rejects(()=>bot.vote('guild','bob',code,['a'],revision),/후보가 바뀌/);
    await assert.rejects(()=>bot.get('other-guild','alice',code));
    assert.equal(conditionModal(code).components[0].components[0].max_length,240);assert.equal(commands[0].options.length,5);
    assert.throws(()=>createGroupBridge({base:'https://example.com',file}),/로컬 서버/);
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
