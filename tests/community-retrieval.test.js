import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveCommunity,inspectConditions,searchableRequest} from '../server/services/communityRetrieval.js';

test('retrieves a relevant older report even when newer unrelated reports exist',()=>{
  const places=[{id:'a',name:'골목집',kind:'한식',reports:[
    {id:'old',body:'조용한 방에서 대화했습니다',observedAt:'2026-09-20'},
    ...Array.from({length:5},(_,i)=>({id:String(i),body:'점심 방문 이야기',observedAt:'2026-10-06'}))
  ]},{id:'b',name:'다른집',kind:'한식',reports:[]}];
  const r=retrieveCommunity('조용한 대화',places,Date.parse('2026-10-07'));
  assert.equal(r.items[0].id,'a');
  assert.equal(r.items[0].reports[0].id,'old');
  assert.equal(r.searchedDocuments,8);
});
test('no evidence means no arbitrary fallback candidate',()=>{
  assert.equal(retrieveCommunity('주차', [{id:'a',name:'골목집',kind:'한식'}]).items.length,0);
});
test('explicit category exclusion overrides retrieval relevance',()=>{
  assert.equal(retrieveCommunity('카페 제외', [{id:'a',name:'카페',kind:'카페'}]).items.length,0);
});
test('unverified low price and quick service reports never satisfy hard constraints',()=>{
  const checks=inspectConditions('만원 이하 30분 안에 복귀', {kind:'한식',reports:[{body:'5000원 10분이면 돼요'}]});
  assert.equal(checks.length,2);
  assert.ok(checks.every(c=>c.status==='unknown'));
});
test('freshness uses observation date and cannot promote unrelated new reports',()=>{
  const r=retrieveCommunity('주차',[
    {id:'old',kind:'한식',reports:[{id:'o',body:'주차 가능',observedAt:'2025-01-01'}]},
    {id:'new',kind:'한식',reports:[{id:'n',body:'주차 가능',observedAt:'2026-10-06'}]},
    {id:'other',kind:'한식',reports:[{id:'x',body:'맛있어요',observedAt:'2026-10-07'}]}
  ],Date.parse('2026-10-07'));
  assert.deepEqual(r.items.map(p=>p.id),['new','old']);
});
test('search can return every matching place while recommendation keeps its shortlist',()=>{
  const places=Array.from({length:20},(_,i)=>({id:String(i),name:`한식 가게 ${i}`,kind:'한식'}));
  assert.equal(retrieveCommunity('한식',places).items.length,15);
  assert.equal(retrieveCommunity('한식',places,Date.now(),Infinity).items.length,20);
});
test('owner keywords can make a place searchable',()=>{
  const places=[{id:'a',name:'골목집',kind:'한식',ownerKeywords:['혼밥']}];
  assert.deepEqual(retrieveCommunity('혼밥',places).items.map(p=>p.id),['a']);
});
test('budget phrases are conditions, not matches against shop names',()=>{
  assert.equal(searchableRequest('만원이하'),'');
  assert.equal(searchableRequest('한식 만원 이하'),'한식');
  assert.equal(searchableRequest('만원닭발'),'만원닭발');
  assert.equal(retrieveCommunity('만원이하',[{id:'a',name:'만원닭발',kind:'술집'}]).items.length,0);
});
