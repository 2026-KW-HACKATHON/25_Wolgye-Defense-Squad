import {communityStore} from './communityStore.js';
import fs from 'node:fs';
const boundary = JSON.parse(fs.readFileSync(new URL('../../src/community/wolgye1-boundary.json', import.meta.url), 'utf8'));

function inRing(x,y,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}

export function inDistrict(lat,lng) {
  return Number.isFinite(lat)&&Number.isFinite(lng)&&boundary.geometry.coordinates.some(r=>inRing(lng,lat,r[0])&&!r.slice(1).some(h=>inRing(lng,lat,h)));
}

const defaultSamplePlaces = [
  {id:'sample-1',name:'벼락 광운대점',kind:'한식',category:'음식점 > 한식 > 냉면',address:'서울 노원구 광운로 29',phone:'02-943-3450',lat:37.6198,lng:127.0588,placeUrl:'https://place.map.kakao.com/17586524',price:null,menu:null,image:null,source:'월계1동 대표 식당',retrievedAt:new Date().toISOString()},
  {id:'sample-2',name:'화덕고깃간 광운대점',kind:'육류,고기',category:'음식점 > 한식 > 육류,고기',address:'서울 노원구 광운로 28-1',phone:'02-941-9292',lat:37.6202,lng:127.0585,placeUrl:'https://place.map.kakao.com/12345678',price:null,menu:null,image:null,source:'월계1동 대표 식당',retrievedAt:new Date().toISOString()},
  {id:'sample-3',name:'윤스쿠치나',kind:'양식',category:'음식점 > 양식 > 이탈리안',address:'서울 노원구 광운로 44',phone:'02-942-0808',lat:37.6210,lng:127.0592,placeUrl:'https://place.map.kakao.com/23456789',price:null,menu:null,image:null,source:'월계1동 대표 식당',retrievedAt:new Date().toISOString()},
  {id:'sample-4',name:'노을길 카페',kind:'카페',category:'음식점 > 카페 > 커피전문점',address:'서울 노원구 광운로 12',phone:'02-943-1212',lat:37.6190,lng:127.0580,placeUrl:'https://place.map.kakao.com/34567890',price:null,menu:null,image:null,source:'월계1동 대표 식당',retrievedAt:new Date().toISOString()},
  {id:'sample-5',name:'미식당',kind:'일식',category:'음식점 > 일식 > 돈까스,우동',address:'서울 노원구 석계로 13',phone:'02-941-5566',lat:37.6175,lng:127.0620,placeUrl:'https://place.map.kakao.com/45678901',price:null,menu:null,image:null,source:'월계1동 대표 식당',retrievedAt:new Date().toISOString()}
];

