import { searchKakaoMultiQuery, fetchBlogSnippetForPlace } from './kakaoService.js';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Cache recent recommended restaurants in memory for selection flow
const recentRestaurantsCache = new Map();

// 한국어 음식/상황별 카카오맵 연관 키워드 사전
const FOOD_KEYWORD_MAP = [
  { match: /(매콤|매운|얼큰|불|마라|칼칼)/, keywords: ['마라탕', '짬뽕', '닭갈비', '떡볶이', '낙지', '불고기'] },
  { match: /(파스타|스파게티|양식|피자|스테이크|리조또|버거)/, keywords: ['파스타', '양식', '피자', '스테이크'] },
  { match: /(일식|초밥|스시|돈까스|돈카츠|텐동|라멘|우동|덮밥)/, keywords: ['돈까스', '초밥', '텐동', '라멘', '우동'] },
  { match: /(고기|삼겹살|구이|갈비|회식|술|안주|족발|보쌈)/, keywords: ['삼겹살', '고기', '갈비', '족발', '불고기'] },
  { match: /(국수|면|칼국수|수제비|냉면|모밀)/, keywords: ['칼국수', '국수', '수제비', '냉면'] },
  { match: /(국밥|찌개|백반|한식|가정식|탕|해장)/, keywords: ['백반', '순대국', '찌개', '해장국', '한식'] },
  { match: /(분식|김밥|떡볶이|라면|순대|튀김)/, keywords: ['분식', '떡볶이', '김밥', '라면'] },
  { match: /(치킨|닭|통닭|닭강정)/, keywords: ['치킨', '닭강정', '통닭'] },
  { match: /(혼밥|혼자)/, keywords: ['혼밥', '돈까스', '백반', '덮밥', '국수', '분식'] },
  { match: /(가성비|싸고|저렴|싸|학생)/, keywords: ['백반', '분식', '김밥', '국수', '도시락'] },
  { match: /(카페|디저트|커피|베이커리|빵)/, keywords: ['카페', '디저트', '베이커리'] }
];

/**
 * Call NVIDIA NIM API
 */
