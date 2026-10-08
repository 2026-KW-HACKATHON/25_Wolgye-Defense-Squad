import test from 'node:test';
import assert from 'node:assert/strict';
// 실제 DB 대신 파일 저장을 쓰도록 먼저 설정한 뒤 불러온다.
process.env.DATA_STORE='file';
const {getCommunityPlaces}=await import('../server/services/communityService.js');
const {mergeSupplementalPlaces,supplementalPlaces}=await import('../server/services/supplementalPlaces.js');

test('reported Kakao place page fills a search API gap without duplicating future API results',()=>{
  const reported=supplementalPlaces[0];
  assert.equal(reported.placeUrl,'https://place.map.kakao.com/101861703');
  assert.equal(mergeSupplementalPlaces([]).filter(p=>p.id===reported.id).length,1);
  assert.equal(mergeSupplementalPlaces([{...reported,source:'카카오 Local'}]).filter(p=>p.id===reported.id).length,1);
});


test('catalog splits search areas beyond Kakao’s 45-result cap',async()=>{
  const originalFetch=globalThis.fetch,originalKey=process.env.KAKAO_REST_API_KEY;
  const requested=[];let rootRect;const childRects=new Map();
  process.env.KAKAO_REST_API_KEY='test-key';
  globalThis.fetch=async url=>{
    const search=new URL(url).searchParams;
    const category=search.get('category_group_code'),page=Number(search.get('page')),rect=search.get('rect');
    if(category==='FD6'&&!rootRect)rootRect=rect;
    requested.push(`${category}:${rect===rootRect?'root':'child'}:${page}`);
    if(category!=='FD6')return {ok:true,json:async()=>({meta:{total_count:0,pageable_count:0},documents:[]})};
    if(rect===rootRect)return {ok:true,json:async()=>({meta:{total_count:120,pageable_count:45},documents:[]})};
    if(!childRects.has(rect))childRects.set(rect,childRects.size+1);
    const id=`${childRects.get(rect)}-${page}`;
    const documents=[{id,place_name:`가게 ${id}`,category_name:'음식점 > 한식',x:'127.0583',y:'37.6193'}];
    return {ok:true,json:async()=>({meta:{total_count:30,pageable_count:30},documents})};
  };
  try{
    const catalog=await getCommunityPlaces();
    assert.equal(requested.filter(value=>value==='FD6:root:1').length,1);
    assert.equal(requested.filter(value=>value==='FD6:child:1').length,4);
    assert.equal(requested.filter(value=>value==='FD6:child:2').length,4);
    assert.equal(catalog.items.filter(place=>place.source==='카카오 Local').length,8);
  }finally{
    globalThis.fetch=originalFetch;
    if(originalKey===undefined)delete process.env.KAKAO_REST_API_KEY;
    else process.env.KAKAO_REST_API_KEY=originalKey;
  }
});

