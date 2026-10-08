import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyMenu,menuFingerprint} from '../server/services/menuReview.js';
test('internet menu requires independent source match and all affirmative vision checks',()=>{const good={blogMatch:true,verification:{shopNameVisible:true,kindMatch:true,koreanMenu:true,krw:true,foreignCurrency:false}};assert.equal(classifyMenu(good),'eligible');assert.equal(classifyMenu({...good,blogMatch:false}),'pending');assert.equal(classifyMenu({verification:{}}),'pending');assert.equal(classifyMenu({...good,verification:{...good.verification,kindMatch:false}}),'rejected');assert.equal(classifyMenu({...good,verification:{...good.verification,foreignCurrency:true}}),'rejected');});
test('duplicate menus ignore order, whitespace and comma formatting',()=>{assert.equal(menuFingerprint('국수 8,000원 / 만두 5000원'),menuFingerprint('만두 5,000원 / 국수 8000원'));assert.notEqual(menuFingerprint('국수 8000원'),menuFingerprint('국수 9000원'));});