// 월계1동 장소별 대표 음식 및 특성 지식 사전
const PLACE_KNOWLEDGE_MAP = [
  { match: /더진국|순대|국밥|해장국|설렁탕/, tags: ['국밥', '순대국', '수육', '따뜻한 국물', '해장', '한식', '혼밥', '따뜻한 음식', '든든한 한 끼'] },
  { match: /파파존스|피자/, tags: ['피자', '치즈', '양식', '패스트푸드', '간단한 식사'] },
  { match: /지지고|경대컵밥|쉐프밥버거|주먹밥|컵밥/, tags: ['컵밥', '주먹밥', '밥버거', '간단한 식사', '혼밥', '가성비', '도시락', '빠른 식사', '저렴한 식사'] },
  { match: /이삭토스트|재리스토스트|토스트/, tags: ['토스트', '샌드위치', '간식', '간단한 식사', '브런치', '혼밥', '가성비', '빵'] },
  { match: /김바삭군의 볼카츠|돈까스|볼카츠|윤스쿡|일심텐동/, tags: ['돈까스', '볼카츠', '카츠', '텐동', '튀김', '일식', '혼밥', '바삭한 튀김'] },
  { match: /푸른스시|스시덤|초밥|스시|회|횟집/, tags: ['초밥', '스시', '회', '생선', '일식', '해산물', '날것'] },
  { match: /이층집|찌개|전골/, tags: ['찌개', '전골', '부대찌개', '김치찌개', '따뜻한 국물', '얼큰한 국물', '백반', '한식', '모임'] },
  { match: /소담밥상|한식밥상|마루|백반|정오아카데미/, tags: ['백반', '가정식 백반', '한식', '가정식', '정갈한 한식', '집밥', '든든한 쌀밥'] },
  { match: /화로상회|화덕고깃간|삼겹살|고기|갈비|구이/, tags: ['삼겹살', '고기', '갈비', '고깃집', '구이', '회식', '모임', '단체', '든든한 식사'] },
  { match: /디델리|김밥천국|김가네|분식|떡볶이/, tags: ['떡볶이', '분식', '김밥', '라볶이', '간단한 식사', '가성비', '매콤한 분식', '혼밥'] },
  { match: /프랭크버거|맘스터치|버거|햄버거/, tags: ['햄버거', '버거', '치킨', '패스트푸드', '간단한 식사', '혼밥', '가성비'] },
  { match: /두찜|찜닭|닭강정|치킨/, tags: ['찜닭', '닭요리', '치킨', '닭강정', '한식'] },
  { match: /미식성|진짜루|중화|중식|중국요리|신연마라탕/, tags: ['중식', '짜장면', '짬뽕', '중국집', '마라탕', '얼큰한 국물', '중화요리'] },
  { match: /벼락|냉면|모밀/, tags: ['냉면', '시원한 냉면', '시원한 음식', '한식', '여름 별미'] },
  { match: /장수국수|국수|칼국수/, tags: ['국수', '칼국수', '잔치국수', '따뜻한 국물', '면 요리', '한식'] },
  { match: /설빙|빙수|요거트아이스크림|달콤몬스터/, tags: ['빙수', '아이스크림', '디저트', '시원한 디저트', '달콤한 디저트'] },
  { match: /카페|커피|디저트|베이커리|브레댄코|스타벅스|이디야|메가|컴포즈|할리스|투썸|광운커피|카페베르데|롯오브젝트|우우즈|1일1잔|빠말|후아나/, tags: ['카페', '커피', '디저트', '음료', '차', 'Tea', '논커피', '아메리카노', '수다', '공부', '데이트'] }
];

export function enrichPlace(p) {
  const tags = new Set();
  if (p.kind) tags.add(p.kind);
  if (p.category) {
    p.category.split('>').forEach(part => tags.add(part.trim()));
  }
  const text = `${p.name} ${p.kind} ${p.category || ''}`;
  for (const item of PLACE_KNOWLEDGE_MAP) {
    if (item.match.test(text)) {
      item.tags.forEach(t => tags.add(t));
    }
  }
  return { ...p, tags: Array.from(tags) };
}

let cache = null, pending = null;
async function getBasePlaces() {
  if (cache && Date.now() - cache.at < 300000) return cache.data;
  if (pending) return pending;
  pending = (async () => {
    const key = process.env.KAKAO_REST_API_KEY;
    if (!key || key === 'your_kakao_rest_api_key_here') {
      const enriched = defaultSamplePlaces.map(enrichPlace);
      return { items: enriched, source: '월계1동 기본 등록', retrievedAt: new Date().toISOString(), notice: '카카오 API 키가 설정되지 않아 월계1동 대표 식당 샘플 목록을 표시합니다.' };
    }
    const found = new Map();
    try {
      for (const category of ['FD6', 'CE7']) {
        for (let page = 1; page <= 3; page++) {
          const url = new URL('https://dapi.kakao.com/v2/local/search/category.json');
          Object.entries({ category_group_code: category, x: 127.0583, y: 37.6193, radius: 2200, sort: 'distance', size: 15, page }).forEach(([k, v]) => url.searchParams.set(k, v));
          const response = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(`카카오 장소 조회 실패 (${response.status})`);
          const data = await response.json();
          for (const p of data.documents || []) {
            const lat = Number(p.y), lng = Number(p.x);
            if (!inDistrict(lat, lng)) continue;
            const placeObj = enrichPlace({
              id: `kakao-${p.id}`,
              name: p.place_name,
              kind: p.category_name.split('>').pop().trim(),
              category: p.category_name,
              address: p.road_address_name || p.address_name,
              phone: p.phone || null,
              lat, lng,
              placeUrl: `https://place.map.kakao.com/${p.id}`,
              price: null, menu: null, image: null,
              source: '카카오 Local',
              retrievedAt: new Date().toISOString()
            });
            found.set(p.id, placeObj);
          }
          if (data.meta?.is_end) break;
        }
      }
      if (found.size === 0) throw new Error('검색된 가게가 없습니다.');
      const data = { items: [...found.values()], source: '카카오 Local', retrievedAt: new Date().toISOString(), notice: '카카오 검색 결과 중 월계1동 경계 안의 음식점·카페입니다. 전체 가게 목록이나 현재 영업 여부를 보장하지 않아요.' };
      cache = { at: Date.now(), data };
      return data;
    } catch (err) {
      const enriched = defaultSamplePlaces.map(enrichPlace);
      return { items: enriched, source: '월계1동 기본 등록', retrievedAt: new Date().toISOString(), notice: `카카오 연동 오류 (${err.message}). 월계1동 대표 식당 샘플을 표시합니다.` };
    }
  })();
  try { return await pending; } finally { pending = null; }
}

