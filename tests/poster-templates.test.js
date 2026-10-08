import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerMarketingStore } from '../server/services/ownerMarketingStore.js';
import fs from 'node:fs';
import path from 'node:path';

test('poster marketing rich schema, layouts, and quick-publish integrity', () => {
  const dir = fs.mkdtempSync(path.join(process.cwd(), '.poster-test-'));
  try {
    const store = createOwnerMarketingStore(path.join(dir, 'store.json'));
    const session = store.enter('test-shop-1');

    const samplePosterCard = {
      layout: 'bold-impact',
      theme: 'warm',
      title: '비 오는 날 따뜻한 김치전 할인',
      catchphrase: '빗소리와 함께 지글지글, 막걸리 한 잔의 여유',
      heroMetric: '20% OFF',
      benefit: '김치전 + 막걸리 세트 20% 즉시 할인',
      period: '비 오는 날 한정',
      badge: '오늘의 혜택',
      stamp: '사장님 쏜다',
      body: '비 오는 날, 따뜻한 김치전과 시원한 막걸리로 기분을 전환해보세요!'
    };

    const saved = store.saveCampaign('test-shop-1', {
      title: samplePosterCard.title,
      body: samplePosterCard.body,
      card: samplePosterCard,
      image: 'data:image/png;base64,sample_poster_image_data',
      status: 'published'
    });

    assert.equal(saved.card.layout, 'bold-impact');
    assert.equal(saved.card.heroMetric, '20% OFF');
    assert.equal(saved.card.catchphrase, '빗소리와 함께 지글지글, 막걸리 한 잔의 여유');
    assert.equal(saved.card.stamp, '사장님 쏜다');
    assert.equal(saved.card.period, '비 오는 날 한정');

    const allPublic = store.allPublicCampaigns();
    const item = allPublic.find(c => c.placeId === 'test-shop-1');
    assert.equal(item.card.heroMetric, '20% OFF');
    assert.equal(item.card.layout, 'bold-impact');
    assert.equal(item.image, 'data:image/png;base64,sample_poster_image_data');

    store.logout(session.token);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