async function callNIM(messages, options = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in .env');
  }

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.max_tokens ?? 600
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('NVIDIA NIM API Error:', response.status, errorText);
    throw new Error(`NVIDIA NIM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Extract intent and generate expanded Kakao search keywords
 */
function extractSearchIntent(userMessage) {
  const keywords = [];

  // Match predefined synonym groups
  for (const entry of FOOD_KEYWORD_MAP) {
    if (entry.match.test(userMessage)) {
      keywords.push(...entry.keywords);
    }
  }

  let budget = null;
  const budgetMatch = userMessage.match(/(\d+)\s*(만\s*원|천\s*원|원)/);
  if (budgetMatch) {
    let num = parseInt(budgetMatch[1], 10);
    if (budgetMatch[2].includes('만')) num *= 10000;
    else if (budgetMatch[2].includes('천')) num *= 1000;
    budget = num;
  }

  let breakTime = null;
  const breakTimeMatch = userMessage.match(/공강\s*(\d+)\s*분/);
  if (breakTimeMatch) {
    breakTime = parseInt(breakTimeMatch[1], 10);
  }

  const peopleMatch = userMessage.match(/(\d+)\s*명/);
  const people = userMessage.includes('혼자') || userMessage.includes('혼밥')
    ? 1
    : (peopleMatch ? parseInt(peopleMatch[1], 10) : 2);

  // If no specific keyword matched, use broad variety
  if (keywords.length === 0) {
    keywords.push('맛집', '한식', '일식', '중식', '양식');
  }

  // Shuffle and pick 3~4 diverse keywords
  const uniqueKw = Array.from(new Set(keywords));
  uniqueKw.sort(() => Math.random() - 0.5);

  return {
    searchKeywords: uniqueKw.slice(0, 4),
    budget,
    people,
    breakTime
  };
}

/**
 * Process recommendation using multi-query search & dynamic blog enrichment
 */
export async function processChatRecommendation(userMessage, conversationHistory = []) {
  // 1. 사용자 질의 분석 및 키워드 확장
  const extracted = extractSearchIntent(userMessage);

  // 2. 카카오맵 다중 쿼리 병렬 탐색 및 중복 제거
  const candidates = await searchKakaoMultiQuery(extracted.searchKeywords, 2000);

  if (candidates.length === 0) {
    throw new Error('카카오맵 API로부터 검색 결과를 가져오지 못했습니다.');
  }

  // 3. 지능형 스코어링 (예산, 공강시간, 소상공인 우대, 도보거리, 랜덤 믹스)
  const scored = candidates.map(r => {
    let score = 0;

    // 소상공인 골목식당 우대
    if (r.isLocal) score += 20;

    // 도보 거리 점수 (캠퍼스 10분 이내 우대)
    if (r.walkingTimeMin <= 5) score += 15;
    else if (r.walkingTimeMin <= 10) score += 8;
    else score -= 15;

    // 예산 적합도
    if (extracted.budget) {
      if (r.avgPrice <= extracted.budget) score += 25;
      else score -= 35;
    }

    // 공강 시간 적합도
    const roundTrip = (r.walkingTimeMin || 4) * 2;
    const diningTime = r.diningTimeMin || 25;
    const totalTime = roundTrip + diningTime;
    if (extracted.breakTime) {
      if (totalTime <= extracted.breakTime) score += 20;
      else score -= 30;
    }

    // 매칭된 키워드 일치도
    if (userMessage.includes(r.category) || userMessage.includes(r.name)) {
      score += 25;
    }

    // 랜덤 가중치 (0~15)를 주어 같은 검색이라도 항상 5개 고정 식당만 나오는 문제 해결
    score += Math.random() * 15;

    return { ...r, score, totalTime, roundTrip };
  });

  scored.sort((a, b) => b.score - a.score);

  // 4. 다양성(Diversity) 보장 선별: 3곳 추천 시 가능한 서로 다른 업종/카테고리 선별
  const selected = [];
  const selectedCategories = new Set();

  for (const item of scored) {
    if (!selectedCategories.has(item.category) || selected.length >= 2) {
      selected.push(item);
      selectedCategories.add(item.category);
    }
    if (selected.length >= 3) break;
  }

  // 3개 미만이면 남은 순서대로 채움
  if (selected.length < 3) {
    for (const item of scored) {
      if (!selected.some(s => s.id === item.id)) {
        selected.push(item);
      }
      if (selected.length >= 3) break;
    }
  }

  // 5. 선정된 3곳에 대해 실시간 카카오 블로그 리뷰 & 썸네일 병렬 보강
  const apiKey = process.env.KAKAO_REST_API_KEY;
  const enrichedRestaurants = await Promise.all(
    selected.map(async (rest, idx) => {
      const blog = await fetchBlogSnippetForPlace(rest.name, apiKey);
      const imageUrl =
        blog?.thumbnail ||
        `https://images.unsplash.com/photo-${1550000000000 + (idx * 24680) % 100000000}?w=600&auto=format&fit=crop&q=80`;

      const blogQuote =
        blog?.blogQuote ||
        `카카오맵 기준 광운대에서 도보 약 ${rest.walkingTimeMin}분 거리(약 ${rest.distanceMeters}m), ${rest.category} 매장입니다.`;

      const blogSource = blog?.blogSource ? `네이버/다음 블로그 ('${blog.blogSource}')` : '카카오맵 로컬 정보';
      const blogUrl = blog?.blogUrl || rest.placeUrl;

      const finalRest = {
        ...rest,
        imageUrl,
        blogQuote,
        blogSource,
        blogUrl
      };

      recentRestaurantsCache.set(finalRest.id, finalRest);
      return finalRest;
    })
  );

  // 6. NVIDIA NIM 대화형 답변 생성
  let aiMessage = '';
  try {
    const prompt = `당신은 광운대학교 인근 로컬 미식 추천 AI 에이전트입니다.
사용자 요청: "${userMessage}"
카카오맵 실시간 검색으로 엄선한 식당 3곳:
1. ${enrichedRestaurants[0]?.name} (${enrichedRestaurants[0]?.category}, 도보 ${enrichedRestaurants[0]?.walkingTimeMin}분, 평균 약 ${enrichedRestaurants[0]?.avgPrice?.toLocaleString()}원)
2. ${enrichedRestaurants[1]?.name} (${enrichedRestaurants[1]?.category}, 도보 ${enrichedRestaurants[1]?.walkingTimeMin}분, 평균 약 ${enrichedRestaurants[1]?.avgPrice?.toLocaleString()}원)
3. ${enrichedRestaurants[2]?.name} (${enrichedRestaurants[2]?.category}, 도보 ${enrichedRestaurants[2]?.walkingTimeMin}분, 평균 약 ${enrichedRestaurants[2]?.avgPrice?.toLocaleString()}원)

다음 규칙에 맞추어 사용자에게 대화 답변을 작성하세요:
- 1~2문장으로 친절하고 경쾌하게 인사 및 조건에 맞춘 요약을 제공하세요.
- 이모지(🥢, 🍽️ 등)를 적절히 사용하세요.
- 식당 세부 정보는 아래 카드에서 볼 수 있으므로, 본문에서는 긴 목록 대신 요약 멘트만 작성하세요.
예시: "카카오맵 실시간 검색 결과, 조건에 딱 맞는 광운대 맛집 3곳을 찾았어요! 🥢"`;

    aiMessage = await callNIM([
      { role: 'system', content: '친절하고 간결한 광운대 로컬 미식 AI 어시스턴트입니다.' },
      { role: 'user', content: prompt }
    ]);
  } catch (err) {
    aiMessage = `카카오맵 실시간 검색으로 조건에 딱 맞는 광운대 인근 맛집 3곳을 찾았어요! 🥢`;
  }

  return {
    aiMessage: aiMessage.trim(),
    restaurants: enrichedRestaurants,
    extracted,
    dataSource: 'kakao_maps_api'
  };
}

