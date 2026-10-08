import 'dotenv/config';
import {chat, chatJSON, textModel} from '../server/services/llm.js';
import {cleanCard, cleanCarousel, POSTER_GUIDE, CAROUSEL_GUIDE} from '../server/services/posterCard.js';
import {searchSlideImage} from '../server/services/imageSearch.js';
import {ownerMarketingStore as store} from '../server/services/ownerMarketingStore.js';

async function runVerification() {
  console.log('🚀 [검증 시작] 사장님 마케팅 스튜디오 E2E 파이프라인 검증');
  console.log('📋 환경:');
  console.log(`- OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '설정됨 (앞자리 ' + process.env.OPENROUTER_API_KEY.slice(0, 10) + '...)' : '미설정'}`);
  console.log(`- KAKAO_REST_API_KEY: ${process.env.KAKAO_REST_API_KEY ? '설정됨' : '미설정'}`);
  console.log(`- AI_TEXT_MODEL: ${process.env.AI_TEXT_MODEL || textModel()}`);

  const userPrompt = '우리 가게가 함바집이긴 한데 여대생으로도 고객층을 확장하려하거든, 일주일간 여대생으로 대상으로 30% 할인 행사를 하니, 그러니 인기 남자아이돌을 이용해줘.';
  const mockPlace = {
    id: 'test-hamba-01',
    name: '월계 든든 함바식당',
    kind: '한식/뷔페'
  };

  console.log('\n======================================================');
  console.log('테스트 1: 빠른 실시간 마케팅 대화 (Fast Chat Ideation)');
  console.log(`입력: "${userPrompt}"`);
  console.log('======================================================');

  const chatStart = Date.now();
  const systemChat = `당신은 월계1동 골목 식당 [${mockPlace.name} (${mockPlace.kind})] 사장님의 친절하고 유능한 1:1 전담 AI 마케팅 파트너입니다.
[역할 및 지침]
- 사장님이 홍보 고민, 할인 이벤트, 특정 메뉴, 연예인 추천을 이야기하면, 다정하고 명쾌한 마케팅 조언과 함께 핵심 카피 아이디어를 2~4문장으로 제안하세요.
- 절대 JSON이나 기술적인 코드를 출력하지 말고, 자연스러운 한국어 대화체로 답변하세요.
- 사장님과의 대화를 통해 이벤트 내용의 틀이 잡히면, "사장님, 말씀해 주신 내용으로 인스타 카드뉴스나 포스터를 바로 제작해 드릴까요?"라고 자연스럽게 권유하세요.`;

  const chatReply = await chat([
    {role: 'system', content: systemChat},
    {role: 'user', content: userPrompt}
  ], {
    model: process.env.OWNER_TEXT_MODEL || textModel(),
    temperature: 0.7,
    maxTokens: 450,
    timeout: 30000
  });

  console.log(`⏱️ 응답 소요 시간: ${((Date.now() - chatStart) / 1000).toFixed(2)}초`);
  console.log(`💬 AI 파트너 답변:\n${chatReply.trim()}`);

  const chatHistory = [
    {role: 'user', content: userPrompt},
    {role: 'assistant', content: chatReply.trim()}
  ];

  console.log('\n======================================================');
  console.log('테스트 2: 인스타그램 캐러셀 카드뉴스 & 스토리 (One-Pass Synthesis)');
  console.log('대화 내역을 바탕으로 남자 아이돌 + 여대생 30% 할인 카드뉴스 생성');
  console.log('======================================================');

  const carouselStart = Date.now();
  const conversationContext = `\n[누적 대화 내역]\n${chatHistory.map(h => `${h.role === 'user' ? '사장님' : '마케터'}: ${h.content}`).join('\n')}\n`;

  const systemCarousel = `당신은 인스타그램 전문 바이럴 마케터입니다. 월계1동 [${mockPlace.name} (${mockPlace.kind})] 사장님의 인스타그램 캐러셀(슬라이드 카드뉴스 3~5장)을 원패스로 기획하세요.
${conversationContext}
사장님 추가 요청: "${userPrompt}"
[원칙]
1. 대화 내역에 특정 연예인, 아이돌, 셀럽이 언급되어 있다면(예: 인기 남자아이돌 언급 시 차은우, 방탄소년단 정국/뷔, 라이즈, 투어스 등 가장 인기 있는 실존 남자 아이돌을 명시), 절대로 바꾸지 말고 그 인물(celebrityName 및 imageQuery)을 주인공으로 추천 슬라이드를 기획하세요!
2. 여대생 30% 할인 이벤트 혜택과 함바집의 갓성비·집밥 매력을 트렌디하게 연결하세요.
3. 5~7개의 타깃 해시태그와 고화질 실사 이미지 검색어(imageQuery)를 명확히 작성하세요.
반드시 유효한 JSON만 반환하세요:
${CAROUSEL_GUIDE}`;

  const rawCarouselData = await chatJSON([
    {role: 'system', content: systemCarousel}
  ], {
    model: process.env.OWNER_TEXT_MODEL || textModel(),
    temperature: 0.7,
    maxTokens: 1200,
    timeout: 60000
  });

  const carousel = cleanCarousel(rawCarouselData);
  if (!carousel) {
    throw new Error('❌ 캐러셀 데이터 정규화 실패!');
  }
  carousel.aspectRatio = '4:5';

  console.log(`⏱️ LLM 생성 소요 시간: ${((Date.now() - carouselStart) / 1000).toFixed(2)}초`);
  console.log(`📌 콘셉트: ${carousel.concept}`);
  console.log(`🏷️ 해시태그 (${carousel.hashtags?.length || 0}개): ${carousel.hashtags?.join(' ')}`);
  console.log(`📑 슬라이드 수: ${carousel.slides.length}장`);

  console.log('\n🔍 [이미지 검색 & 바인딩 테스트]');
  await Promise.all(carousel.slides.map(async (s, idx) => {
    console.log(`[슬라이드 ${idx + 1}] 타입: ${s.type} | 제목: "${s.title}" | 셀럽: ${s.celebrityName || '없음'} | 검색어: "${s.imageQuery}"`);
    s.image = await searchSlideImage({
      query: s.imageQuery,
      type: s.type,
      celebrityName: s.celebrityName,
      shopName: mockPlace.name,
      shopKind: mockPlace.kind
    });
    console.log(`  -> 바인딩된 이미지: ${s.image ? s.image.slice(0, 75) + '...' : '기본 이미지 사용'}`);
  }));

  console.log('\n======================================================');
  console.log('테스트 3: 단일 상업용 포스터 (One-Pass Synthesis & Web Image Binding)');
  console.log('======================================================');

  const posterStart = Date.now();
  const systemPoster = `당신은 소셜 미디어 전문 크리에이티브 디렉터입니다. 월계1동 [${mockPlace.name} (${mockPlace.kind})] 사장님의 상업용 프로모션 포스터를 원패스(One-Pass)로 완성하세요.
${conversationContext}
사장님 추가 요청: "${userPrompt}"
[원칙]
1. 대화 내역에서 언급된 할인율(여대생 30% 할인), 혜택, 특정 인물(인기 남자아이돌), 메뉴명 등을 반드시 정확히 반영하세요.
2. 배경으로 쓸 실제 음식/매장 사진의 웹 검색어(imageQuery)를 정확히 명시하세요.
3. 반드시 유효한 JSON만 반환하세요:
${POSTER_GUIDE}`;

  const rawPosterData = await chatJSON([
    {role: 'system', content: systemPoster}
  ], {
    model: process.env.OWNER_TEXT_MODEL || textModel(),
    temperature: 0.6,
    maxTokens: 700,
    timeout: 45000
  });

  const card = cleanCard(rawPosterData);
  if (!card) {
    throw new Error('❌ 포스터 데이터 정규화 실패!');
  }

  const posterQuery = rawPosterData.imageQuery || `${mockPlace.name} ${card.title} 음식 사진`;
  console.log(`[포스터] 제목: "${card.title}" | 혜택: "${card.benefit}" | 검색어: "${posterQuery}"`);

  const bgImg = await searchSlideImage({
    query: posterQuery,
    type: 'menu',
    shopName: mockPlace.name,
    shopKind: mockPlace.kind
  });
  if (bgImg) card.bgImage = bgImg;
  console.log(`  -> 바인딩된 포스터 배경: ${card.bgImage ? card.bgImage.slice(0, 75) + '...' : '기본 이미지'}`);

  console.log('\n======================================================');
  console.log('테스트 4: 자동 영구 보관 (Auto-Persistence to Store)');
  console.log('======================================================');

  const savedCarouselProposal = await store.saveProposal(mockPlace.id, {
    brief: userPrompt,
    format: 'portrait',
    copy: `[${carousel.concept}] ${carousel.slides.map(s => s.title).join(' / ')}`,
    carousel
  });
  console.log(`✅ 캐러셀 제안 저장 성공! (ID: ${savedCarouselProposal?.id})`);

  const savedPosterProposal = await store.saveProposal(mockPlace.id, {
    brief: userPrompt,
    format: 'portrait',
    copy: `[${card.title}] ${card.benefit}\n${card.body}`,
    card
  });
  console.log(`✅ 포스터 제안 저장 성공! (ID: ${savedPosterProposal?.id})`);

  const storedList = await store.proposals(mockPlace.id);
  console.log(`📦 보관함 조회 결과: 총 ${storedList.length}건 보관 중`);
  storedList.forEach((item, idx) => {
    console.log(`  [${idx + 1}] ID: ${item.id} | 유형: ${item.carousel ? '캐러셀' : '포스터'} | 요약: "${item.brief?.slice(0, 30)}..." | 생성일: ${item.createdAt}`);
  });

  console.log('\n🎉 [검증 완료] 모든 파이프라인(대화 -> 캐러셀/스토리 -> 단일 포스터 -> 실사 이미지 바인딩 -> 보관함 저장)이 정상 작동함을 확인했습니다!');
}

runVerification().catch(err => {
  console.error('❌ 검증 중 에러 발생:', err);
  process.exit(1);
});

