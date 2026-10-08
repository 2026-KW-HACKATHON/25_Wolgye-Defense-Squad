// Place pages reported by neighbors that Kakao Local search does not currently return.
// Keep their source and verification status visible instead of claiming API coverage.
export const supplementalPlaces = [
  {
    id: 'kakao-101861703',
    name: '춘리마라탕 광운대점',
    kind: '중식',
    category: '음식점 > 중식',
    address: '서울 노원구 광운로 39, 2층',
    phone: null,
    lat: 37.62107095055623,
    lng: 127.0589154267429,
    placeUrl: 'https://place.map.kakao.com/101861703',
    price: null,
    menu: null,
    image: null,
    source: '카카오맵 장소 페이지',
    status: '검색 API 미노출 · 영업 확인 필요'
  }
];

export function mergeSupplementalPlaces(catalog, reported=supplementalPlaces) {
  const normalize=name=>name.replace(/\s/g,'').toLowerCase();
  return [...reported.filter(place=>!catalog.some(row=>
    row.id===place.id || (normalize(row.name)===normalize(place.name)
    && Math.hypot((row.lat-place.lat)*111000,(row.lng-place.lng)*88000)<100)
  )),...catalog];
}