/**
 * Handle restaurant selection and prepare KakaoTalk share preview
 */
export async function prepareShareApproval(restaurantId, userMessage = '') {
  const target = recentRestaurantsCache.get(restaurantId) || {
    id: restaurantId,
    name: '광운대 추천 맛집',
    category: '로컬 맛집',
    tags: ['광운대', '맛집'],
    walkingTimeMin: 4,
    diningTimeMin: 25,
    avgPrice: 8500,
    address: '서울 노원구 광운로 (광운대 인근)',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    blogQuote: '광운대 학생들이 추천하는 가성비 로컬 맛집',
    blogSource: '카카오맵 & 블로그',
    blogUrl: 'https://map.kakao.com'
  };

  const shareTitle = `🍜 오늘 점심 추천: ${target.name} (광운대 인근)`;
  const shareDescription = `${target.tags ? target.tags.join('·') : target.category} 식당이에요. 도보 ${target.walkingTimeMin}분 거리, 1인 평균 약 ${target.avgPrice?.toLocaleString()}원.`;
  const shareAddress = target.address;

  let aiIntro = `${target.name}을(를) 선택하셨군요! 카카오톡으로 친구에게 공유할까요? 😊`;

  try {
    const prompt = `사용자가 광운대 식당 '${target.name}'(${target.category}, 도보 ${target.walkingTimeMin}분, 평균 ${target.avgPrice?.toLocaleString()}원)을 선택했습니다.
친구에게 카카오톡으로 공유할지 확인하는 친절한 한 문장 승인 요청 메시지를 작성하세요.
예시: "${target.name}을 선택하셨군요! 카카오톡으로 친구에게 공유할까요? 😊"`;

    const res = await callNIM([
      { role: 'system', content: '간결하고 친절한 코딩/협업 에이전트 스타일의 승인 요청 메시지를 작성하세요.' },
      { role: 'user', content: prompt }
    ], { max_tokens: 100 });
    if (res && res.length < 120) {
      aiIntro = res.trim();
    }
  } catch (e) {
    // Keep default
  }

  return {
    aiIntro,
    restaurant: target,
    shareCard: {
      title: shareTitle,
      description: shareDescription,
      address: shareAddress,
      imageUrl: target.imageUrl,
      link: target.blogUrl,
      price: target.avgPrice,
      walkingTime: target.walkingTimeMin
    }
  };
}
