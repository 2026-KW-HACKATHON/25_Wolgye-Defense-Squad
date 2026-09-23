import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 광운대학교 중심 좌표 (WGS84)
const KW_COORD = {
  x: '127.0583', // 경도 (longitude)
  y: '37.6193'   // 위도 (latitude)
};

const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

// 로컬 사전 수집 데이터셋 (폴백용)
const fallbackPath = path.join(__dirname, '../data/restaurants.json');
const fallbackRestaurants = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));

/**
 * 카카오맵 로컬 키워드 검색 API 호출
 * @param {string} query 검색 키워드 (예: '광운대 맛집', '광운대 분식')
 * @param {number} radius 반경(미터), 기본 1500m
 */
export async function searchKakaoRestaurants(query, radius = 1500) {
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey || apiKey === 'your_kakao_rest_api_key_here') {
    // 키가 없으면 로컬 광운대 데이터셋 활용
    return {
      source: 'local_fallback',
      items: filterLocalFallback(query)
    };
  }

  try {
    const url = new URL(KAKAO_API_URL);
    url.searchParams.set('query', query.includes('광운대') ? query : `광운대 ${query}`);
    url.searchParams.set('category_group_code', 'FD6'); // 음식점
    url.searchParams.set('x', KW_COORD.x);
    url.searchParams.set('y', KW_COORD.y);
    url.searchParams.set('radius', radius.toString());
    url.searchParams.set('sort', 'accuracy');
    url.searchParams.set('size', '10');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });

    if (!res.ok) {
      console.warn(`Kakao API failed with status ${res.status}, falling back to local dataset`);
      return {
        source: 'local_fallback',
        items: filterLocalFallback(query)
      };
    }

    const data = await res.json();
    const documents = data.documents || [];

    if (documents.length === 0) {
      return {
        source: 'local_fallback',
        items: filterLocalFallback(query)
      };
    }

    // 카카오맵 검색 결과를 우리 서비스 포맷으로 변환
    const mapped = documents.map((doc, idx) => {
      const distanceMeters = parseInt(doc.distance || '300', 10);
      // 성인 평균 도보 속도: 분당 약 65~70m
      const walkingTimeMin = Math.max(1, Math.round(distanceMeters / 70));
      
      // 대략적인 평균 가격 추정 (카테고리 기반)
      let avgPrice = 8000;
      if (doc.category_name.includes('분식')) avgPrice = 6000;
      else if (doc.category_name.includes('일식') || doc.category_name.includes('양식')) avgPrice = 11000;
      else if (doc.category_name.includes('고기') || doc.category_name.includes('구이')) avgPrice = 16000;

      // 프랜차이즈 식당 제외 또는 소상공인 판별
      const isKnownFranchise = /(맥도날드|롯데리아|버거킹|써브웨이|스타벅스|메가커피|컴포즈)/.test(doc.place_name);
      const isLocal = !isKnownFranchise;

      return {
        id: `kakao-${doc.id}`,
        name: doc.place_name,
        category: doc.category_name.split('>').pop()?.trim() || '음식점',
        tags: [doc.category_name.split('>').pop()?.trim() || '맛집', isLocal ? '골목상권' : '프랜차이즈'],
        isLocal,
        walkingTimeMin,
        diningTimeMin: 25,
        avgPrice,
        address: doc.road_address_name || doc.address_name,
        imageUrl: `https://images.unsplash.com/photo-${1550000000000 + (idx * 123456) % 100000000}?w=600&auto=format&fit=crop&q=80`,
        blogQuote: `광운대 인근 ${doc.place_name}, 카카오맵 실시간 탐색 결과 도보 ${walkingTimeMin}분 거리 로컬 음식점`,
        blogSource: '카카오맵 로컬 실시간 정보',
        blogUrl: doc.place_url || `https://map.kakao.com/link/map/${doc.id}`
      };
    });

    return {
      source: 'kakao_api',
      items: mapped
    };
  } catch (error) {
    console.error('Kakao API search error:', error.message);
    return {
      source: 'local_fallback',
      items: filterLocalFallback(query)
    };
  }
}

/**
 * 로컬 사전 데이터셋에서 키워드 필터링
 */
function filterLocalFallback(query) {
  const q = query.toLowerCase();
  return fallbackRestaurants.filter(r => 
    r.name.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    r.tags.some(t => t.toLowerCase().includes(q))
  ).concat(fallbackRestaurants); // 부족하면 전체 반환
}
