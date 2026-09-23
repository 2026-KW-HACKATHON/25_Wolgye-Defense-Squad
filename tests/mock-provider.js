// 서버 테스트에서만 --import로 로드. 외부 서비스 호출을 차단합니다.
globalThis.fetch = async function (input) {
  const url = new URL(input);
  if (url.hostname === 'dapi.kakao.com' && url.pathname.includes('/local/')) {
    return Response.json({documents: [{id:'test-1',place_name:'테스트 식당',category_name:'음식점 > 한식',distance:'140',road_address_name:'테스트 주소',place_url:'https://example.com/place'}]});
  }
  if (url.hostname === 'dapi.kakao.com' && url.pathname.includes('/blog')) {
    return Response.json({documents:[]});
  }
  if (url.hostname === 'integrate.api.nvidia.com') {
    return Response.json({choices:[{message:{content:'테스트 추천 소개입니다.'}}]});
  }
  throw new Error('Unexpected external request: ' + url.hostname);
};
