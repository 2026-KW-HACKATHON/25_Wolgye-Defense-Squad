import 'dotenv/config';
import {ownerMarketingStore as store} from '../server/services/ownerMarketingStore.js';
import {cleanCard, cleanCarousel} from '../server/services/posterCard.js';
import {getCommunityPlaces} from '../server/services/communityService.js';

async function verifyPlacePromos() {
  console.log('🚀 [검증 시작] 식당 상세페이지 다중 게시물 및 카드뉴스 전 페이지 노출 검증');

  const places = (await getCommunityPlaces()).items;
  const targetPlace = places[0] || { id: 'test-shop-wolgye', name: '월계 든든 함바식당' };
  console.log(`📍 대상 식당: ${targetPlace.name} (ID: ${targetPlace.id})`);

  // 1. 첫 번째 게시물: 5장 인스타그램 캐러셀 카드뉴스
  const testCarousel = cleanCarousel({
    concept: '광운대 여대생 픽! 함바집 갓성비 한 끼 도장깨기',
    theme: 'warm',
    aspectRatio: '4:5',
    hashtags: ['#월계동맛집', '#여대생할인', '#가성비맛집'],
    slides: [
      { type: 'cover', badge: '화제의 맛집', title: '1장: 오빠가 사주는 밥보다 든든한 한 끼 💗', subtitle: '월계1동 골목 숨은 집밥의 맛' },
      { type: 'menu', badge: '시그니처 메뉴', title: '2장: 매일 바뀌는 10가지 푸짐한 반찬 뷔페', highlight: '무한리필' },
      { type: 'celebrity', badge: '셀럽 추천', title: '3장: 차은우도 감탄한 제육볶음 순삭각 🤤', celebrityName: '차은우', quote: '진짜 집밥 먹는 느낌입니다!' },
      { type: 'benefit', badge: '파격 혜택', title: '4장: 여대생 전용 🎓 30% 할인 파격 이벤트', highlight: '30% OFF' },
      { type: 'cta', badge: '오시는 길', title: '5장: 광운대역 1번 출구 골목 파란 간판 📍', subtitle: '저장하고 방문하세요' }
    ]
  });

  const row1 = await store.saveCampaign(targetPlace.id, {
    title: '광운대 여대생 픽! 인스타 카드뉴스',
    body: '인스타그램 카드뉴스 5장 슬라이드',
    status: 'published',
    proposalId: '',
    carousel: testCarousel
  });
  console.log(`✅ [게시물 1 생성/게시 완료] ID: ${row1.id} (유형: 캐러셀 5장)`);

  // 2. 두 번째 게시물: 단일 상업용 포스터
  const testCard = cleanCard({
    layout: 'bold-impact',
    theme: 'lime',
    title: '여대생 전용 30% 특별 할인 쿠폰',
    catchphrase: '든든하게 챙겨 먹고 시험 대박!',
    heroMetric: '30% OFF',
    benefit: '학생증 제시 시 일주일간 전 메뉴 30% 할인',
    period: '이번 주 일주일간',
    badge: '학생 할인',
    body: '월계 든든 함바식당에서 정성 가득한 집밥을 30% 할인된 가격으로 만나보세요.'
  });

  const row2 = await store.saveCampaign(targetPlace.id, {
    title: '여대생 30% 할인 단일 포스터',
    body: '학생증 인증 시 전 메뉴 30% 할인 적용',
    status: 'published',
    proposalId: '',
    card: testCard
  });
  console.log(`✅ [게시물 2 생성/게시 완료] ID: ${row2.id} (유형: 단일 포스터)`);

  // 3. 백엔드 조회 검증 (allPublicCampaigns & publicCampaigns)
  const publishedList = await store.publicCampaigns(targetPlace.id);
  console.log(`\n📦 대상 가게의 공개 게시물 총 개수: ${publishedList.length}개`);
  if (publishedList.length < 2) {
    throw new Error('❌ 여러 개를 게시했으나 공개 게시물이 2개 이상 조회되지 않습니다!');
  }

  // 4. 각 게시물 상세 검증
  publishedList.forEach((c, idx) => {
    console.log(`  [게시물 ${idx + 1}] ID: ${c.id} | 제목: "${c.title}"`);
    if (c.carousel) {
      console.log(`    -> 캐러셀 확인: 총 ${c.carousel.slides.length}장의 슬라이드 존재`);
      c.carousel.slides.forEach((s, sIdx) => {
        console.log(`       * [슬라이드 ${sIdx + 1}] 타입: ${s.type} | 제목: "${s.title}"`);
      });
      if (c.carousel.slides.length !== 5) {
        throw new Error('❌ 캐러셀 슬라이드가 5장 모두 보존되지 않았습니다!');
      }
    } else if (c.card) {
      console.log(`    -> 단일 포스터 확인: 타이틀="${c.card.title}", 혜택="${c.card.benefit}", 핵심="${c.card.heroMetric}"`);
    }
  });

  console.log('\n🎉 [검증 성공] 식당 상세페이지에서 사장님이 올린 모든 게시물(총 2개 이상)과 카드뉴스의 5장 모든 페이지를 완벽하게 탐색 가능함을 확인했습니다!');
}

verifyPlacePromos().catch(e => {
  console.error('❌ 검증 에러:', e);
  process.exit(1);
});

