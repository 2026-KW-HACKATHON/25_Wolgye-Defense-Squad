import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCondition,rankGroup,recommendGroup,menuPrices,openHours,openingStatus} from '../server/services/groupRecommend.js';

test('conditions are split into wants, excludes, budget and visit hour',()=>{
  assert.deepEqual(parseCondition('만원 이하로 국물 있는 거 먹고 싶어요'),{raw:'만원 이하로 국물 있는 거 먹고 싶어요',wants:['국물'],excludes:[],budget:10000,hour:null});
  const b=parseCondition('중식은 빼고 매운 거 못 먹어요');assert.deepEqual(b.excludes,['중식','매운']);assert.deepEqual(b.wants,[]);
  const c=parseCondition('저녁 7시에 고기 먹자, 1만5천원까지');assert.equal(c.budget,15000);assert.equal(c.hour,19);assert.deepEqual(c.wants,['고기']);
  assert.equal(parseCondition('8천원 이내 분식').budget,8000);
  assert.equal(parseCondition('가족식사할만한 식당 추천해줘').budget,null);
  assert.equal(parseCondition('소고기만 원해요').budget,null);
  assert.equal(parseCondition('1만 이하 식당').budget,10000);
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

test('a suggested place is favored only among eligible places serving the same number of members',()=>{
  const list=members([['가','만원 이하 국물'],['나','중식 빼고 저녁 7시']]);
  const normal=rankGroup(places,list).items.map(item=>item.place.id);
  assert.deepEqual(normal,['b','e']);
  const suggested=rankGroup(places,list,3,Date.now(),['e','a','d']);
  assert.deepEqual(suggested.items.map(item=>item.place.id),['e','b']);
  const equal=rankGroup([
    {id:'first',name:'가 국밥',kind:'한식',info:info({menu:['국밥 8,000원','owner']})},
    {id:'suggested',name:'나 국밥',kind:'한식',info:info({menu:['국밥 8,000원','owner']})}
  ],members([['가','국밥']]),3,Date.now(),['suggested']);
  assert.equal(equal.items[0].place.id,'suggested');
});

test('a request for a snack bar never recommends a different cuisine just because its menu mentions a snack',()=>{
  const result=rankGroup([
    {id:'soup',name:'감자탕집',kind:'감자탕',category:'음식점 > 한식 > 감자탕',info:info({menu:['순대 8,000원','neighbor']})},
    {id:'snack',name:'김밥집',kind:'떡볶이',category:'음식점 > 분식 > 떡볶이',info:info({menu:['김밥 4,000원','neighbor']})}
  ],members([['가','분식집 추천해줘']]));
  assert.deepEqual(parseCondition('분식집 추천해줘').wants,['분식']);
  assert.deepEqual(result.items.map(item=>item.place.id),['snack']);
});
test('simple registered hours exclude a shop closed now; missing or complex hours remain unknown',()=>{
  const hours=value=>({info:info({hours:[value,'owner']})});
  const late=Date.parse('2026-10-08T13:00:00Z'); // 22:00 in Seoul
  assert.equal(openingStatus(hours('매일 11:00~21:00'),{at:late}),'closed');
  assert.equal(openingStatus(hours('매일 11:00~21:00'),{visitHour:12}),'open');
  assert.equal(openingStatus(hours('평일 11:00~21:00, 주말 12:00~22:00'),{at:late}),'unknown');
  assert.equal(openingStatus({}, {at:late}),'unknown');
  const result=rankGroup([
    {id:'closed',name:'닫힌 국밥',kind:'한식',...hours('11:00~21:00')},
    {id:'unknown',name:'영업시간 없는 국밥',kind:'한식'}
  ],members([['가','국밥']]),3,late);
  assert.deepEqual(result.items.map(item=>item.place.id),['unknown']);
});
