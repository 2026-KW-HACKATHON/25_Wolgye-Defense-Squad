import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCard} from '../server/services/posterCard.js';

test('poster card keeps only known fields, allowed layouts and short text',()=>{
  const card=cleanCard({layout:'neon-night',theme:'nope',title:'불금 맥주 1+1',heroMetric:'1+1 이벤트 엄청 길게 늘어난 문구',body:'안내',bgImage:'data:image/png;base64,AAAA',script:'<script>'});
  assert.equal(card.layout,'neon-night');assert.equal(card.theme,'lime');
  assert.equal(card.heroMetric.length<=14,true);assert.equal(card.bgImage,undefined);assert.equal(card.script,undefined);
  assert.equal(cleanCard({layout:'bold-impact'}),null,'제목 없으면 버림');
});
