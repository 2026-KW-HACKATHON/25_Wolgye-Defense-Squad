import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load restaurants data
const restaurantsPath = path.join(__dirname, '../data/restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(restaurantsPath, 'utf8'));

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

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
 * Extract requirements from user message and select 3 best restaurants
 */
export async function processChatRecommendation(userMessage, conversationHistory = []) {
  // Fallback defaults
  let extracted = {
    budget: null,
    people: 1,
    breakTime: null,
    keywords: []
  };

  // Rule-based regex extraction as baseline
  const budgetMatch = userMessage.match(/(\d+)\s*(만\s*원|천\s*원|원)/);
  if (budgetMatch) {
    let num = parseInt(budgetMatch[1], 10);
    if (budgetMatch[2].includes('만')) num *= 10000;
    else if (budgetMatch[2].includes('천')) num *= 1000;
    extracted.budget = num;
  }

  const breakTimeMatch = userMessage.match(/공강\s*(\d+)\s*분/);
  if (breakTimeMatch) {
    extracted.breakTime = parseInt(breakTimeMatch[1], 10);
  }

  const peopleMatch = userMessage.match(/(\d+)\s*명|혼자|혼밥/);
  if (peopleMatch) {
    if (userMessage.includes('혼자') || userMessage.includes('혼밥')) {
      extracted.people = 1;
      extracted.keywords.push('혼밥');
    } else if (peopleMatch[1]) {
      extracted.people = parseInt(peopleMatch[1], 10);
    }
  }

  if (userMessage.includes('매콤') || userMessage.includes('매운')) extracted.keywords.push('매운맛');
  if (userMessage.includes('파스타') || userMessage.includes('양식')) extracted.keywords.push('양식');
  if (userMessage.includes('국수') || userMessage.includes('면') || userMessage.includes('우동')) extracted.keywords.push('일식', '따뜻한국물');
  if (userMessage.includes('가성비') || userMessage.includes('싸고')) extracted.keywords.push('가성비');

  // Score candidate restaurants
  const scored = restaurants.map(r => {
    let score = 0;
    
    // Priority for local small business
    if (r.isLocal) score += 15;

    // Budget check
    if (extracted.budget) {
      if (r.avgPrice <= extracted.budget) score += 20;
      else score -= 30;
    }

    // Break time feasibility
    const roundTrip = r.walkingTimeMin * 2;
    const totalTime = roundTrip + r.diningTimeMin;
    if (extracted.breakTime) {
      if (totalTime <= extracted.breakTime) score += 15;
      else score -= 25;
    }

    // Keyword matching
    for (const kw of extracted.keywords) {
      if (r.tags.some(t => t.includes(kw)) || r.category.includes(kw) || r.name.includes(kw)) {
        score += 10;
      }
    }

    // Default diversity small noise
    return { ...r, score, totalTime, roundTrip };
  });

  scored.sort((a, b) => b.score - a.score);
  const selectedRestaurants = scored.slice(0, 3);

  // Generate conversational response with LLM
  let aiMessage = '';
  try {
    const prompt = `당신은 광운대학교 인근 로컬 미식 추천 AI 에이전트입니다.
사용자 요청: "${userMessage}"
추천할 식당 3곳:
1. ${selectedRestaurants[0].name} (${selectedRestaurants[0].category}, 도보 ${selectedRestaurants[0].walkingTimeMin}분, 평균 ${selectedRestaurants[0].avgPrice.toLocaleString()}원)
2. ${selectedRestaurants[1].name} (${selectedRestaurants[1].category}, 도보 ${selectedRestaurants[1].walkingTimeMin}분, 평균 ${selectedRestaurants[1].avgPrice.toLocaleString()}원)
3. ${selectedRestaurants[2].name} (${selectedRestaurants[2].category}, 도보 ${selectedRestaurants[2].walkingTimeMin}분, 평균 ${selectedRestaurants[2].avgPrice.toLocaleString()}원)

다음 규칙에 맞추어 사용자에게 대화 답변을 작성하세요:
- 1~2문장으로 친절하고 경쾌하게 인사 및 조건에 맞춘 요약을 제공하세요.
- 이모지(🥢, 🍽️ 등)를 적절히 사용하세요.
- 식당 세부 정보는 아래 카드에서 볼 수 있으므로, 본문에서는 긴 목록 대신 요약 멘트만 작성하세요.
예시: "딱 맞는 곳 3곳을 찾았어요! 혼밥하기 편하고 만 원 이내 식당들이에요 🥢"`;

    aiMessage = await callNIM([
      { role: 'system', content: '친절하고 간결한 광운대 로컬 미식 AI 어시스턴트입니다.' },
      { role: 'user', content: prompt }
    ]);
  } catch (err) {
    console.warn('NIM fallback to template message:', err.message);
    const condDesc = extracted.keywords.length > 0 ? extracted.keywords.join(', ') : '인기';
    aiMessage = `딱 맞는 곳 3곳을 찾았어요! ${condDesc} 조건에 맞고 광운대 인근에서 평이 좋은 식당들이에요 🥢`;
  }

  return {
    aiMessage: aiMessage.trim(),
    restaurants: selectedRestaurants,
    extracted
  };
}

/**
 * Handle restaurant selection and prepare KakaoTalk share preview
 */
export async function prepareShareApproval(restaurantId, userMessage = '') {
  const target = restaurants.find(r => r.id === restaurantId) || restaurants[0];

  const shareTitle = `🍜 오늘 점심 추천: ${target.name} (광운대 인근)`;
  const shareDescription = `${target.tags.join('·')} 맞춤 식당이에요. 도보 ${target.walkingTimeMin}분 거리, 1인 평균 ${target.avgPrice.toLocaleString()}원.`;
  const shareAddress = target.address;

  let aiIntro = `${target.name}을(를) 선택하셨군요! 카카오톡으로 친구에게 공유할까요? 😊`;

  try {
    const prompt = `사용자가 광운대 식당 '${target.name}'(${target.category}, 도보 ${target.walkingTimeMin}분, 평균 ${target.avgPrice.toLocaleString()}원)을 선택했습니다.
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
