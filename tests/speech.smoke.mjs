import {chromium} from '../.tools/qa/node_modules/playwright/index.mjs';import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGE ERROR',e.stack));p.setDefaultTimeout(7000);
async function expectValue(value){await p.waitForFunction(v=>document.querySelector('textarea[aria-label="내용"]')?.value===v,value);}
await p.addInitScript(()=>{window.SpeechRecognition=class{constructor(){window.rec=this;}start(){}stop(){this.onend?.();}abort(){}};window.emitSpeech=(...parts)=>window.rec.onresult({results:parts.map(t=>[{transcript:t}])});});
await p.route('**/api/community/places',r=>r.fulfill({json:{items:[{id:'test',name:'테스트가게',kind:'한식',address:'테스트',lat:37.6193,lng:127.0583}]}}));
await p.goto('http://127.0.0.1:5173');await p.getByRole('button',{name:'소식 올리기',exact:true}).first().click();
await p.getByLabel('내용',{exact:true}).fill('기존 내용');await p.getByRole('button',{name:/말로 입력/}).click();
for(const text of ['오','오늘','오늘 메뉴']){await p.evaluate(t=>window.emitSpeech(t),text);await expectValue('기존 내용\n'+text);}
await p.evaluate(()=>window.emitSpeech('오늘 메뉴','변경'));await expectValue('기존 내용\n오늘 메뉴 변경');
await p.getByRole('button',{name:/입력 마치기/}).click();
await p.getByRole('button',{name:/말로 입력/}).click();await p.evaluate(()=>window.emitSpeech('추가'));await expectValue('기존 내용\n오늘 메뉴 변경\n추가');
await p.getByLabel('내용',{exact:true}).fill('직접 수정');await p.evaluate(()=>window.rec.onresult?.({results:[[{transcript:'덮어쓰면 안됨'}]]}));await expectValue('직접 수정');
await p.getByRole('button',{name:/말로 입력/}).click();await p.evaluate(()=>{window.rec.onerror({error:'not-allowed'});window.rec.onend();});await p.getByText('마이크 권한을 허용해 주세요.').waitFor();
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:'.tools/qa-results/speech-live-mobile.png'});console.log('PASS: interim updates, corrections, no duplicates, append new session, manual edit protected, permission error');await b.close();
