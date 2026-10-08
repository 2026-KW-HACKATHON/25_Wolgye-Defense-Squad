import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('health, validation, restaurant search, chat and share preparation', {timeout:20000}, async () => {
  const server = spawn(process.execPath, ['--import','./tests/mock-provider.js','server/index.js'], {
    env:{...process.env,DATA_STORE:'file',PORT:'0',KAKAO_REST_API_KEY:'test-only',OPENROUTER_API_KEY:'test-only'},stdio:['ignore','pipe','pipe']
  });
  try {
    const port = await new Promise((resolve,reject) => {
      let output = '';
      const timer = setTimeout(()=>reject(new Error('Server startup timeout')),8000);
      server.once('error',error=>{clearTimeout(timer);reject(error);});
      server.once('exit',code=>{clearTimeout(timer);reject(new Error('Early exit '+code));});
      server.stdout.on('data',chunk=>{output+=chunk; const match=output.match(/localhost:(\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
    });
    const base='http://localhost:'+port;
    const post=(path,body)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await fetch(base+'/api/health')).status,200);
    assert.equal((await post('/api/community/recommend',{message:''})).status,400);
    assert.equal((await post('/api/chat',{message:42})).status,400);
    const catalogResponse=await fetch(base+'/api/restaurants?q=한식');
    assert.equal(catalogResponse.status,200);
    const catalog=await catalogResponse.json();
    assert.equal(catalog[0].id,'kakao-test-1');
    const chatResponse=await post('/api/chat',{message:'2명이서 1만원 공강 60분 한식'});
    assert.equal(chatResponse.status,200);
    const chat=await chatResponse.json();
    assert.equal(chat.extracted.budget,10000);
    assert.equal(chat.restaurants.length,1);
    const shareResponse=await post('/api/share/prepare',{restaurantId:chat.restaurants[0].id});
    assert.equal(shareResponse.status,200);
    assert.equal((await shareResponse.json()).restaurant.name,'테스트 식당');
  } finally {
    if(server.exitCode===null){const exited=once(server,'exit');server.kill();await exited;}
  }
});
