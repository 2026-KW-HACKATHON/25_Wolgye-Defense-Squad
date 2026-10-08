import React, { useEffect, useState } from 'react';
import PromoCardCanvas, { InstagramCarouselView } from './PromoCardCanvas';
import './place-detail-promos.css';

function publishedAt(item) {
  const date = new Date(item?.updatedAt || item?.createdAt || 0).getTime();
  return Number.isFinite(date) ? date : 0;
}

function uniquePromos(items) {
  const seen = new Set();
  return items
    .filter(item => item && typeof item === 'object' && (item.carousel || item.card || item.hasPoster))
    .sort((a, b) => publishedAt(b) - publishedAt(a))
    .filter(item => {
      // 같은 디자인으로 두 번 게시된 포스터는 최신 게시물 하나만 보여준다.
      const key = item.card ? `card:${JSON.stringify(item.card)}` : `id:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function posterSource(item, placeId) {
  if (!item.hasPoster) return '';
  return `/api/owner/campaigns/${encodeURIComponent(item.placeId || placeId)}/${encodeURIComponent(item.id)}/poster`;
}

function carouselCover(item) {
  const url = item.carousel?.slides?.[0]?.image;
  if (typeof url !== 'string') return '';
  return url.startsWith('http') && !url.includes('/api/owner/proxy-image')
    ? `/api/owner/proxy-image?url=${encodeURIComponent(url)}`
    : url;
}

export default function PlaceDetailPromos({ placeId, shopName, defaultPromo, allPromos = [] }) {
  const [promosList, setPromosList] = useState(() => {
    if (allPromos.length > 0) return allPromos;
    if (defaultPromo) return [defaultPromo];
    try {
      const parsed = JSON.parse(localStorage.getItem(`place_campaigns_${placeId}`) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [openCarouselId, setOpenCarouselId] = useState(null);

  useEffect(() => {
    if (Array.isArray(allPromos) && allPromos.length > 0) setPromosList(allPromos);
  }, [allPromos]);

  useEffect(() => {
    let live = true;
    if (placeId) {
      fetch(`/api/owner/campaigns/${encodeURIComponent(placeId)}`)
        .then(response => response.json())
        .then(data => {
          if (live && Array.isArray(data.items)) {
            setPromosList(data.items);
            try { localStorage.setItem(`place_campaigns_${placeId}`, JSON.stringify(data.items)); } catch {}
          }
        })
        .catch(() => {});
    }
    return () => { live = false; };
  }, [placeId]);

  const promos = uniquePromos([...promosList]);
  useEffect(() => {
    if (activeIndex >= promos.length) setActiveIndex(0);
  }, [activeIndex, promos.length]);

  if (promos.length === 0) return null;

  const index = Math.min(activeIndex, promos.length - 1);
  const current = promos[index];
  const isCarousel = Array.isArray(current.carousel?.slides) && current.carousel.slides.length > 0;
  const posterUrl = posterSource(current, placeId);
  const coverUrl = posterUrl || (isCarousel ? carouselCover(current) : '');
  const posterCount = promos.filter(item => !item.carousel).length;
  const carouselCount = promos.length - posterCount;

  const goTo = next => {
    setActiveIndex(next);
    setOpenCarouselId(null);
  };

  return (
    <section className="place-detail-promos-container" aria-label="사장님 홍보 소식">
      <div className="place-promo-heading">
        <div>
          <span className="place-promo-eyebrow">가게가 직접 올린 소식</span>
          <h3>사장님 홍보 소식 <span>{promos.length}건</span></h3>
        </div>
        <small>포스터 {posterCount} · 카드뉴스 {carouselCount}</small>
      </div>

      {promos.length > 1 && (
        <nav className="place-promo-controls" aria-label="홍보 소식 넘기기">
          <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)}>이전</button>
          <span aria-live="polite">{index + 1} / {promos.length}</span>
          <button type="button" disabled={index === promos.length - 1} onClick={() => goTo(index + 1)}>다음</button>
        </nav>
      )}

      <div className="place-promo-item" key={current.id}>
        <div className="place-promo-meta">
          <span className="place-promo-type">{isCarousel ? '카드뉴스' : '포스터'}</span>
          <b>{current.title || shopName}</b>
          <small>{new Date(current.updatedAt || Date.now()).toLocaleDateString('ko-KR')} 게시</small>
        </div>

        {isCarousel && openCarouselId === current.id ? (
          <div className="place-promo-reader">
            <button type="button" className="place-promo-back" onClick={() => setOpenCarouselId(null)}>← 표지로 돌아가기</button>
            <InstagramCarouselView key={current.id} carousel={current.carousel} shopName={shopName} publicView />
          </div>
        ) : isCarousel ? (
          <button type="button" className="place-promo-cover" onClick={() => setOpenCarouselId(current.id)} aria-label={`${current.title || shopName} 카드뉴스 읽기`}>
            {coverUrl ? <img src={coverUrl} alt={`${shopName} 카드뉴스 표지`} /> : <span className="place-promo-cover-empty">{current.title || shopName}</span>}
            <span className="place-promo-open">카드뉴스 {current.carousel.slides.length}장 읽기 →</span>
          </button>
        ) : posterUrl ? (
          <img className="place-promo-poster" src={posterUrl} alt={`${shopName} 포스터`} />
        ) : current.card ? (
          <PromoCardCanvas card={current.card} shopName={shopName} editable={false} />
        ) : null}
      </div>
    </section>
  );
}
