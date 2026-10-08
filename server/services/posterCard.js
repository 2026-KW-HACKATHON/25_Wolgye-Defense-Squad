// 사장님 홍보 포스터 카드 (eethsc의 feat/hyperlocal-ai-marketing에서 옮김).
// AI가 준 값은 그대로 믿지 않고, 정해진 항목·길이·선택지만 남긴다.
export const LAYOUTS=['bold-impact','retro-chalkboard','magazine-editorial','neon-night','ticket-coupon'];
export const THEMES=['warm','lime','dark','retro','pastel','red-hot','indigo'];
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

// AI에게 줄 포스터 설명. 확인되지 않은 가격·할인은 지어내지 말고, 사장님이 말한 혜택만 쓰게 한다.
export const POSTER_GUIDE=`포스터 JSON 형식: {"layout":"${LAYOUTS.join('|')} 중 하나","theme":"${THEMES.join('|')} 중 하나","title":"포스터 제목(12~24자)","catchphrase":"시선을 끄는 한 줄","heroMetric":"가운데 크게 보일 핵심 혜택(예: 20% OFF, 1+1, 8,900원)","benefit":"구체적인 혜택 내용","period":"행사 기간·시간","badge":"오늘의 혜택|학생 할인|사장님 추천|시즌 한정|타임 세일 중 하나","stamp":"사장님 쏜다|LIMITED|BEST|SPECIAL|HOT 중 하나","body":"손님에게 전하는 안내 2~3문장"}.
레이아웃 고르기: 할인·오픈 이벤트는 bold-impact, 분식·노포·국밥·고깃집은 retro-chalkboard, 카페·디저트는 magazine-editorial, 술집·심야는 neon-night, 쿠폰·학생 할인은 ticket-coupon.
사장님이 말하지 않은 가격·할인율·기간은 지어내지 말고, 모르면 heroMetric은 "NEW"·"SPECIAL"처럼 일반적인 말로, period는 "방문 전 매장 확인"으로 쓰세요.`;
