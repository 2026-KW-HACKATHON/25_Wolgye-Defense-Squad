import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCondition,rankGroup,recommendGroup,menuPrices,openHours} from '../server/services/groupRecommend.js';

test('conditions are split into wants, excludes, budget and visit hour',()=>{
  assert.deepEqual(parseCondition('만원 이하로 국물 있는 거 먹고 싶어요'),{raw:'만원 이하로 국물 있는 거 먹고 싶어요',wants:['국물'],excludes:[],budget:10000,hour:null});
  const b=parseCondition('중식은 빼고 매운 거 못 먹어요');assert.deepEqual(b.excludes,['중식','매운']);assert.deepEqual(b.wants,[]);
  const c=parseCondition('저녁 7시에 고기 먹자, 1만5천원까지');assert.equal(c.budget,15000);assert.equal(c.hour,19);assert.deepEqual(c.wants,['고기']);
  assert.equal(parseCondition('8천원 이내 분식').budget,8000);
  assert.deepEqual(menuPrices('칼국수 8,000원 / 수제비 7천원'),[8000,7000]);
  assert.deepEqual(openHours('17:00~02:00'),{open:17,close:26});
});

const info=(fields)=>({fields:Object.fromEntries(Object.entries(fields).map(([k,[value,role]])=>[k,{value,role,observedAt:'2026-10-01'}]))});
const places=[
  {id:'a',name:'짬뽕집',kind:'중식',info:info({menu:['짬뽕 9,000원','owner']})},
  {id:'b',name:'월계국밥',kind:'한식',info:info({menu:['순대국밥 9,000원','owner'],hours:['11:00~21:00','neighbor']})},
  {id:'c',name:'분식왕',kind:'분식',info:info({menu:['떡볶이 4,000원','neighbor']})},
  {id:'d',name:'비싼 탕',kind:'한식',info:info({menu:['감자탕 대 45,000원','owner']})},
  {id:'e',name:'정보없는 국수',kind:'국수'}
];
const members=list=>list.map(([name,condition])=>({name,condition,parsed:parseCondition(condition)}));

test('a place violating any member condition is never recommended; others rank by members served',()=>{
  const r=rankGroup(places,members([['가','만원 이하 국물'],['나','중식 빼고 저녁 7시']]));
  const ids=r.items.map(s=>s.place.id);
  assert.ok(!ids.includes('a'),'중식 제외');
  assert.ok(!ids.includes('d'),'예산 초과');
  assert.ok(!ids.includes('c'),'아무도 원하지 않음');
  assert.deepEqual(ids,['b','e']);
  const b=r.items[0].perMember;
  assert.equal(b[0].checks.find(c=>c.kind==='budget').status,'met');
  assert.equal(b[1].checks.find(c=>c.kind==='hour').status,'met');
  assert.equal(r.items[1].perMember[0].checks.find(c=>c.kind==='budget').status,'unknown');
});

test('closed hours exclude a place and the result explains each member',async()=>{
  const result=await recommendGroup([{name:'가',condition:'국밥 먹고 싶어요'},{name:'나',condition:'밤 11시'}],{useAI:false,getPlaces:async()=>({items:places})});
  assert.ok(!result.items.some(p=>p.id==='b'),'21시에 닫는 가게');
  assert.equal(result.understood[1].hour,23);
  assert.ok(result.items.every(p=>p.memberChecks.length===2));
});