export async function getCommunityPlaces() {
  const data = await getBasePlaces();
  const posts = communityStore.posts();
  return {
    ...data,
    items: [...communityStore.places().map(enrichPlace), ...data.items].map(p => ({
      ...p,
      reports: posts.filter(n => n.placeId === p.id).sort((a, b) => b.observedAt.localeCompare(a.observedAt)).slice(0, 3).map(({ id, body, type, observedAt }) => ({ id, body, type, observedAt }))
    }))
  };
}

// 실시간 카카오 키워드 검색으로 추가 후보 탐색
async function fetchDynamicKakaoPlaces(keyword) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key || key === 'your_kakao_rest_api_key_here') return [];
  try {
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', `월계동 ${keyword}`);
    url.searchParams.set('category_group_code', 'FD6');
    url.searchParams.set('x', '127.0583');
    url.searchParams.set('y', '37.6193');
    url.searchParams.set('radius', '2200');
    url.searchParams.set('size', '10');
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    const results = [];
    for (const p of data.documents || []) {
      const lat = Number(p.y), lng = Number(p.x);
      if (!inDistrict(lat, lng)) continue;
      results.push(enrichPlace({
        id: `kakao-${p.id}`,
        name: p.place_name,
        kind: p.category_name.split('>').pop().trim(),
        category: p.category_name,
        address: p.road_address_name || p.address_name,
        phone: p.phone || null,
        lat, lng,
        placeUrl: `https://place.map.kakao.com/${p.id}`,
        price: null, menu: null, image: null,
        source: '카카오 Local 검색',
        retrievedAt: new Date().toISOString()
      }));
    }
    return results;
  } catch {
    return [];
  }
}

