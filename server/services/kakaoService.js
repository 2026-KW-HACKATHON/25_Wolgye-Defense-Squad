// 광운대학교 중심 좌표 (WGS84)
const KW_COORD = {
  x: '127.0583', // 경도 (longitude)
  y: '37.6193'   // 위도 (latitude)
};

const KAKAO_LOCAL_API_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';
const KAKAO_BLOG_API_URL = 'https://dapi.kakao.com/v2/search/blog';

/**
 * HTML 태그 제거 및 텍스트 정제
 */
function cleanHtml(text = '') {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * 카카오 블로그 검색을 통해 특정 식당의 실시간 리뷰 인용문 및 사진 가져오기
 */
export async function fetchBlogSnippetForPlace(placeName, apiKey) {
  try {
    const blogUrl = new URL(KAKAO_BLOG_API_URL);
    blogUrl.searchParams.set('query', `광운대 ${placeName}`);
    blogUrl.searchParams.set('size', '1');
    blogUrl.searchParams.set('sort', 'accuracy');

    const res = await fetch(blogUrl.toString(), {
      headers: { 'Authorization': `KakaoAK ${apiKey}` }
    });

    if (res.ok) {
      const data = await res.json();
      const doc = data.documents?.[0];
      if (doc) {
        const cleanQuote = cleanHtml(doc.contents);
        const sentences = cleanQuote.split(/[.!?]\s+/);
        const quote = sentences[0] ? sentences[0].slice(0, 95) + '...' : cleanQuote.slice(0, 85) + '...';

        return {
          blogQuote: quote,
          blogSource: cleanHtml(doc.blogname) || '네이버/다음 블로그',
          blogUrl: doc.url,
          thumbnail: doc.thumbnail || null
        };
      }
    }
  } catch (err) {
    // Silent fallback
  }

  return null;
}

/**
 * 단일 카카오맵 키워드 검색
 */
async function queryKakaoSingle(keyword, apiKey, radius = 2000) {
  const localUrl = new URL(KAKAO_LOCAL_API_URL);
  localUrl.searchParams.set('query', keyword.includes('광운대') ? keyword : `광운대 ${keyword}`);
  localUrl.searchParams.set('category_group_code', 'FD6'); // 음식점
  localUrl.searchParams.set('x', KW_COORD.x);
  localUrl.searchParams.set('y', KW_COORD.y);
  localUrl.searchParams.set('radius', radius.toString());
  localUrl.searchParams.set('sort', 'accuracy');
  localUrl.searchParams.set('size', '15');

  try {
    const res = await fetch(localUrl.toString(), {
      headers: { 'Authorization': `KakaoAK ${apiKey}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch (e) {
    return [];
  }
}

/**
 * 다중 키워드 병렬 검색 (PRD: 유사어/카테고리 확장 검색어로 카카오맵 다회 탐색)
 */
export async function searchKakaoMultiQuery(keywords = ['맛집'], radius = 2000) {
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    throw new Error('KAKAO_REST_API_KEY가 .env 파일에 설정되지 않았습니다.');
  }

  // 검색 키워드 정규화
  let queryList = Array.isArray(keywords) && keywords.length > 0 ? [...keywords] : ['맛집'];
  // 안전하게 상위 4개만 실행
  queryList = queryList.slice(0, 4);

  // 병렬로 카카오맵 API 검색
  const resultsByKeyword = await Promise.all(
    queryList.map(kw => queryKakaoSingle(kw, apiKey, radius))
  );

  // 중복 식당 제거 (ID 기준)
  const placeMap = new Map();

  resultsByKeyword.forEach((docs, kwIdx) => {
    const kw = queryList[kwIdx];
    docs.forEach(doc => {
      if (!placeMap.has(doc.id)) {
        const distanceMeters = parseInt(doc.distance || '300', 10);
        const walkingTimeMin = Math.max(1, Math.round(distanceMeters / 70));

        let avgPrice = 8500;
        if (/(분식|국수|김밥|수제비|토스트|떡볶이)/.test(doc.category_name)) avgPrice = 6500;
        else if (/(돈까스|우동|일식|초밥|텐동|라멘)/.test(doc.category_name)) avgPrice = 9500;
        else if (/(중식|마라탕|양꼬치|짜장|짬뽕)/.test(doc.category_name)) avgPrice = 9000;
        else if (/(양식|파스타|피자|버거|스테이크)/.test(doc.category_name)) avgPrice = 11000;
        else if (/(고기|삼겹살|구이|뷔페|족발|갈비|불고기)/.test(doc.category_name)) avgPrice = 16000;
        else if (/(카페|디저트|베이커리)/.test(doc.category_name)) avgPrice = 5000;

        const isKnownFranchise = /(맥도날드|롯데리아|버거킹|써브웨이|스타벅스|메가커피|컴포즈|이디야)/.test(doc.place_name);

        placeMap.set(doc.id, {
          id: `kakao-${doc.id}`,
          kakaoId: doc.id,
          name: doc.place_name,
          matchedKeyword: kw,
          category: doc.category_name.split('>').pop()?.trim() || '음식점',
          fullCategory: doc.category_name,
          tags: [
            doc.category_name.split('>').pop()?.trim() || '맛집',
            isKnownFranchise ? '프랜차이즈' : '골목상권',
            `도보${walkingTimeMin}분`
          ],
          isLocal: !isKnownFranchise,
          walkingTimeMin,
          diningTimeMin: 25,
          distanceMeters,
          avgPrice,
          address: doc.road_address_name || doc.address_name,
          placeUrl: doc.place_url || `https://map.kakao.com/link/map/${doc.id}`
        });
      }
    });
  });

  // 검색 결과가 너무 적으면 광운대 맛집으로 보충 검색
  if (placeMap.size < 5) {
    const backupDocs = await queryKakaoSingle('맛집', apiKey, radius);
    backupDocs.forEach(doc => {
      if (!placeMap.has(doc.id)) {
        const distanceMeters = parseInt(doc.distance || '300', 10);
        const walkingTimeMin = Math.max(1, Math.round(distanceMeters / 70));
        const isKnownFranchise = /(맥도날드|롯데리아|버거킹|써브웨이|스타벅스|메가커피|컴포즈|이디야)/.test(doc.place_name);

        placeMap.set(doc.id, {
          id: `kakao-${doc.id}`,
          kakaoId: doc.id,
          name: doc.place_name,
          matchedKeyword: '맛집',
          category: doc.category_name.split('>').pop()?.trim() || '음식점',
          fullCategory: doc.category_name,
          tags: [
            doc.category_name.split('>').pop()?.trim() || '맛집',
            isKnownFranchise ? '프랜차이즈' : '골목상권',
            `도보${walkingTimeMin}분`
          ],
          isLocal: !isKnownFranchise,
          walkingTimeMin,
          diningTimeMin: 25,
          distanceMeters,
          avgPrice: 8500,
          address: doc.road_address_name || doc.address_name,
          placeUrl: doc.place_url || `https://map.kakao.com/link/map/${doc.id}`
        });
      }
    });
  }

  return Array.from(placeMap.values());
}
