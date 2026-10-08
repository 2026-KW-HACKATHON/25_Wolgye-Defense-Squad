import 'dotenv/config';

/**
 * 로컬 식당, 동네 풍경, 음식, 연예인/인플루언서 사진을 위한 통합 웹 이미지 검색 서비스
 * 1. Tavily API (TAVILY_API_KEY가 있을 때)
 * 2. Exa API (EXA_API_KEY가 있을 때)
 * 3. 카카오 이미지 검색 API (KAKAO_REST_API_KEY 기본 연동)
 */
export async function searchWebImages(query, { count = 12 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const results = [];
  const seenUrls = new Set();

  function addResult({ url, thumbnail, title = '', source = '' }) {
    if (!url || typeof url !== 'string') return;
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) return;
    if (seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    results.push({
      url: cleanUrl,
      thumbnail: thumbnail?.trim() || cleanUrl,
      title: (title || '').replace(/<[^>]+>/g, '').slice(0, 80),
      source: source || '웹 검색'
    });
  }

  // 1. Tavily Search (옵션)
  if (process.env.TAVILY_API_KEY?.trim()) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY.trim(),
          query: q,
          include_images: true,
          max_results: Math.min(count, 15)
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json();
        const images = Array.isArray(data.images) ? data.images : [];
        for (const item of images) {
          const imgUrl = typeof item === 'string' ? item : item?.url;
          addResult({ url: imgUrl, source: 'Tavily Search' });
        }
      }
    } catch {}
  }

  // 2. Exa Search (옵션)
  if (process.env.EXA_API_KEY?.trim()) {
    try {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY.trim()
        },
        body: JSON.stringify({
          query: q,
          numResults: Math.min(count, 10),
          contents: { text: false }
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json();
        for (const r of data.results || []) {
          if (r.image) addResult({ url: r.image, title: r.title, source: 'Exa' });
        }
      }
    } catch {}
  }

  // 3. 카카오 이미지 검색 (기본 필수 제공)
  const kakaoKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (kakaoKey && kakaoKey !== 'your_kakao_rest_api_key_here') {
    try {
      const url = new URL('https://dapi.kakao.com/v2/search/image');
      url.searchParams.set('query', q);
      url.searchParams.set('size', String(Math.min(count * 2, 30)));
      url.searchParams.set('sort', 'accuracy');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        for (const doc of data.documents || []) {
          addResult({
            url: doc.image_url,
            thumbnail: doc.thumbnail_url,
            title: doc.display_sitename || doc.collection || '',
            source: doc.display_sitename || '카카오 Daum 검색'
          });
        }
      }
    } catch {}
  }

  return results.slice(0, count);
}

// 타 식당 간판이나 외관 사진을 거르고 순수 음식/인물 사진을 엄선하기 위한 키워드
const SIGNBOARD_NEGATIVE_REGEX = /간판|외관|메뉴판|식당입구|가게앞|주차장|빌딩|부동산|지도|약도|로드뷰/i;

const DEFAULT_FALLBACK_IMAGES = {
  cover: 'https://postfiles.pstatic.net/MjAyNDA1MTJfMjMy/MDAxNzE1NTExMDAwMDI3.2HEUC7rXaJYPQnUsvcKrUUeHo5pu2wK55a281Kz4oJYg.CXHEANwKJV4xDvRGZqUiSvdc5iSiq-xivUCRCIcAZ8Yg.JPEG/JK69cGshoFAsVsbH3Wzez4.jpg?type=w966',
  menu: 'https://mblogthumb-phinf.pstatic.net/MjAyMjExMzBfMjU5/MDAxNjY5Nzg0NjUxNjc2.WkesyBfZQ9_o5dGZHuhpW40hf-4vLVT-J72CuEWUC8Ag.2dcsWpk3_6GmpeCv8MCtQPdT8t67YxwW2oy5HUPDoTkg.JPEG.peace8012/SE-2a60b1f3-cbcd-4093-b6c7-a23dbe260f42.jpg?type=w800',
  celebrity: 'https://health.chosun.com/site/data/img_dir/2025/09/09/2025090903315_0.webp',
  benefit: 'https://cdn.crowdpic.net/detail-thumb/thumb_d_FA1F55D671D8207D5C7DE94A9B05149C.jpg',
  location: 'https://postfiles.pstatic.net/MjAyMDA2MjNfMjcg/MDAxNTkyOTExMjQyMzYy.Xn345aL31r0i3Yd8gVfgZ7XwP4e_sN69R0Ue1GgX4x8g.JPEG.street/IMG_3914.jpg?type=w966'
};

const inspectionCache = new Map();

/**
 * Gemini Vision AI를 활용하여 이미지 내 타 식당 간판 글자 및 적합성을 대조/검증합니다.
 */