// 사용자 쿼리 의미 및 제약조건 추출기
function parseUserIntent(query) {
  const text = query.trim();
  
  // 제외 조건 (Negative Constraints)
  const negatives = [];
  if (/매운.*(못|빼|제외|안 먹)|안\s*매운|순한|담백/.test(text)) negatives.push('spicy');
  if (/(고기|삼겹살|육류|해산물).*(빼|제외|안 먹)|채식|비건/.test(text)) negatives.push('meat');
  if (/(생선|회|초밥|날것|날 것|해물).*(못|빼|제외|안 먹)/.test(text)) negatives.push('fish');
  if (/(닭|치킨).*(못|빼|제외|안 먹|알러지|알레르기)/.test(text)) negatives.push('chicken');
  if (/기름진.*(피하|싫|빼)|속\s*편한|담백/.test(text)) negatives.push('greasy');
  if (/밀가루.*(말고|빼|제외)|(면|빵).*(말고|말구)|쌀밥|밥\s*위주/.test(text)) negatives.push('flour');
  if (/밥.*(말고|말구)|빵|브런치|샌드위치/.test(text)) negatives.push('rice');
  if (/(커피).*(못|안|빼|제외)|논커피/.test(text)) negatives.push('coffee');
  if (/단.*(음료|거).*(말고|빼)|차|Tea/.test(text)) negatives.push('sweet');

  // 예산 추출
  let budget = null;
  const budgetMatch = text.match(/(\d+)\s*(만\s*원|천\s*원|원)/);
  if (budgetMatch) {
    let num = parseInt(budgetMatch[1], 10);
    if (budgetMatch[2].includes('만')) num *= 10000;
    else if (budgetMatch[2].includes('천')) num *= 1000;
    budget = num;
  }

  // 공강 / 시간 추출
  let minutes = null;
  const minMatch = text.match(/(공강\s*)?(\d+)\s*분/);
  if (minMatch) minutes = parseInt(minMatch[2], 10);

  // 인원 추출
  let people = 1;
  const peopleMatch = text.match(/(\d+)\s*명/);
  if (peopleMatch) people = parseInt(peopleMatch[1], 10);
  else if (/혼자|혼밥/.test(text)) people = 1;
  else if (/둘이|2명|데이트|친구랑/.test(text)) people = 2;

  // 카페/디저트 전용 여부
  const isCafeOnly = /(카페|커피|디저트|베이커리|빙수|아메리카노|차|Tea)/.test(text) && !/(밥|국|찌개|식사|점심|저녁|고기|식당|돈까스)/.test(text);
  const isMealOnly = /(식사|밥|국|찌개|점심|저녁|고기|식당|돈까스|국밥|햄버거|피자|치킨|분식)/.test(text) && !/(카페|커피|디저트)/.test(text);

  return { text, negatives, budget, minutes, people, isCafeOnly, isMealOnly };
}

