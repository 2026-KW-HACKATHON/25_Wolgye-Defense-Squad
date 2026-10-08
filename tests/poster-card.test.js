import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCard, cleanCarousel} from '../server/services/posterCard.js';

test('poster card keeps only known fields, allowed layouts and short text',()=>{
  const card=cleanCard({layout:'neon-night',theme:'nope',title:'불금 맥주 1+1',heroMetric:'1+1 이벤트 엄청 길게 늘어난 문구',body:'안내',bgImage:'data:image/png;base64,AAAA',script:'<script>'});
  assert.equal(card.layout,'neon-night');assert.equal(card.theme,'lime');
  assert.equal(card.heroMetric.length<=14,true);assert.equal(card.bgImage,undefined);assert.equal(card.script,undefined);
  assert.equal(cleanCard({layout:'bold-impact'}),null,'제목 없으면 버림');
});

test('carousel card news sanitizes slides and preserves valid slide types',()=>{
  const raw={
    concept:'광운대 앞 맛집 추천 인스타 카드뉴스',
    theme:'warm',
    aspectRatio:'1:1',
    slides:[
      {type:'cover',title:'1장 표지',subtitle:'부제목',imageQuery:'광운대 맛집'},
      {type:'menu',title:'2장 칼국수',highlight:'8,000원',body:'깊은 맛'},
      {type:'celebrity',title:'3장 성시경 먹방',celebrityName:'성시경',quote:'감탄이 절로 나는 국물'},
      {type:'benefit',title:'4장 혜택',highlight:'20% OFF'},
      {type:'location',title:'5장 위치',body:'광운대역 1번 출구'}
    ]
  };
  const c=cleanCarousel(raw);
  assert.ok(c);
  assert.equal(c.slides.length,5);
  assert.equal(c.slides[0].type,'cover');
  assert.equal(c.slides[2].celebrityName,'성시경');
  assert.equal(c.slides[2].quote,'감탄이 절로 나는 국물');
  assert.equal(cleanCarousel({slides:[]}),null,'빈 슬라이드는 null 반환');
});

