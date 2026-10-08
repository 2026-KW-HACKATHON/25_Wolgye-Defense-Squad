import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createOwnerMarketingStore} from '../server/services/ownerMarketingStore.js';

test('approval gates owner access, campaigns, and reports',()=>{
 const dir=fs.mkdtempSync(path.join(process.cwd(),'.owner-test-'));
 try{
  const store=createOwnerMarketingStore(path.join(dir,'store.json'));
  const user={id:'user-1',email:'owner@example.com'};
  assert.equal(store.requestUserAccount('shop-1',user),true);
  assert.equal(store.requestUserAccount('shop-2',user),false);
  assert.equal(store.accountForUser('user-1').status,'pending');
  const request=store.pendingAccounts()[0];
  assert.equal(store.approveAccount(request.id,true),true);
  const placeId=store.accountForUser('user-1').placeId;
  assert.equal(placeId,'shop-1');
  assert.equal(store.accountForUser('user-2'),undefined);
  store.saveCampaign(placeId,{title:'오늘의 소식',body:'가게에서 확인한 내용',status:'published',proposalId:''});
  assert.equal(store.publicCampaigns(placeId).length,1);
  assert.equal(store.publicCampaigns('shop-2').length,0);
  store.recordView(placeId,'12345678-1234-1234-1234-123456789abc');
  store.recordView(placeId,'12345678-1234-1234-1234-123456789abc',{age:'20대',gender:'여성',people:2,budget:12000,mealTime:'점심'});
  assert.equal(store.report(placeId).totalViews,1);
  assert.equal(store.report(placeId).age['20대'],1);
  assert.equal(store.report(placeId).budget[10000],1);
  assert.equal(store.report('shop-2').totalViews,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('account data keeps only valid saved places and visits per user',async()=>{
 const {createUserDataStore}=await import('../server/services/userDataStore.js');
 const dir=fs.mkdtempSync(path.join(process.cwd(),'.user-data-test-'));
 try{
  const file=path.join(dir,'user.json'),store=createUserDataStore(file);
  assert.deepEqual(store.get('u1'),{saved:[],visits:[]});
  store.set('u1',{saved:['a','a',5,'b'],visits:'x'});
  assert.deepEqual(createUserDataStore(file).get('u1'),{saved:['a','b'],visits:[]});
  assert.deepEqual(store.get('u2'),{saved:[],visits:[]});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
