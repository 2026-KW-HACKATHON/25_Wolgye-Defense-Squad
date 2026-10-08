import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATA_STORE='file';
const {classifySearchPlaces,isConditionOnlySearch}=await import('../server/services/communityService.js');
const {parseCondition}=await import('../server/services/groupRecommend.js');

const info=menu=>({fields:{menu:{value:menu,role:'owner',observedAt:'2026-10-09'}}});

test('budget search separates registered evidence from missing data and excludes known violations',()=>{
  const places=[
    {id:'unknown',name:'정보 없는 가게',kind:'한식'},
    {id:'expensive',name:'비싼 가게',kind:'한식',info:info('정식 15,000원')},
    {id:'known',name:'가격 있는 가게',kind:'한식',info:info('정식 9,000원')}
  ];
  const items=classifySearchPlaces(places,parseCondition('만원 이하'));
  assert.deepEqual(items.map(p=>[p.id,p.conditionStatus]),[['known','confirmed'],['unknown','unverified']]);
  assert.equal(items[0].conditionEvidence[0].status,'met');
  assert.equal(items[1].conditionEvidence[0].status,'unknown');
});

test('all stated numeric conditions need supporting information before a place is marked confirmed',()=>{
  const places=[
    {id:'missing-hours',name:'영업시간 미등록',kind:'한식',info:info('정식 9,000원')},
    {id:'both',name:'두 조건 확인',kind:'한식',info:{fields:{...info('정식 9,000원').fields,hours:{value:'11:00~21:00',role:'owner',observedAt:'2026-10-09'}}}}
  ];
  const items=classifySearchPlaces(places,parseCondition('만원 이하, 저녁 7시'));
  assert.deepEqual(items.map(p=>[p.id,p.conditionStatus]),[['both','confirmed'],['missing-hours','unverified']]);
});

test('generic place words do not prevent a budget-only search from showing the catalog',()=>{
  assert.equal(isConditionOnlySearch('만원 이하 식당 추천해줘'),true);
  assert.equal(isConditionOnlySearch('저녁 7시 가게 찾아줘'),true);
  assert.equal(isConditionOnlySearch('만원 이하 분식집'),false);
});