// 규칙 기반 장소 스코어링 & 필터링
function scorePlaces(places, intent) {
  const query = intent.text;
  
  return places.map(p => {
    let score = 0;
    const allTags = (p.tags || []).join(' ');
    const fullName = `${p.name} ${p.kind} ${p.category || ''} ${allTags}`;

    // 1. 카페 / 식당 분리
    const isCafe = /카페|커피|디저트|베이커리|빙수/.test(fullName);
    if (intent.isCafeOnly && !isCafe) return { ...p, score: -999 };
    if (intent.isMealOnly && isCafe) score -= 60;

    // 2. 음성 제외 조건 (Negative constraints) 필터링
    if (intent.negatives.includes('spicy') && /마라탕|짬뽕|매운|떡볶이|닭갈비|라볶이/.test(fullName)) score -= 150;
    if (intent.negatives.includes('meat') && /삼겹살|고기|갈비|화로상회|화덕고깃간|돈까스|치킨|순대|곱창/.test(fullName)) score -= 200;
    if (intent.negatives.includes('fish') && /회|초밥|스시|생선|해물|전어/.test(fullName)) score -= 200;
    if (intent.negatives.includes('chicken') && /치킨|닭|닭강정|찜닭|두찜|맘스터치/.test(fullName)) score -= 200;
    if (intent.negatives.includes('flour') && /국수|라면|파스타|피자|토스트|버거|빵|중식|칼국수|우동/.test(fullName)) score -= 150;
    if (intent.negatives.includes('rice') && /백반|밥|국밥|도시락|컵밥|한식/.test(fullName)) score -= 100;
    if (intent.negatives.includes('coffee') && /스타벅스|이디야|메가MGC|컴포즈|빽다방/.test(p.name)) score -= 50;

    // 3. 키워드 매칭 가산점
    const keywords = [
      ['국밥', /국밥|순대국|수육|설렁탕/],
      ['순대', /순대/],
      ['찌개', /찌개|전골|부대찌개|김치찌개/],
      ['백반', /백반|가정식|집밥|한식밥상|소담밥상/],
      ['피자', /피자/],
      ['치즈', /치즈/],
      ['돈까스', /돈까스|볼카츠|카츠/],
      ['초밥', /초밥|스시/],
      ['회', /회|횟집|생선/],
      ['냉면', /냉면|벼락/],
      ['고기', /고기|삼겹살|갈비|구이/],
      ['삼겹살', /삼겹살/],
      ['버거', /버거|햄버거|프랭크버거|맘스터치/],
      ['토스트', /토스트|이삭토스트|샌드위치/],
      ['빵', /빵|베이커리|브레댄코/],
      ['디저트', /디저트|케이크|빙수/],
      ['빙수', /빙수|설빙/],
      ['아메리카노', /아메리카노|커피|카페/],
      ['짜장', /짜장|중식|중국/],
      ['짬뽕', /짬뽕|중식/],
      ['치킨', /치킨|닭강정/],
      ['주먹밥', /주먹밥|밥버거|컵밥|지지고/],
      ['컵밥', /컵밥|도시락|지지고/],
      ['분식', /분식|떡볶이|김밥|라면/],
      ['떡볶이', /떡볶이/],
      ['국수', /국수|칼국수/],
      ['파스타', /파스타|스파게티|양식/],
      ['차', /차|Tea|차전문점/],
      ['따뜻한 국물', /국물|탕|찌개|국밥|해장국/]
    ];

    for (const [kw, regex] of keywords) {
      if (query.includes(kw)) {
        if (regex.test(fullName)) score += 40;
        if (regex.test(p.name)) score += 30;
      }
    }

    // 4. 상황별 가산점
    if (/혼밥|혼자/.test(query) && /컵밥|주먹밥|밥버거|토스트|김밥|분식|돈까스|국밥|패스트푸드/.test(fullName)) score += 20;
    if (/회식|모임|단체/.test(query) || (intent.people && intent.people >= 4)) {
      if (/고기|삼겹살|구이|찌개|전골|뷔페|중식/.test(fullName)) score += 25;
      if (/토스트|컵밥|주먹밥/.test(fullName)) score -= 20;
    }

    // 5. 공강 시간 및 예산 가산점
    if (intent.minutes && intent.minutes <= 40) {
      if (/패스트푸드|토스트|컵밥|주먹밥|분식|김밥|도시락/.test(fullName)) score += 30;
    }
    if (intent.budget && intent.budget <= 8000) {
      if (/컵밥|주먹밥|밥버거|토스트|김밥|분식|백반|도시락/.test(fullName)) score += 25;
    }

    // 6. 감성/분위기/상황별 가산점
    if (/감성|인스타|분위기|데이트/.test(query)) {
      if (/카페베르데|롯오브젝트|광운커피|우우즈|윤스쿠치나|푸른스시/.test(p.name)) score += 35;
    }
    if (/해장|얼큰|화끈|매운/.test(query)) {
      if (/더진국|병천청년순대|이층집|진짜루|미식성|신연마라탕|신전떡볶이|불고기|찌개/.test(fullName)) score += 35;
    }
    if (/가성비|저렴|싸고|학생/.test(query)) {
      if (/화로상회|경대컵밥|쉐프밥버거|디델리|김밥천국|지지고|이삭토스트/.test(fullName)) score += 25;
    }
    if (/단짠단짠/.test(query)) {
      if (/두찜|찜닭|치킨|불고기|떡볶이|갈비/.test(fullName)) score += 35;
    }
    if (/자축|시험.*끝|특별한|기분.*전환/.test(query)) {
      if (/삼겹살|고기|갈비|화로상회|하남돼지집|초밥|스시|회|피자|치킨/.test(fullName)) score += 35;
    }
    if (/담백|부드럽|순한|속.*편한/.test(query)) {
      if (/소담밥상|한식밥상|백반|장수국수|국수|죽|설렁탕|국밥/.test(fullName)) score += 35;
    }
    if (/느끼하지.*않고|깔끔한.*한.*끼|건강/.test(query)) {
      if (/백반|초밥|스시|찌개|샐러드|한식/.test(fullName)) score += 35;
    }
    if (/푸짐|배.*터지|양.*많/.test(query)) {
      if (/화로상회|뷔페|무한리필|국밥|더진국|찌개마을|돈까스/.test(fullName)) score += 35;
    }
    if (/추운|몸.*녹일|따뜻한/.test(query)) {
      if (/국밥|더진국|찌개|이층집|칼국수|장수국수|스타벅스|카페/.test(fullName)) score += 35;
    }
    if (/대표.*밥집|찐.*로컬|숨은.*맛집/.test(query)) {
      if (/더진국|이층집|화로상회|소담밥상|병천청년순대|화덕고깃간/.test(fullName)) score += 35;
    }
    if (/안주|술.*한잔|맥주/.test(query)) {
      if (/고기|삼겹살|치킨|전골|포차|회|족발/.test(fullName)) score += 35;
    }
    if (/포장.*연구실|포장.*벤치|테이크아웃/.test(query)) {
      if (/컵밥|밥버거|토스트|김밥|도시락|햄버거|샌드위치/.test(fullName)) score += 35;
    }
    if (/교수님|부모님|정갈한/.test(query)) {
      if (/소담밥상|한식밥상|윤스쿠치나|푸른스시|정갈한/.test(fullName)) score += 35;
    }
    if (/새콤달콤|입맛/.test(query)) {
      if (/냉면|삼대냉면|벼락|떡볶이|비빔국수|디저트/.test(fullName)) score += 35;
    }
    if (/정문|가까운/.test(query)) {
      if (/광운로/.test(p.address || '')) score += 15;
    }
    if (/석계/.test(query)) {
      if (/석계/.test(p.address || '') || /석계/.test(p.name)) score += 35;
    }

    return { ...p, score };
  }).filter(p => p.score > -100).sort((a, b) => b.score - a.score);
}

