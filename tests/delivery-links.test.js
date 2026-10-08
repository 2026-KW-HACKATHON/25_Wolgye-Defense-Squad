import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {cleanDeliveryLinks} from '../server/services/deliveryLinks.js';
import {createOwnerMarketingStore} from '../server/services/ownerMarketingStore.js';

test('delivery links accept only secure URLs on the selected delivery service',()=>{
  assert.deepEqual(cleanDeliveryLinks({baemin:'https://www.baemin.com/shop/123',yogiyo:''}),{baemin:'https://www.baemin.com/shop/123'});
  assert.equal(cleanDeliveryLinks({baemin:'javascript:alert(1)'}),null);
  assert.equal(cleanDeliveryLinks({baemin:'https://baemin.com.evil.example/shop'}),null);
  assert.equal(cleanDeliveryLinks({baemin:'http://baemin.com/shop'}),null);
  assert.equal(cleanDeliveryLinks({unknown:'https://example.com'}),null);
});

test('owner delivery links persist alongside keywords',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-delivery-'));
  const file=path.join(dir,'owner.json');
  try{
    const store=createOwnerMarketingStore(file);
    store.saveKeywords('p1',['혼밥']);
    store.saveDeliveryLinks('p1',{baemin:'https://baemin.com/shop/123'});
    store.saveKeywords('p1',['단체']);
    const restored=createOwnerMarketingStore(file);
    assert.deepEqual(restored.keywords('p1'),['단체']);
    assert.deepEqual(restored.deliveryLinks('p1'),{baemin:'https://baemin.com/shop/123'});
    assert.deepEqual(restored.deliveryLinkMap().p1,restored.deliveryLinks('p1'));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
