import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../public/midterm-demo.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('function naturalConditions('),html.indexOf('function conditionSummary('));
const ctx=vm.createContext({});vm.runInContext(source,ctx);
const parse=s=>JSON.parse(JSON.stringify(ctx.naturalConditions(s)));
test('natural input only extracts explicit limits and preferences',()=>{
 const a=parse('만원 이하로 짜장면 먹고 싶고 50분 안에 돌아와야 해요.');assert.equal(a.budget,10000);assert.equal(a.minutes,50);assert.deepEqual(a.preferences,['짜장면']);
 assert.equal(parse('1만5천원 이하').budget,15000);assert.equal(parse('8천원 이하').budget,8000);
});
test('omitted conditions stay absent and menu exclusions are not preferences',()=>{
 const a=parse('돈은 상관없고 매운 건 못 먹어.');assert.equal(a.budget,null);assert.equal(a.minutes,null);assert.equal(a.noSpicy,true);
 const b=parse('아무거나 괜찮아');assert.equal(b.budget,null);assert.equal(b.minutes,null);assert.deepEqual(b.notes,[]);
 const c=parse('짜장면 말고 중식 먹고 싶어');assert.deepEqual(c.excludedMenus,['짜장면']);assert.deepEqual(c.preferences,['중식']);
});
test('vague or unsupported constraints are disclosed, never converted to invented limits',()=>{
 const a=parse('빨리 먹을 수 있고 조용한 곳이면 좋겠어');assert.equal(a.minutes,null);assert.equal(a.budget,null);assert.ok(a.notes.length>=2);
 assert.equal(parse('만원 정도').budget,null);assert.equal(parse('30분 걷고 20분 먹을래').minutes,null);
 assert.ok(parse('땅콩 알레르기가 있고 만원 이하로 먹을래').notes.length);
 assert.ok(parse('우주식을 먹고 싶어').notes.length);
});
