import React, { useEffect, useState } from 'react';
import { InstagramCarouselView } from './PromoCardCanvas';

async function record(placeId, details) {
  const response = await fetch(`/api/owner/views/${encodeURIComponent(placeId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ details })
  });
  if (!response.ok) throw new Error('조회 정보를 반영하지 못했어요.');
}

// 로그인한 이용자가 프로필에 연령대·성별을 남겼다면 그 값만 함께 보낸다(서버가 허용된 값만 저장).
export function recordPlaceView(placeId, profile) {
  record(placeId, profile ? { age: profile.ageGroup || undefined, gender: profile.gender || undefined } : undefined).catch(() => {});
}

export default function PlaceMarketing({ placeId, shopName, initialCampaigns = [] }) {
  const [items, setItems] = useState(() => {
    if (Array.isArray(initialCampaigns) && initialCampaigns.length > 0) return initialCampaigns;
    try {
      const stored = localStorage.getItem(`place_campaigns_${placeId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);
  const [slideNavIdx, setSlideNavIdx] = useState(0);

  // 상위에서 전달된 캠페인 배열이 갱신되면 즉시 반영
  useEffect(() => {
    if (Array.isArray(initialCampaigns) && initialCampaigns.length > 0) {
      setItems(initialCampaigns);
    }
  }, [initialCampaigns]);

  useEffect(() => {
    let live = true;
    if (placeId) {
      fetch(`/api/owner/campaigns/${encodeURIComponent(placeId)}`)
        .then(r => r.json())
        .then(d => {
          if (live && Array.isArray(d.items)) {
            setItems(d.items);
            try { localStorage.setItem(`place_campaigns_${placeId}`, JSON.stringify(d.items)); } catch {}
          }
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [placeId]);

  // 활성 카드뉴스가 바뀌면 슬라이드 네비게이션을 첫 페이지(0)로 초기화
  useEffect(() => {
    setSlideNavIdx(0);
  }, [activeCarouselIdx]);

  // 카드뉴스(캐러셀)와 일반 텍스트 캠페인 분리 (단일 포스터는 홍보소식 구역에서 전담)
  const carouselCampaigns = items.filter(c => Boolean(c.carousel && Array.isArray(c.carousel.slides) && c.carousel.slides.length > 0));
  const otherCampaigns = items.filter(c => !c.carousel && !c.card && !c.hasPoster);

  const hasAnyContent = carouselCampaigns.length > 0 || otherCampaigns.length > 0;
  const currentCarouselCampaign = carouselCampaigns[activeCarouselIdx] || carouselCampaigns[0];

  return (
    <section className="place-campaign-section" style={{ margin: '24px 0 16px' }} aria-label="사장님이 전하는 캠페인">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>사장님이 전하는 캠페인</span>
          {carouselCampaigns.length > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '999px' }}>
              인스타 카드뉴스 {carouselCampaigns.length}건
            </span>
          )}
        </h3>
      </div>

      {!hasAnyContent && (
        <p className="muted" style={{ margin: '8px 0', fontSize: '13px' }}>
          아직 사장님 캠페인이 없어요.
        </p>
      )}

      {/* 1. 인스타그램 카드뉴스: 모든 페이지를 볼 수 있는 완전한 형태 */}
      {carouselCampaigns.length > 0 && currentCarouselCampaign && (
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '16px',
            marginBottom: '18px'
          }}
        >
          {/* 복수의 카드뉴스가 있을 때: 카드뉴스 선택 탭 */}
          {carouselCampaigns.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
              {carouselCampaigns.map((c, idx) => {
                const isSelected = idx === activeCarouselIdx;
                const titleSnippet = c.carousel?.concept || c.title || `카드뉴스 #${idx + 1}`;
                return (
                  <button
                    key={c.id || idx}
                    type="button"
                    onClick={() => setActiveCarouselIdx(idx)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#475569',
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
                    <span>📸 카드뉴스 {idx + 1}</span>
                    <span style={{ color: isSelected ? '#0284c7' : '#94a3b8', fontSize: '11px' }}>
                      ({titleSnippet.length > 15 ? titleSnippet.slice(0, 15) + '...' : titleSnippet})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 카드뉴스의 모든 카드 페이지(슬라이드) 직관적 바로가기 탭 */}
          {currentCarouselCampaign.carousel?.slides?.length > 1 && (
            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                  📑 전체 {currentCarouselCampaign.carousel.slides.length}장 슬라이드 바로가기:
                </span>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                  현재 {slideNavIdx + 1} / {currentCarouselCampaign.carousel.slides.length}장
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {currentCarouselCampaign.carousel.slides.map((s, sIdx) => {
                  const isCurrent = sIdx === slideNavIdx;
                  const badgeName = s.badge || (s.type === 'cover' ? '표지' : s.type === 'menu' ? '메뉴' : s.type === 'celebrity' ? (s.celebrityName || '셀럽') : s.type === 'benefit' ? '혜택' : '위치');
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setSlideNavIdx(sIdx)}
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

          {/* 완전한 형태의 인스타그램 캐러셀 뷰어 본체 (모든 페이지 슬라이드 및 사진 확인) */}
          <div style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <InstagramCarouselView
              key={currentCarouselCampaign.id}
              carousel={currentCarouselCampaign.carousel}
              shopName={shopName}
              editable={false}
              initialIndex={slideNavIdx}
              onSlideChange={setSlideNavIdx}
            />
          </div>

          {/* 캠페인 게시 정보 & 본문 내용 */}
          <div style={{ marginTop: '12px', padding: '12px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <b style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              {currentCarouselCampaign.title}
            </b>
            {currentCarouselCampaign.body && (
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {currentCarouselCampaign.body}
              </p>
            )}
            <small style={{ fontSize: '11px', color: '#94a3b8' }}>
              사장님 계정에서 게시 · {new Date(currentCarouselCampaign.updatedAt || Date.now()).toLocaleDateString('ko-KR')}
            </small>
          </div>
        </div>
      )}

      {/* 2. 일반 텍스트 캠페인 */}
      {otherCampaigns.map(c => (
        <article className="place-update" key={c.id}>
          <b>{c.title}</b>
          <p>{c.body}</p>
          <small>사장님 계정에서 게시 · {new Date(c.updatedAt).toLocaleDateString('ko-KR')}</small>
          {c.proposalId && (
            <img
              className="upload-preview"
              src={`/api/owner/campaigns/${encodeURIComponent(placeId)}/${c.id}/image`}
              alt="사장님이 승인한 AI 홍보 이미지"
            />
          )}
        </article>
      ))}
    </section>
  );
}
