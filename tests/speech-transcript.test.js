import test from 'node:test';
import assert from 'node:assert/strict';
import {speechText} from '../src/community/speechTranscript.js';
const results=(...texts)=>texts.map(transcript=>[{transcript}]);
test('interim revisions replace the current session without duplicating words',()=>{
  assert.equal(speechText('기존',results('오')),'기존\n오');
  assert.equal(speechText('기존',results('오늘')),'기존\n오늘');
  assert.equal(speechText('기존',results('오늘 메뉴','변경')),'기존\n오늘 메뉴 변경');
});
test('empty speech preserves input and transcript respects field limit',()=>{
  assert.equal(speechText('기존',results('')),'기존');
  assert.equal(speechText('',results('123456'),3),'123');
});
