// 사장님 홍보 포스터 카드 및 인스타그램 캐러셀 카드뉴스
export const LAYOUTS=['bold-impact','retro-chalkboard','magazine-editorial','neon-night','ticket-coupon'];
export const THEMES=['warm','lime','dark','retro','pastel','red-hot','indigo'];
export const SLIDE_TYPES=['cover','menu','celebrity','benefit','location','cta'];

const text=(v,max)=>typeof v==='string'?v.replace(/\s+/g,' ').trim().slice(0,max):'';

export function cleanCard(card){
  if(!card||typeof card!=='object')return null;
  const out={
    layout:LAYOUTS.includes(card.layout)?card.layout:'bold-impact',
    theme:THEMES.includes(card.theme)?card.theme:'lime',
    title:text(card.title,40),catchphrase:text(card.catchphrase,60),heroMetric:text(card.heroMetric,14),
    benefit:text(card.benefit,80),period:text(card.period,50),badge:text(card.badge,16),stamp:text(card.stamp,16),body:text(card.body,240)
  };
  return out.title?out:null;
}

export function cleanSlide(slide,index=0){
  if(!slide||typeof slide!=='object')return null;
  const rawType=String(slide.type||'').toLowerCase();
  const type=SLIDE_TYPES.includes(rawType)?rawType:(index===0?'cover':index===1?'menu':'benefit');
  return {
    id:`slide-${index+1}`,
    type,
    title:text(slide.title||slide.headline,40)||(type==='cover'?'오늘의 골목 특선':type==='menu'?'시그니처 메뉴':type==='celebrity'?'화제의 미식 추천':type==='benefit'?'특별 혜택':'매장 안내'),
    subtitle:text(slide.subtitle||slide.subhead,60),
    body:text(slide.body||slide.description||slide.detail,240),
    badge:text(slide.badge||slide.tag,20),
    highlight:text(slide.highlight||slide.heroMetric||slide.price,30),
    celebrityName:text(slide.celebrityName||slide.celeb,30),
    quote:text(slide.quote,100),
    image:typeof slide.image==='string'?slide.image:null,
    imageQuery:text(slide.imageQuery||slide.query,40)
  };
}

export function cleanCarousel(data){
  if(!data||typeof data!=='object')return null;
  const rawSlides=Array.isArray(data.slides)?data.slides:[];
  const slides=rawSlides.map((s,i)=>cleanSlide(s,i)).filter(Boolean).slice(0,7);
  if(!slides.length)return null;
  return {
    concept:text(data.concept||data.title,60)||'인스타그램 홍보 카드뉴스',
    theme:THEMES.includes(data.theme)?data.theme:'warm',
    aspectRatio:data.aspectRatio==='4:5'?'4:5':'1:1',
    slides
  };
}

// AI에게 줄 포스터 설명
export const POSTER_GUIDE=`포스터 JSON 형식: {"layout":"${LAYOUTS.join('|')} 중 하나","theme":"${THEMES.join('|')} 중 하나","title":"포스터 제목(12~24자)","catchphrase":"시선을 끄는 한 줄","heroMetric":"가운데 크게 보일 핵심 혜택(예: 20% OFF, 1+1, 8,900원)","benefit":"구체적인 혜택 내용","period":"행사 기간·시간","badge":"오늘의 혜택|학생 할인|사장님 추천|시즌 한정|타임 세일 중 하나","stamp":"사장님 쏜다|LIMITED|BEST|SPECIAL|HOT 중 하나","body":"손님에게 전하는 안내 2~3문장"}.
레이아웃 고르기: 할인·오픈 이벤트는 bold-impact, 분식·노포·국밥·고깃집은 retro-chalkboard, 카페·디저트는 magazine-editorial, 술집·심야는 neon-night, 쿠폰·학생 할인은 ticket-coupon.
사장님이 말하지 않은 가격·할인율·기간은 지어내지 말고, 모르면 heroMetric은 "NEW"·"SPECIAL"처럼 일반적인 말로, period는 "방문 전 매장 확인"으로 쓰세요.`;

// AI에게 줄 인스타그램 캐러셀 설명 (전환율을 높이는 5단계 내러티브 문법 강제)
export const CAROUSEL_GUIDE=`인스타그램 캐러셀(슬라이드 4~5장 카드뉴스) JSON 형식:
{
  "concept": "카드뉴스 전체 기획 콘셉트 (예: 월계동 숨은 맛집의 화제 미식 스토리)",
  "theme": "warm",
  "aspectRatio": "4:5",
  "slides": [
    {
      "type": "cover",
      "badge": "화제의 맛집|광운대 핫플|골목 특선",
      "title": "1장 Hook: 스크롤을 멈추게 하는 도발적/매력적 헤드라인",
      "subtitle": "궁금증을 유발하는 서브카피",
      "imageQuery": "대표 음식 한그릇 요리 접시 클로즈업 사진 *주의: 간판/외관 배제"
    },
    {
      "type": "menu",
      "badge": "시그니처 메뉴",
      "title": "2장 Core Value: 대표 메뉴명 및 핵심 가치",
      "subtitle": "메뉴의 비결 및 맛 포인트",
      "highlight": "가격 또는 차별화 포인트 (예: 8,000원, 30년 전통)",
      "body": "군침 도는 비주얼과 식감 묘사 2문장",
      "imageQuery": "해당 메뉴 단독 플레이팅 음식 사진 접시"
    },
    {
      "type": "celebrity",
      "badge": "화제의 셀럽 추천",
      "title": "3장 Social Proof: 연예인/인플루언서 깜짝 추천",
      "celebrityName": "사장님이 요청한 특정 연예인/아이돌/인물 (미지정 시 화제의 미식 셀럽)",
      "quote": "“이 집 음식은 진짜 대박입니다. 꼭 드셔보세요!” (해당 인물 특유의 극찬 한마디)",
      "body": "솔직한 리액션과 감탄 포인트",
      "imageQuery": "해당 연예인/아이돌 얼굴 또는 먹방 사진"
    },
    {
      "type": "benefit",
      "badge": "파격 혜택",
      "title": "4장 Offer: 방문 결심을 만드는 특별한 혜택",
      "highlight": "20% OFF|공깃밥 무한리필|음료수 무료",
      "subtitle": "참여 조건 및 기간 안내",
      "body": "게시물 저장 및 팔로우 인증 시 제공",
      "imageQuery": "푸짐한 한상 요리 사진 접시"
    },
    {
      "type": "cta",
      "badge": "저장 필수",
      "title": "5장 Outro/CTA: 지금 바로 방문하세요",
      "subtitle": "광운대역 인근 골목에서 기다립니다",
      "body": "위치: 광운대역 도보 3분 | 영업시간: 매장 안내",
      "highlight": "저장 🔖 & 공유 ↗️",
      "imageQuery": "광운대역 1번출구 거리 풍경"
    }
  ]
}
[핵심 원칙]
1. 사장님이 특정 연예인, 아이돌, 인플루언서(예: 카리나, 뉴진스, 아이유, 차은우 등)를 지칭한 경우, 절대로 다른 연예인으로 바꾸지 말고 반드시 사장님이 지정한 그 인물(celebrityName)로 기획하세요!
2. 1장(Hook) -> 2장(메뉴 정보) -> 3장(사회적 증거) -> 4장(혜택) -> 5장(행동 유도 CTA)의 유기적 흐름을 유지하세요.
3. 각 슬라이드의 imageQuery는 슬라이드의 내용/텍스트와 100% 일치하는 음식 요리나 지정된 인물 표정이어야 합니다. 타 식당 간판/외관이 검색되지 않도록 주의하세요.`;
