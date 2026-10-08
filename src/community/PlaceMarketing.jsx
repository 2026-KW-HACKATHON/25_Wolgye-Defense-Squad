import React, { useEffect, useState } from 'react';
import { InstagramCarouselView } from './PromoCardCanvas';
import './place-marketing.css';

async function record(placeId, details) {
  const response = await fetch(`/api/owner/views/${encodeURIComponent(placeId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ details })
  });
  if (!response.ok) throw new Error('조회 정보를 반영하지 못했어요.');
}

// 로그인한 이용자가 자발적으로 남긴 연령대·성별만 함께 보낸다.
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

  useEffect(() => {
    if (Array.isArray(initialCampaigns) && initialCampaigns.length > 0) setItems(initialCampaigns);
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
    return () => { live = false; };
  }, [placeId]);

  const carouselCampaigns = (items || []).filter(c =>
    c && typeof c === 'object' && Array.isArray(c.carousel?.slides) && c.carousel.slides.length > 0
  );
  const otherCampaigns = (items || []).filter(c => c && typeof c === 'object' && !c.carousel && !c.card && !c.hasPoster);
  const currentCampaign = carouselCampaigns[activeCarouselIdx] || carouselCampaigns[0];

  if (!currentCampaign && otherCampaigns.length === 0) return null;

  return (
    <section className="place-campaign-section" aria-label="사장님 카드뉴스">
      {currentCampaign && (
        <>
          <div className="place-campaign-heading">
            <div>
              <span className="place-campaign-eyebrow">사장님이 전하는 이야기</span>
              <h3>카드뉴스 <span>{carouselCampaigns.length}건</span></h3>
            </div>
            <span className="place-campaign-page-count">{currentCampaign.carousel.slides.length}장</span>
          </div>

          {carouselCampaigns.length > 1 && (
            <div className="place-campaign-picker">
              <label htmlFor={`campaign-${placeId}`}>카드뉴스 선택</label>
              <select
                id={`campaign-${placeId}`}
                value={activeCarouselIdx < carouselCampaigns.length ? activeCarouselIdx : 0}
                onChange={e => {
                  setActiveCarouselIdx(Number(e.target.value));
                  setSlideNavIdx(0);
                }}
              >
                {carouselCampaigns.map((campaign, index) => (
                  <option key={campaign.id || index} value={index}>
                    {index + 1}. {campaign.title || campaign.carousel.concept || '카드뉴스'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="place-campaign-content">
            <div className="place-campaign-title">
              <b>{currentCampaign.title || currentCampaign.carousel.concept || '가게 카드뉴스'}</b>
              <small>사장님 게시 · {new Date(currentCampaign.updatedAt || Date.now()).toLocaleDateString('ko-KR')}</small>
            </div>
            <InstagramCarouselView
              key={currentCampaign.id || activeCarouselIdx}
              carousel={currentCampaign.carousel}
              shopName={shopName}
              publicView
              initialIndex={slideNavIdx}
              onSlideChange={setSlideNavIdx}
            />
            {currentCampaign.body && (
              <details className="place-campaign-body">
                <summary>게시글 전문 보기</summary>
                <p>{currentCampaign.body}</p>
              </details>
            )}
          </div>
        </>
      )}

      {otherCampaigns.map(c => (
        <article className="place-update" key={c.id}>
          <b>{c.title}</b>
          <p>{c.body}</p>
          <small>사장님 계정에서 게시 · {new Date(c.updatedAt).toLocaleDateString('ko-KR')}</small>
          {c.proposalId && (
            <img className="upload-preview" src={`/api/owner/campaigns/${encodeURIComponent(placeId)}/${c.id}/image`} alt="사장님이 승인한 AI 홍보 이미지" />
          )}
        </article>
      ))}
    </section>
  );
}