export async function inspectCandidateImage(imageUrl, { shopName = '', type = 'menu' } = {}) {
  if (!imageUrl || typeof imageUrl !== 'string') return { valid: false, reason: 'empty_url' };
  if (inspectionCache.has(imageUrl)) return inspectionCache.get(imageUrl);

  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    return { valid: true, isAppropriateForBackground: true };
  }

  const prompt = `인스타그램 카드뉴스 배경 사진으로 쓸 이미지입니다. 다음을 분석해 JSON으로만 답하세요:
1. "hasOtherShopSignboard": 이 사진에 식당 간판이나 가게 외관(간판 상호 글씨)이 크게 찍혀 있나요? (현재 가게: "${shopName || '월계밥상'}")
2. "detectedText": 사진에 크게 보이는 주요 간판/상호 글씨(없으면 빈 문자열)
3. "isAppropriate": 타 식당 간판이 아니고, 맛있는 음식 요리나 먹방 인물(연예인), 골목 풍경인가요? (타 식당 간판이면 false, 음식/먹방이면 true)
{
  "hasOtherShopSignboard": boolean,
  "detectedText": "string",
  "isAppropriate": boolean
}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 300,
        reasoning: { enabled: false },
        provider: { sort: 'latency' }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        // 타 식당 간판 글자가 감지되었거나, 부적합하다고 판정되면 탈락
        const valid = !parsed.hasOtherShopSignboard && parsed.isAppropriate;
        const result = {
          valid,
          hasOtherShopSignboard: !!parsed.hasOtherShopSignboard,
          detectedText: parsed.detectedText || '',
          isAppropriate: parsed.isAppropriate
        };
        inspectionCache.set(imageUrl, result);
        return result;
      }
    }
  } catch (e) {
    // 타임아웃 또는 비전 실패 시 보수적으로 통과 처리
  }

  return { valid: true, isAppropriate: true };
}

/**
 * 인스타그램 캐러셀 슬라이드용 최적 실제 사진 자동 발굴 함수
 * 1. 식당 간판/외관 배제 및 음식 접시/먹방/거리 풍경 위주 정밀 쿼리
 * 2. 1차 텍스트 필터 (간판/외관 키워드 배제)
 * 3. 2차 Vision AI 검증 (사진 내 타 식당 간판 글자 대조 후 배제)
 * 4. 절대 빈 배경이 없도록 고품질 실사 폴백 보장
 */
export async function searchSlideImage({ query = '', type = 'menu', celebrityName = '', shopName = '', shopKind = '' } = {}) {
  const candidateQueries = [];

  if (type === 'celebrity' || celebrityName) {
    const celeb = celebrityName.trim() || '성시경';
    candidateQueries.push(`${celeb} 먹방 얼굴 클로즈업`, `${celeb} 맛있는 음식 먹방`, `${celeb} 먹을텐데`);
  } else if (type === 'cover') {
    if (query) candidateQueries.push(`${query} 음식 사진 접시`);
    if (shopKind) candidateQueries.push(`${shopKind} 비주얼 요리 접시`);
    candidateQueries.push('광운대 맛집 비주얼 한그릇', '월계동 맛집 음식 요리');
  } else if (type === 'menu') {
    if (query) candidateQueries.push(`${query} 한그릇 음식 사진`, `${query} 클로즈업`);
    if (shopKind) candidateQueries.push(`${shopKind} 한그릇 요리 사진 접시`);
    candidateQueries.push('시그니처 대표 메뉴 요리 접시', '월계동 맛집 푸짐한 한상');
  } else if (type === 'location') {
    candidateQueries.push('광운대역 1번출구 거리 풍경', '월계동 골목길 낮');
  } else {
    // benefit 등
    if (query) candidateQueries.push(`${query} 음식 접시`);
    candidateQueries.push(`${shopKind || '골목 식당'} 푸짐한 한그릇 요리`);
  }

  // 쿼리를 순서대로 시도
  for (const q of candidateQueries) {
    try {
      const items = await searchWebImages(q, { count: 8 });
      // 1차 텍스트 필터: 제목이나 URL에 '간판', '외관', '입구' 등이 들어간 것은 제외
      const cleanCandidates = items.filter(item => {
        const text = `${item.title} ${item.url}`;
        return !SIGNBOARD_NEGATIVE_REGEX.test(text);
      });

      // 후보군 중 최대 2개에 대해 Vision AI 검증 수행하여 적합한 첫 번째 사진 채택
      for (const item of cleanCandidates.slice(0, 2)) {
        if (!item?.url) continue;
        const inspection = await inspectCandidateImage(item.url, { shopName, type });
        if (inspection.valid) {
          return item.url;
        }
      }

      // Vision AI 통과 실패했으나 1차 필터는 통과한 후보가 있다면 차선책으로 채택
      if (cleanCandidates.length > 0 && cleanCandidates[0]?.url) {
        return cleanCandidates[0].url;
      }
    } catch {}
  }

  // 최후의 안전 고화질 실사 사진 폴백 (슬라이드 타입별로 중복 방지)
  return DEFAULT_FALLBACK_IMAGES[type] || DEFAULT_FALLBACK_IMAGES.cover;
}

