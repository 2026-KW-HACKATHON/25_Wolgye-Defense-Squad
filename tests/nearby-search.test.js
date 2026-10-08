import test from 'node:test';
import assert from 'node:assert/strict';
import {nearbyCategoryMatches,nearbyShortlist} from '../server/services/nearbySearch.js';
import {campusOrigin,distanceMeters,requestedCategories,wantsNearby} from '../src/community/placeBrowse.js';

test('an either-or cuisine request keeps both registered categories and sorts by coordinates',()=>{
  const places=[
    {id:'far-chinese',name:'먼 중국집',category:'음식점 > 중식',lat:37.622,lng:127.0583},
    {id:'near-chinese',name:'가까운 중국집',category:'음식점 > 중식',lat:37.6194,lng:127.0583},
    {id:'near-japanese',name:'가까운 스시집',category:'음식점 > 일식 > 초밥,롤',lat:37.6195,lng:127.0583},
    {id:'another-chinese',name:'다른 중국집',category:'음식점 > 중식',lat:37.6196,lng:127.0583},
    {id:'korean',name:'한식집',category:'음식점 > 한식',lat:37.6193,lng:127.0583}
  ];
  const match=nearbyCategoryMatches('중식 아니면 일식 가까운 곳',places,campusOrigin);
  assert.deepEqual(match.categories,['중식','일식']);
  assert.deepEqual(match.items.map(p=>p.id),['near-chinese','near-japanese','another-chinese','far-chinese']);
  assert.deepEqual(nearbyShortlist(match).map(p=>p.id),['near-chinese','near-japanese','another-chinese']);
  assert.ok(distanceMeters(match.origin,match.items[0])<distanceMeters(match.origin,match.items[1]));
});

test('nearby intent without a known cuisine leaves other search terms to normal retrieval',()=>{
  assert.equal(wantsNearby('일식 가까운 곳'),true);
  assert.deepEqual(requestedCategories('중식 또는 일식 근처'),['중식','일식']);
  assert.equal(nearbyCategoryMatches('조용한 곳 근처',[],campusOrigin),null);
});

test('three suggestions include a nearby shop from each requested cuisine',()=>{
  const places=[
    ...[1,2,3].map(n=>({id:`c${n}`,name:`중식 ${n}`,category:'음식점 > 중식',lat:37.6193+n*0.0001,lng:127.0583})),
    {id:'j',name:'일식',category:'음식점 > 일식',lat:37.6197,lng:127.0583}
  ];
  const match=nearbyCategoryMatches('중식 아니면 일식 가까운 곳',places,campusOrigin);
  assert.deepEqual(nearbyShortlist(match).map(p=>p.id),['c1','c2','j']);
});
