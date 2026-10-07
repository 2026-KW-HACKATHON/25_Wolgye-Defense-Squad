import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createOwnerMarketingStore} from '../server/services/ownerMarketingStore.js';

test('approval gates owner access, campaigns, and reports',()=>{
 const dir=fs.mkdtempSync(path.join(process.cwd(),'.owner-test-'));
 try{
  const store=createOwnerMarketingStore(path.join(dir,'store.json'));
  assert.equal(store.requestAccount('shop-1','owner@example.com','strong-password-123'),true);
  assert.equal(store.login('owner@example.com','strong-password-123'),null);
  const request=store.pendingAccounts()[0];
  assert.equal(request.passwordHash,undefined);
  assert.equal(store.approveAccount(request.id,true),true);
  assert.equal(store.login('owner@example.com','wrong-password'),null);
  const {token,placeId}=store.login('owner@example.com','strong-password-123');
  assert.equal(placeId,'shop-1');
  assert.equal(store.session(token).placeId,'shop-1');
  store.saveCampaign(placeId,{title:'오늘의 소식',body:'가게에서 확인한 내용',status:'published',proposalId:''});
  assert.equal(store.publicCampaigns(placeId).length,1);
  assert.equal(store.publicCampaigns('shop-2').length,0);
  store.recordView(placeId,'12345678-1234-1234-1234-123456789abc');
  store.recordView(placeId,'12345678-1234-1234-1234-123456789abc',{age:'20대',gender:'여성',people:2,budget:12000,mealTime:'점심'});
  assert.equal(store.report(placeId).totalViews,1);
  assert.equal(store.report(placeId).age['20대'],1);
  assert.equal(store.report(placeId).budget[10000],1);
  assert.equal(store.report('shop-2').totalViews,0);
  store.logout(token);
  assert.equal(store.session(token),undefined);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
