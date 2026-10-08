import React, { useState, useEffect, useRef } from 'react';
import PromoCardCanvas from './PromoCardCanvas';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function PlaceDetailPromos({ placeId, shopName, defaultPromo, allPromos = [] }) {
  const [promosList, setPromosList] = useState(() => {
    if (allPromos && allPromos.length > 0) return allPromos;
    if (defaultPromo) return [defaultPromo];
    try {
      const stored = localStorage.getItem(`place_campaigns_${placeId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const lastWheelTime = useRef(0);

  // 상위에서 전달된 포스터/캠페인 목록이 갱신되면 즉시 반영
  useEffect(() => {
    if (Array.isArray(allPromos) && allPromos.length > 0) {
      setPromosList(allPromos);
    }
  }, [allPromos]);

  // 실시간 최신 목록 조회 및 동기화
  useEffect(() => {
    let isMounted = true;
    if (placeId) {
      fetch(`/api/owner/campaigns/${encodeURIComponent(placeId)}`)
        .then(r => r.json())
        .then(d => {
          if (isMounted && Array.isArray(d.items) && d.items.length > 0) {
            setPromosList(d.items);
            try { localStorage.setItem(`place_campaigns_${placeId}`, JSON.stringify(d.items)); } catch {}
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [placeId]);

  // 포스트/단일 포스터만 필터링 (카드뉴스는 캠페인 구역으로 분리)
  const posterItems = promosList.filter(item => {
    return Boolean(item.card || item.hasPoster || (!item.carousel && item.poster));
  });

  // 최근에 게시한 포스트일수록 위로 오도록 최신순(updatedAt 내림차순) 정렬
  const sortedPosters = [...posterItems].sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tB - tA;
  });

  // 유효한 인덱스 유지
  useEffect(() => {
    if (activePosterIndex >= sortedPosters.length && sortedPosters.length > 0) {
      setActivePosterIndex(0);
    }
  }, [sortedPosters.length, activePosterIndex]);

  if (sortedPosters.length === 0) {
    return null;
  }

  const canGoUp = activePosterIndex > 0;
  const canGoDown = activePosterIndex < sortedPosters.length - 1;

  const handleGoUp = () => {
    if (canGoUp) setActivePosterIndex(i => i - 1);
  };

  const handleGoDown = () => {
    if (canGoDown) setActivePosterIndex(i => i + 1);
  };

  // 마우스 휠로 위아래 슬라이딩 지원
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 350) return; // 휠 쓰로틀
    if (Math.abs(e.deltaY) > 25) {
      if (e.deltaY > 0 && canGoDown) {
        lastWheelTime.current = now;
        handleGoDown();
      } else if (e.deltaY < 0 && canGoUp) {
        lastWheelTime.current = now;
        handleGoUp();
      }
    }
  };

  // 모바일 터치 스와이프로 위아래 슬라이딩 지원
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -40 && canGoDown) {
      handleGoDown(); // 아래로 슬라이딩 (이전 포스트)
    } else if (deltaY > 40 && canGoUp) {
      handleGoUp(); // 위로 슬라이딩 (최신 포스트)
    }
  };

  const currentPoster = sortedPosters[activePosterIndex];

  return (
    <div
      className="place-detail-promos-container"
      style={{
        margin: '18px 0',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}
    >
      {/* 1. 홍보소식 헤더: 제목 + 최신순 정렬 안내 + 개수 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📢</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            사장님 홍보 소식 <span style={{ color: '#2563eb', fontSize: '13px', fontWeight: 700 }}>({sortedPosters.length}개)</span>
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '999px',
              background: activePosterIndex === 0 ? '#dbeafe' : '#f1f5f9',
              color: activePosterIndex === 0 ? '#1d4ed8' : '#64748b'
            }}
          >
            {activePosterIndex === 0 ? '✨ 가장 최근' : `${activePosterIndex + 1}번째`} ({activePosterIndex + 1}/{sortedPosters.length})
          </span>
        </div>
      </div>

      {/* 2. 위아래 슬라이딩 컨트롤 바 (포스터가 2개 이상일 때) */}
      {sortedPosters.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            padding: '8px 12px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              위아래 슬라이딩으로 다른 포스터 보기
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleGoUp}
              disabled={!canGoUp}
              title="위로 (더 최신 포스트)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 10px',
                borderRadius: '8px',
                border: canGoUp ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: canGoUp ? '#eff6ff' : '#f8fafc',
                color: canGoUp ? '#1e40af' : '#cbd5e1',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: canGoUp ? 'pointer' : 'not-allowed'
              }}
            >
              <ChevronUp size={14} />
              <span>위로(최신)</span>
            </button>
            <button
              type="button"
              onClick={handleGoDown}
              disabled={!canGoDown}
              title="아래로 (이전 포스트)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 10px',
                borderRadius: '8px',
                border: canGoDown ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: canGoDown ? '#eff6ff' : '#f8fafc',
                color: canGoDown ? '#1e40af' : '#cbd5e1',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: canGoDown ? 'pointer' : 'not-allowed'
              }}
            >
              <span>아래로(이전)</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 3. 위아래 슬라이딩 뷰포트 영역 (수직 슬라이더) */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* 오른쪽 세로 도트 인디케이터 */}
        {sortedPosters.length > 1 && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(4px)',
              padding: '6px 4px',
              borderRadius: '999px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {sortedPosters.map((_, idx) => {
              const isCur = idx === activePosterIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePosterIndex(idx)}
                  title={idx === 0 ? '가장 최근 포스트' : `${idx + 1}번째 포스트`}
                  style={{
                    width: '8px',
                    height: isCur ? '20px' : '8px',
                    borderRadius: '999px',
                    border: 'none',
                    background: isCur ? '#2563eb' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    padding: 0
                  }}
                />
              );
            })}
          </div>
        )}

        {/* 세로 슬라이드 트랙 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            transform: `translateY(-${activePosterIndex * 100}%)`,
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            width: '100%'
          }}
        >
          {sortedPosters.map((item, idx) => {
            const posterUrl = item.hasPoster
              ? `/api/owner/campaigns/${encodeURIComponent(item.placeId || placeId)}/${item.id}/poster`
              : null;

            return (
              <div
                key={item.id || idx}
                style={{
                  width: '100%',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  padding: '14px 10px'
                }}
              >
                {posterUrl ? (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <img
                      src={posterUrl}
                      alt={`${shopName} 포스터`}
                      style={{ maxWidth: '100%', maxHeight: '520px', borderRadius: '12px', objectFit: 'contain' }}
                    />
                  </div>
                ) : item.card ? (
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <PromoCardCanvas
                      card={item.card}
                      shopName={shopName}
                      editable={false}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <p>게시된 포스터 내용을 불러오고 있습니다.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 하단 포스터 설명 & 슬라이딩 안내 */}
      <div style={{ marginTop: '10px', padding: '10px 14px', background: '#f1f5f9', borderRadius: '12px', fontSize: '12px', color: '#475569' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>
            {activePosterIndex === 0 ? '🌟 최근 게시 포스트' : `📌 ${activePosterIndex + 1}번째 포스트`}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {new Date(currentPoster?.updatedAt || Date.now()).toLocaleDateString('ko-KR')} 게시
          </span>
        </div>
        {sortedPosters.length > 1 && (
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
            마우스 휠이나 버튼으로 위아래 슬라이딩하여 다른 포스터({sortedPosters.length}개)를 볼 수 있어요.
          </p>
        )}
      </div>
    </div>
  );
}
