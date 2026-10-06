import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import {createCommunityStore} from '../server/services/communityStore.js';
import {createContributionRouter} from '../server/contributionRoutes.js';
import {validateRecommendation} from '../server/services/communityService.js';

test('shared places and posts validate district, duplicates, ownership, images and survive restart',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-contributions-')),file=path.join(dir,'community.json');
  const store=createCommunityStore(file),app=express();app.use(express.json({limit:'1500kb'}));
  app.use(createContributionRouter({store,catalog:async()=>({items:store.places()})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const url=`http://127.0.0.1:${server.address().port}`;
  const call=async(route,method='GET',body,token='a'.repeat(64))=>{const r=await fetch(url+route,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};};
  try{
    const place={name:'검증 전 가게',kind:'한식',address:'월계1동 테스트 위치',lat:37.6193,lng:127.0583};
    assert.equal((await call('/places','POST',{...place,lat:37.5665,lng:126.978})).status,400);
    assert.equal((await call('/places','POST',place,'bad')).status,401);
    const created=await call('/places','POST',place);assert.equal(created.status,201);assert.equal(created.place.status,'확인 전');assert.equal(created.place.ownerHash,undefined);
    assert.equal((await call('/places','POST',place)).status,409);
    const post={placeId:created.place.id,title:'메뉴판 확인',body:'오늘 본 메뉴판의 국수는 7000원',author:'이웃',type:'메뉴·가격',observedAt:'2026-01-01'};
    assert.equal((await call('/posts','POST',{...post,observedAt:'2999-01-01'})).status,400);
    assert.equal((await call('/posts','POST',{...post,image:'data:image/png;base64,YWJj'})).status,400);
    const saved=await call('/posts','POST',post);assert.equal(saved.status,200);assert.equal(saved.post.mine,true);
    const visitor=await call('/posts','GET',undefined,'b'.repeat(64));assert.equal(visitor.items[0].mine,false);assert.equal(visitor.items[0].ownerHash,undefined);
    assert.equal((await call('/posts/'+saved.post.id,'PUT',post,'b'.repeat(64))).status,403);
    assert.equal((await call('/posts/'+saved.post.id,'DELETE',undefined,'b'.repeat(64))).status,403);
    assert.equal((await call('/posts/'+saved.post.id,'PUT',{...post,body:'가격 정정'})).post.body,'가격 정정');
    assert.equal(createCommunityStore(file).posts()[0].body,'가격 정정');
    assert.equal((await call('/posts/'+saved.post.id,'DELETE')).status,200);assert.equal(store.posts().length,0);
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});

test('recommendation quotes only actual dated reports and highlights requested unknowns',()=>{
  const p={id:'1',name:'가게',kind:'한식',reports:[{id:'r',body:'국수 7000원 메뉴판을 봤어요',observedAt:'2026-10-01'}]};
  const base={summary:'만원 이하 30분',ids:['1']};
  const valid=validateRecommendation({...base,evidence:[{id:'1',reportId:'r',quote:'국수 7000원'}]},[p],'만원 이하 30분');
  assert.match(valid.items[0].reason,/2026-10-01 이웃 제보/);assert.match(valid.items[0].reason,/검증되지 않은/);assert.match(valid.items[0].checks,/가격.*시간/);
  const invalid=validateRecommendation({...base,evidence:[{id:'1',reportId:'r',quote:'예약 가능'}]},[p]);assert.ok(!invalid.items[0].reason.includes('예약 가능'));
});
