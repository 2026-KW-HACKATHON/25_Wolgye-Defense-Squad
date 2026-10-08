import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerMarketingStore } from '../server/services/ownerMarketingStore.js';
import fs from 'node:fs';
import path from 'node:path';

test('proposals store and review preserves rich poster cards with bgImage', () => {
  const dir = fs.mkdtempSync(path.join(process.cwd(), '.proposal-test-'));
  try {
    const store = createOwnerMarketingStore(path.join(dir, 'store.json'));
    const session = store.enter('test-shop-2');

    const posterCard = {
      layout: 'retro-chalkboard',
      theme: 'warm',
      title: '비 오는 날 특별 할인!',
      catchphrase: '따뜻한 한 끼로 비를 잊다',
      heroMetric: '20% OFF',
      benefit: '김치전과 막걸리 세트를 20% 할인',
      period: '비 오는 날 한정',
      badge: '오늘의 혜택',
      stamp: 'SPECIAL',
      body: '비 오는 날에는 따뜻한 김치전과 시원한 막걸리로!',
      bgImage: 'data:image/png;base64,sample_food_bg'
    };

    const savedProposal = store.saveProposal('test-shop-2', {
      brief: '비 오는 날 할인 포스터',
      format: 'portrait',
      copy: '[비 오는 날 특별 할인!] 김치전과 막걸리 세트 20% 할인',
      card: posterCard,
      image: 'sample_food_bg'
    });

    assert.equal(savedProposal.status, 'review');
    assert.equal(savedProposal.card.layout, 'retro-chalkboard');
    assert.equal(savedProposal.card.heroMetric, '20% OFF');
    assert.equal(savedProposal.card.bgImage, 'data:image/png;base64,sample_food_bg');

    // Test card edit during review
    const updatedCard = { ...posterCard, layout: 'bold-impact', heroMetric: '30% OFF' };
    const reviewed = store.reviewProposal('test-shop-2', savedProposal.id, 'approved', updatedCard);
    assert.equal(reviewed.status, 'approved');
    assert.equal(reviewed.card.layout, 'bold-impact');
    assert.equal(reviewed.card.heroMetric, '30% OFF');

    // Test proposals listing returns card
    const list = store.proposals('test-shop-2');
    assert.equal(list.length, 1);
    assert.equal(list[0].card.heroMetric, '30% OFF');

    store.logout(session.token);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
