import test from 'node:test';
import assert from 'node:assert/strict';
import {inDistrict,validateRecommendation} from '../server/services/communityService.js';
test('district includes campus and excludes distant places and invalid coordinates',()=>{
  assert.equal(inDistrict(37.6193,127.0583),true);
  assert.equal(inDistrict(37.5665,126.978),false);
  assert.equal(inDistrict(NaN,127),false);
});
test('only retrieved IDs become candidates, untrusted claims never become shop facts',()=>{
  const catalog=Array.from({length:4},(_,i)=>({id:String(i),name:`가게${i}`,kind:'한식',price:null}));
  const result=validateRecommendation({summary:'만원 이하',answer:'모든 가게가 5000원이며 즉시 입장 가능합니다',ids:['outside','1','1','2','3','0']},catalog);
  assert.deepEqual(result.items.map(p=>p.id),['1','2','3']);
  assert.ok(!result.answer.includes('5000원'));
  assert.ok(result.items.every(p=>p.price===null));
  assert.match(result.answer,/확인되지 않아/);
});
test('invalid model response is explicit failure',()=>{
  assert.throws(()=>validateRecommendation({ids:[]},[]));
});