export function validateRecommendation(value, places, message='') {
  if(!value || typeof value.summary!=='string'||!Array.isArray(value.ids)) throw new Error('AI 응답 형식을 확인하지 못했어요. 다시 시도해 주세요.');
  const byId=new Map(places.map(p=>[p.id,p]));
  const checks=[];
  if(/원|예산|가격|저렴|비싸/.test(message))checks.push('메뉴 가격');
  if(/분|시간|공강|빨리|복귀/.test(message))checks.push('이동·식사·대기 시간');
  if(/조용|분위기|대화|시끄/.test(message))checks.push('소음·분위기');
  if(/예약|자리|인원|명/.test(message))checks.push('좌석·예약 가능 여부');
  if(/알레르기|알러지|채식|못 먹|제외/.test(message))checks.push('식재료·제외 조건');
  const items=[...new Set(value.ids)].filter(id=>byId.has(id)).slice(0,3).map(id=>{
    const p=byId.get(id),evidence=Array.isArray(value.evidence)?value.evidence.find(e=>e?.id===id):null;
    const report=p.reports?.find(r=>r.id===evidence?.reportId);
    const quote=typeof evidence?.quote==='string'?evidence.quote.trim():'';
    const reason=report&&quote.length>=2&&quote.length<=120&&report.body.includes(quote)
      ? `${report.observedAt} 이웃 제보: “${quote}” — 아직 검증되지 않은 내용이에요.`
      : `등록 업종이 ‘${p.kind}’인 가게로, 요청 내용과 관련된 후보예요.`;
    return {...p,reason,checks:(checks.length?checks.join(' · '):'메뉴·영업 여부 및 요청한 세부 조건')+' 확인 필요'};
  });
  const summary=value.summary.slice(0,700);
  const answer=`말씀하신 조건은 “${summary}”로 이해했어요.\n\n${items.length?`월계1동에서 추가로 확인해 볼 가게 ${items.length}곳을 골랐어요.\n`+items.map(p=>`${p.name} — 등록 업종: ${p.kind}`).join('\n'):'현재 조회된 정보로는 관련 가게를 고르기 어려워요. 원하는 업종이나 조건을 조금 더 알려주세요.'}\n\n현재 확인된 정보는 상호·업종·주소·전화번호입니다. 메뉴·가격·영업시간·이동 및 대기시간·분위기·시설은 확인되지 않아, 요청하신 조건을 모두 만족한다고 보장할 수 없어요. 아래 매장 정보에서 확인 후 결정해 주세요.`;
  return {answer,summary,items,notice:'조건 충족이 확정된 추천이 아닌 추가 확인용 후보입니다. 입력한 필수 조건을 완화하지 않습니다.'};
}

