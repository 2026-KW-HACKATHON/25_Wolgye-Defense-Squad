import React, { useState, useEffect } from 'react';
import PromoCardCanvas, { InstagramCarouselView } from './PromoCardCanvas';
import { Sparkles, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PlaceDetailPromos({ placeId, shopName, defaultPromo, allPromos = [] }) {
  const [promosList, setPromosList] = useState(() => {
    if (allPromos && allPromos.length > 0) return allPromos;
    return defaultPromo ? [defaultPromo] : [];
  });
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [slideNavIndex, setSlideNavIndex] = useState(0);

  // 실시간 최신 캠페인 목록 조회 및 동기화
  useEffect(() => {
    let isMounted = true;
    if (placeId) {
      fetch(`/api/owner/campaigns/${encodeURIComponent(placeId)}`)
        .then(r => r.json())
        .then(d => {
          if (isMounted && Array.isArray(d.items) && d.items.length > 0) {
            setPromosList(d.items);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [placeId]);

  // 활성 프로모션이 바뀔 때 슬라이드 인덱스 초기화
  useEffect(() => {
    setSlideNavIndex(0);
  }, [activePromoIndex]);

  if (!promosList || promosList.length === 0) {
    return null;
  }

  const currentPromo = promosList[activePromoIndex] || promosList[0];
  const isCarousel = Boolean(currentPromo?.carousel);
  const isCard = Boolean(currentPromo?.card);
  const posterUrl = currentPromo?.hasPoster
    ? `/api/owner/campaigns/${encodeURIComponent(currentPromo.placeId || placeId)}/${currentPromo.id}/poster`
    : null;

  return (
    <div className="place-detail-promos-container" style={{ margin: '20px 0', padding: '18px', background: '#f8fafc', borderRadius: '18px', border: '1.5px solid #e2e8f0' }}>
      {/* 1. 상단 타이틀 & 게시물 개수 안내 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📢</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            사장님 홍보 소식 <span style={{ color: '#2563eb', fontSize: '13px', fontWeight: 700 }}>({promosList.length}개)</span>
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
          {currentPromo?.demo ? '시연용 콘텐츠' : `${new Date(currentPromo?.updatedAt || Date.now()).toLocaleDateString('ko-KR')} 게시`}
        </span>
      </div>

      {/* 2. 게시물이 여러 개일 때: 소식 선택 탭 바 */}
      {promosList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
          {promosList.map((item, idx) => {
            const isSelected = idx === activePromoIndex;
            const typeLabel = item.carousel ? '📸 인스타 카드뉴스' : '📜 단일 포스터';
            const titleSnippet = item.carousel?.concept || item.card?.title || item.title || `소식 #${idx + 1}`;
            return (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setActivePromoIndex(idx)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1e40af' : '#475569',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{typeLabel}</span>
                <span style={{ color: isSelected ? '#2563eb' : '#94a3b8', fontSize: '11px' }}>
                  ({titleSnippet.length > 15 ? titleSnippet.slice(0, 15) + '...' : titleSnippet})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. 카드뉴스일 때: 모든 카드 페이지(슬라이드) 직관적 탭 바 */}
      {isCarousel && Array.isArray(currentPromo.carousel?.slides) && currentPromo.carousel.slides.length > 1 && (
        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              📑 전체 {currentPromo.carousel.slides.length}장 슬라이드 바로가기:
            </span>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>
              현재 {slideNavIndex + 1} / {currentPromo.carousel.slides.length}장
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {currentPromo.carousel.slides.map((s, sIdx) => {
              const isCurrent = sIdx === slideNavIndex;
              const badgeName = s.badge || (s.type === 'cover' ? '표지' : s.type === 'menu' ? '메뉴' : s.type === 'celebrity' ? (s.celebrityName || '셀럽') : s.type === 'benefit' ? '혜택' : '위치');
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setSlideNavIndex(sIdx)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: isCurrent ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                    background: isCurrent ? '#f0f9ff' : '#f8fafc',
                    color: isCurrent ? '#0369a1' : '#64748b',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sIdx + 1}장: {badgeName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 홍보 콘텐츠 뷰어 본체 */}
      <div className="promo-viewer-wrapper" style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        {isCarousel ? (
          <InstagramCarouselView
            key={currentPromo.id}
            carousel={currentPromo.carousel}
            shopName={shopName}
            editable={false}
            initialIndex={slideNavIndex}
            onSlideChange={setSlideNavIndex}
          />
        ) : posterUrl ? (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <img
              src={posterUrl}
              alt={`${shopName} 포스터`}
              style={{ maxWidth: '100%', maxHeight: '520px', borderRadius: '12px', objectFit: 'contain' }}
            />
          </div>
        ) : isCard ? (
          <PromoCardCanvas
            card={currentPromo.card}
            shopName={shopName}
            editable={false}
          />
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
            <p>게시된 콘텐츠 내용을 불러오고 있습니다.</p>
          </div>
        )}
      </div>

      {/* 5. 하단 캡션 및 혜택 요약 */}
      <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f1f5f9', borderRadius: '10px', fontSize: '12px', color: '#475569' }}>
        <span style={{ fontWeight: 700, color: '#1e293b' }}>💡 이용 안내: </span>
        {currentPromo.demo
          ? '시연용 가상 혜택입니다. 실제 혜택이 아닙니다.'
          : '사장님이 직접 올린 홍보 콘텐츠입니다. 상세 혜택과 재고는 매장 방문 시 확인해 주세요.'}
      </div>
    </div>
  );
}
