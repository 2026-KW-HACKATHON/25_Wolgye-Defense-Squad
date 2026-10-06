import {chromium} from '../.tools/qa/node_modules/playwright/index.mjs';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createContributionRouter} from '../server/contributionRoutes.js';
import {createCommunityStore} from '../server/services/communityStore.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-ui-'));
const store=createCommunityStore(path.join(dir,'community.json'));
const catalog=async()=>({items:[{id:'fixture',name:'테스트 기존 가게',kind:'한식',address:'월계1동 테스트',lat:37.6193,lng:127.0583,source:'테스트'},...store.places()]});
const app=express();app.use(express.json({limit:'1500kb'}));app.use('/api/community',createContributionRouter({store,catalog}));app.get('/api/community/places',async(req,res)=>res.json(await catalog()));app.use(express.static('dist'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const a=await browser.newPage({viewport:{width:1440,height:1000}}),b=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
try{
  for(const p of[a,b]){p.on('pageerror',e=>errors.push(e.message));await p.route('https://tile.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5l8AAAAASUVORK5CYII=','base64')}));await p.goto(url);}
  await a.getByRole('button',{name:'소식 올리기',exact:true}).first().click();
  await a.getByLabel('제목',{exact:true}).fill('테스트 메뉴판 소식');await a.getByLabel('내용',{exact:true}).fill('메뉴판에서 국수 7000원을 확인했어요.');
  await a.getByRole('button',{name:'찾는 가게가 없나요? 새 장소 등록'}).click();await a.getByLabel('가게 이름',{exact:true}).fill('테스트 골목 가게');await a.getByLabel('업종',{exact:true}).fill('한식');await a.getByLabel('주소',{exact:true}).fill('월계1동 테스트 위치');
  const map=a.locator('.new-place-form .live-location-map');await map.scrollIntoViewIfNeeded();await map.click({position:{x:300,y:150}});
  // The center can lie outside an irregular boundary; try nearby points until a valid point is chosen.
  for(const point of[{x:250,y:150},{x:200,y:180},{x:350,y:200},{x:300,y:230}]){if(await a.getByRole('button',{name:'장소 등록',exact:true}).isEnabled())break;await map.click({position:point});}
  await a.getByRole('button',{name:'장소 등록',exact:true}).click();
  await a.getByRole('heading',{name:'동네에 소식 전하기'}).waitFor();assert.equal(await a.getByLabel('제목',{exact:true}).inputValue(),'테스트 메뉴판 소식');
  await a.getByLabel('소식 종류').selectOption('메뉴·가격');
  await a.getByRole('button',{name:'등록 내용 확인',exact:true}).click();await a.getByRole('button',{name:'확인하고 소식 저장',exact:true}).click();await a.getByRole('dialog').waitFor({state:'hidden'});
  await b.getByText('테스트 메뉴판 소식',{exact:true}).waitFor({timeout:15000});
  await b.reload();await b.locator('.bottom-nav').getByRole('button',{name:'발견',exact:true}).click();await b.getByRole('button',{name:'최근 등록',exact:true}).click();await b.getByRole('heading',{name:'테스트 골목 가게',exact:true}).waitFor();
  assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await b.screenshot({path:'.tools/qa-results/discovery-mobile.png',fullPage:true});
  await a.getByRole('button',{name:'마이페이지',exact:true}).click();await a.getByRole('button',{name:'수정',exact:true}).click();await a.getByLabel('내용',{exact:true}).fill('국수 8000원으로 정정합니다.');await a.getByRole('button',{name:'등록 내용 확인',exact:true}).click();await a.getByRole('button',{name:'확인하고 소식 저장',exact:true}).click();await a.getByRole('dialog').waitFor({state:'hidden'});
  await b.locator('.bottom-nav').getByRole('button',{name:'소식',exact:true}).click();await b.getByText('국수 8000원으로 정정합니다.',{exact:true}).waitFor({timeout:15000});
  await a.getByRole('button',{name:'테스트 메뉴판 소식 삭제',exact:true}).click();await a.getByRole('button',{name:'삭제하기',exact:true}).click();await a.getByRole('dialog').waitFor({state:'hidden'});await b.getByText('테스트 메뉴판 소식',{exact:true}).waitFor({state:'hidden',timeout:15000});
  assert.deepEqual(errors,[]);console.log('PASS: real UI registration, preserved draft, shared post, own edit/delete, second browser refresh, mobile layout');
}finally{await browser.close();await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