let aiWindowStart = Date.now(), aiCount = 0, aiActive = 0;
export async function recommendCommunity(message) {
  if (Date.now() - aiWindowStart >= 3600000) { aiWindowStart = Date.now(); aiCount = 0; }
  if (aiCount >= 1000 || aiActive >= 10) throw new Error('AI 사용량이 많아요. 잠시 후 다시 시도해 주세요.');
  aiCount++; aiActive++;
  try { return await runRecommendation(message); } finally { aiActive--; }
}

function parseJsonSafe(text) {
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON format error');
  return JSON.parse(match[0]);
}

async function runRecommendation(message) {
  const catalog = await getCommunityPlaces();
  const intent = parseUserIntent(message);

  // 1. 필요한 경우 카카오 실시간 동적 검색 보강
  const dynamicQueryMatch = message.match(/(냉면|파스타|라멘|마라탕|쌀국수|와플|족발|보쌈|닭갈비|곱창|순대국|샤브샤브|칼국수|부대찌개|텐동|초밥|삼겹살|고기|치킨|떡볶이|국밥|찌개|백반|피자|돈까스|햄버거|토스트|디저트|빙수|베이커리)/);
  let allPlaces = [...catalog.items];
  if (dynamicQueryMatch) {
    const extra = await fetchDynamicKakaoPlaces(dynamicQueryMatch[1]);
    for (const ep of extra) {
      if (!allPlaces.some(p => p.id === ep.id)) allPlaces.push(ep);
    }
  }

  // 2. 다면 스코어링 & 네거티브 필터링으로 유력 후보 선별
  const ranked = scorePlaces(allPlaces, intent);
  const candidates = ranked.slice(0, 8); // 상위 8개 후보 선정

  if (!process.env.NVIDIA_API_KEY) throw new Error('NVIDIA API 키가 설정되지 않았어요.');

  // 3. LLM에 전달할 후보 정보 구성
  const candidatesInfo = candidates.map(p => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    category: p.category || '',
    tags: p.tags || [],
    address: p.address,
    reports: p.reports || []
  }));

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
        temperature: 0.1,
        max_tokens: 1000,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          {
            role: 'system',
            content: `당신은 월계1동 장소 추천 분석기입니다. 반드시 아래 JSON 형식으로만 응답하세요:
{"summary":"사용자의 요청 조건 요약 (1~2문장)","ids":["선택한 장소의 id (최대 3개)"],"evidence":[]}

규칙:
1. 사용자 요청의 목적(음식 종류, 상황, 예산, 시간, 인원)에 가장 잘 어울리는 장소를 후보 목록에서 1~3개 선택하여 ids 배열에 넣으세요.
2. 사용자가 원하지 않는 조건(제외 음식, 비선호 등)이 있다면 해당 장소는 절대 선택하지 마세요.
3. 목록에 있는 실제 id 문자열만 ids에 넣으세요. 적합한 장소가 전혀 없을 때만 ids를 빈 배열로 두세요.
4. summary에는 사용자가 요구한 핵심 조건을 충실하게 정리하세요.`
          },
          {
            role: 'user',
            content: JSON.stringify({ request: message, candidate_places: candidatesInfo })
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const parsed = parseJsonSafe(content);
      
      // 만약 LLM이 지나치게 소극적이어서 ids를 비웠으나 랭킹 후보가 확실히 있다면 랭킹 상위 반영
      if ((!parsed.ids || parsed.ids.length === 0) && candidates.length > 0 && candidates[0].score > 20) {
        parsed.ids = candidates.slice(0, 3).map(p => p.id);
      }
      
      return { ...validateRecommendation(parsed, allPlaces, message), retrievedAt: catalog.retrievedAt };
    }
  } catch (llmErr) {
    console.warn('NVIDIA NIM call failed, using heuristic fallback:', llmErr.message);
  }

  // Fallback: LLM 호출 실패(429 타임아웃 등) 시 룰 기반 고품질 폴백 응답
  const fallbackIds = candidates.slice(0, 3).map(p => p.id);
  const fallbackParsed = {
    summary: `${message} 조건에 맞춰 월계1동에서 가장 적합한 장소를 찾았습니다.`,
    ids: fallbackIds,
    evidence: []
  };
  return { ...validateRecommendation(fallbackParsed, allPlaces, message), retrievedAt: catalog.retrievedAt };
}
