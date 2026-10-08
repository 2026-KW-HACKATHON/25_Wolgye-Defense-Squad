import React, { useState } from 'react';

export const THEME_STYLES = {
  warm: {
    name: '따뜻한 오렌지',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    border: '#fed7aa',
    accent: '#ea580c',
    heroBg: '#ea580c',
    heroText: '#ffffff',
    titleColor: '#7c2d12',
    textColor: '#9a3412',
    badgeBg: '#ea580c',
    badgeText: '#ffffff',
    stampBorder: '#dc2626',
    stampText: '#dc2626'
  },
  lime: {
    name: '월계 라임 (시그니처)',
    bg: 'linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%)',
    border: '#d9f99d',
    accent: '#65a30d',
    heroBg: '#1b3b11',
    heroText: '#d5f260',
    titleColor: '#1a2e05',
    textColor: '#365314',
    badgeBg: '#4d7c0f',
    badgeText: '#ffffff',
    stampBorder: '#1b3b11',
    stampText: '#1b3b11'
  },
  dark: {
    name: '모던 다크 (골드 엣지)',
    bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    border: '#3f3f46',
    accent: '#fbbf24',
    heroBg: '#fbbf24',
    heroText: '#18181b',
    titleColor: '#ffffff',
    textColor: '#d4d4d8',
    badgeBg: '#fbbf24',
    badgeText: '#18181b',
    stampBorder: '#fbbf24',
    stampText: '#fbbf24'
  },
  retro: {
    name: '레트로 분식/포차',
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    border: '#fecdd3',
    accent: '#e11d48',
    heroBg: '#be123c',
    heroText: '#ffffff',
    titleColor: '#881337',
    textColor: '#9f1239',
    badgeBg: '#e11d48',
    badgeText: '#ffffff',
    stampBorder: '#be123c',
    stampText: '#be123c'
  },
  pastel: {
    name: '파스텔 카페/디저트',
    bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
    border: '#f5d0fe',
    accent: '#c026d3',
    heroBg: '#a21caf',
    heroText: '#ffffff',
    titleColor: '#4a044e',
    textColor: '#701a75',
    badgeBg: '#c026d3',
    badgeText: '#ffffff',
    stampBorder: '#c026d3',
    stampText: '#c026d3'
  },
  'red-hot': {
    name: '화끈한 핫딜 (레드&옐로)',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '#fde68a',
    accent: '#dc2626',
    heroBg: '#dc2626',
    heroText: '#fef08a',
    titleColor: '#991b1b',
    textColor: '#b45309',
    badgeBg: '#dc2626',
    badgeText: '#ffffff',
    stampBorder: '#dc2626',
    stampText: '#dc2626'
  },
  indigo: {
    name: '신뢰의 인디고 블루',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '#bfdbfe',
    accent: '#2563eb',
    heroBg: '#1e40af',
    heroText: '#ffffff',
    titleColor: '#1e3a8a',
    textColor: '#1d4ed8',
    badgeBg: '#2563eb',
    badgeText: '#ffffff',
    stampBorder: '#1e40af',
    stampText: '#1e40af'
  }
};

export const POSTER_TEMPLATES = {
  'bold-impact': { id: 'bold-impact', name: '⚡ 볼드 임팩트', desc: '대형 할인율·숫자가 시선을 압도하는 메인 포스터' },
  'retro-chalkboard': { id: 'retro-chalkboard', name: '✏️ 빈티지 칠판', desc: '분식집·고깃집·주점 감성의 초크보드 포스터' },
  'magazine-editorial': { id: 'magazine-editorial', name: '📰 감성 매거진', desc: '트렌디한 카페·다이닝 스타일의 감각적 포스터' },
  'neon-night': { id: 'neon-night', name: '🌙 심야 네온', desc: '늦은 밤 펍·주점·타임세일에 최적화된 네온 포스터' },
  'ticket-coupon': { id: 'ticket-coupon', name: '🎟️ 티켓 쿠폰', desc: '절취선과 바코드가 있는 실속형 쿠폰 바우처 포스터' }
};

/**
 * 사장님 프로모션 전문 포스터 & 디자인 카드 컴포넌트
 */
export default function PromoCardCanvas({ card, shopName, className = '', onEdit, editable = false }) {
  const [viewMode, setViewMode] = useState('poster'); // 'poster' (세로 포스터) or 'compact' (가로 카드)
  const [showImageSearch, setShowImageSearch] = useState(false);

  if (!card) return null;

  const themeKey = THEME_STYLES[card.theme] ? card.theme : 'warm';
  const baseTheme = THEME_STYLES[themeKey];
  const theme = card.bgImage ? {
    ...baseTheme,
    titleColor: '#ffffff',
    textColor: '#f1f5f9',
    accent: '#fef08a'
  } : baseTheme;
  const layout = POSTER_TEMPLATES[card.layout] ? card.layout : 'bold-impact';

  const heroMetric = card.heroMetric || (card.benefit?.match(/\d+[%원]|\d\+\d|무료|공짜|할인|서비스/)?.[0] || 'SPECIAL');
  const catchphrase = card.catchphrase || '월계1동 골목에서 전하는 특별한 한 끼';
  const period = card.period || '방문 시 혜택 적용';
  const stamp = card.stamp || '사장님 쏜다';

  return (
    <div className={`promo-poster-container ${className}`} style={{ margin: '14px 0' }}>
      {/* =========================================================================
          포스터 렌더러 (세로형 대형 포스터 or 가로형 카드)
      ========================================================================= */}
      <div
        className={`poster-frame ${layout} ${viewMode}`}
        style={{
          background: card.bgImage
            ? `linear-gradient(rgba(10, 15, 10, 0.45), rgba(10, 15, 10, 0.78)), url(${card.bgImage})`
            : layout === 'retro-chalkboard' ? '#1c221c' : layout === 'neon-night' ? '#0d1117' : theme.bg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: layout === 'retro-chalkboard' ? '4px dashed #6b7280' : layout === 'neon-night' ? '2px solid #38bdf8' : card.bgImage ? '2px solid #ffffff' : `2px solid ${theme.border}`,
          borderRadius: '20px',
          padding: viewMode === 'poster' ? '28px 24px 22px' : '18px 20px',
          boxShadow: layout === 'neon-night' ? '0 0 25px rgba(56, 189, 248, 0.25), 0 10px 30px rgba(0,0,0,0.5)' : card.bgImage ? '0 12px 35px rgba(0,0,0,0.22)' : '0 10px 30px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          color: card.bgImage ? '#ffffff' : layout === 'retro-chalkboard' || layout === 'neon-night' ? '#f3f4f6' : theme.textColor,
          maxWidth: viewMode === 'poster' ? '460px' : '100%',
          margin: '0 auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif'
        }}
      >
        {/* 상단 장식 라인 & 코너 워터마크 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: layout === 'neon-night' ? '#ec4899' : theme.badgeBg,
                color: theme.badgeText,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: layout === 'neon-night' ? '0 0 10px #ec4899' : 'none'
              }}
            >
              ✦ {card.badge || '오늘의 혜택'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.75, letterSpacing: '0.02em' }}>
              {period}
            </span>
          </div>

          <span style={{ fontSize: '12px', fontWeight: 700, color: layout === 'neon-night' ? '#38bdf8' : theme.titleColor, opacity: 0.9 }}>
            📍 {shopName || '월계1동 골목 가게'}
          </span>
        </div>

        {/* ==========================================
            LAYOUT 1: BOLD IMPACT (대형 볼드 팝 포스터)
        ========================================== */}
        {layout === 'bold-impact' && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: theme.accent, letterSpacing: '0.05em' }}>
                {catchphrase}
              </p>
              <h2 style={{ margin: '0 0 14px', fontSize: '24px', fontWeight: 900, color: theme.titleColor, lineHeight: 1.25, wordBreak: 'keep-all' }}>
                {card.title}
              </h2>

              {/* 거대한 HERO METRIC (시선을 사로잡는 대형 혜택) */}
              <div
                style={{
                  background: theme.heroBg,
                  color: theme.heroText,
                  padding: '16px 20px',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  transform: 'rotate(-1.5deg)',
                  margin: '8px 0 16px',
                  minWidth: '220px',
                  border: '3px solid #ffffff'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.9, textTransform: 'uppercase' }}>
                  SPECIAL BENEFIT
                </span>
                <span style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  {heroMetric}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                  {card.benefit || '주문 시 특별 제공'}
                </span>
              </div>
            </div>

            {/* 본문 안내 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.7)', borderRadius: '12px', padding: '12px 16px', border: `1px solid ${theme.border}`, margin: '10px 0' }}>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.55, color: theme.textColor, fontWeight: 500 }}>
                {card.body}
              </p>
            </div>
          </div>
        )}

        {/* ==========================================
            LAYOUT 2: RETRO CHALKBOARD (빈티지 칠판 포스터)
        ========================================== */}
        {layout === 'retro-chalkboard' && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px dashed #4b5563', marginBottom: '14px' }}>
              <span style={{ color: '#facc15', fontSize: '12px', fontWeight: 800, letterSpacing: '0.15em' }}>
                ★★★ TODAY SPECIAL MENU ★★★
              </span>
              <h2 style={{ margin: '8px 0', fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', wordBreak: 'keep-all' }}>
                {card.title}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>
                {catchphrase}
              </p>
            </div>

            <div style={{ background: '#272f27', border: '2px solid #4ade80', borderRadius: '12px', padding: '16px', textAlign: 'center', margin: '14px 0' }}>
              <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 800 }}>[ 사장님 추천 혜택 ]</span>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#fef08a', margin: '6px 0', textShadow: '0 0 10px rgba(250,204,21,0.4)' }}>
                {heroMetric}
              </div>
              <p style={{ margin: 0, color: '#e5e7eb', fontSize: '14px', fontWeight: 700 }}>
                {card.benefit}
              </p>
            </div>

            <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: 1.6, textAlign: 'center', margin: '12px 0 0' }}>
              {card.body}
            </p>
          </div>
        )}

        {/* ==========================================
            LAYOUT 3: MAGAZINE EDITORIAL (감성 미식 매거진)
        ========================================== */}
        {layout === 'magazine-editorial' && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ borderBottom: `2px solid ${theme.titleColor}`, paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: theme.titleColor, letterSpacing: '0.15em' }}>
                <span>WOLGYE LOCAL GOURMET NOTE</span>
                <span>VOL. 08</span>
              </div>
            </div>

            <p style={{ margin: '0 0 4px', fontSize: '13px', fontStyle: 'italic', color: theme.accent, fontWeight: 700 }}>
              "{catchphrase}"
            </p>
            <h2 style={{ margin: '0 0 16px', fontSize: '25px', fontWeight: 900, color: theme.titleColor, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {card.title}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.85)', padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}`, margin: '12px 0' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: theme.accent, textTransform: 'uppercase' }}>FEATURED OFFER</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: theme.titleColor, marginTop: '2px' }}>
                  {card.benefit}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: theme.textColor, lineHeight: 1.45 }}>
                  {card.body}
                </p>
              </div>
              <div style={{ textAlign: 'center', background: theme.titleColor, color: '#fff', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, opacity: 0.8 }}>NOW</span>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>{heroMetric}</span>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            LAYOUT 4: NEON NIGHT (심야 네온 펍/주점)
        ========================================== */}
        {layout === 'neon-night' && (
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em', textShadow: '0 0 8px #38bdf8' }}>
              ★ NIGHT EVENT SPECIAL ★
            </span>
            <h2 style={{ margin: '8px 0', fontSize: '26px', fontWeight: 900, color: '#ffffff', textShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 20px #ec4899', letterSpacing: '-0.01em' }}>
              {card.title}
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
              {catchphrase}
            </p>

            <div style={{ border: '2px solid #ec4899', borderRadius: '16px', padding: '16px', margin: '14px 0', boxShadow: 'inset 0 0 15px rgba(236,72,153,0.3), 0 0 15px rgba(236,72,153,0.3)' }}>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#f43f5e', textShadow: '0 0 14px #f43f5e, 0 0 25px #ec4899' }}>
                {heroMetric}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
                {card.benefit}
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55, margin: '10px 0 0' }}>
              {card.body}
            </p>
          </div>
        )}

        {/* ==========================================
            LAYOUT 5: TICKET COUPON (티켓 절취선 쿠폰)
        ========================================== */}
        {layout === 'ticket-coupon' && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: theme.accent, letterSpacing: '0.1em' }}>
                SPECIAL VOUCHER COUPON
              </span>
              <h2 style={{ margin: '6px 0', fontSize: '23px', fontWeight: 900, color: theme.titleColor }}>
                {card.title}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textColor, fontWeight: 600 }}>
                {catchphrase}
              </p>
            </div>

            {/* 쿠폰 절취선 */}
            <div style={{ position: 'relative', margin: '16px -24px', borderTop: `2px dashed ${theme.border}` }}>
              <div style={{ position: 'absolute', left: '-12px', top: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: `2px solid ${theme.border}` }} />
              <div style={{ position: 'absolute', right: '-12px', top: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: `2px solid ${theme.border}` }} />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: theme.accent }}>COUPON PASS</span>
                <div style={{ fontSize: '16px', fontWeight: 900, color: theme.titleColor }}>
                  {card.benefit}
                </div>
                <small style={{ color: theme.textColor, fontSize: '11px' }}>매장 방문 시 제시해 주세요</small>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: theme.heroBg }}>
                {heroMetric}
              </div>
            </div>

            {/* 바코드 비주얼 장식 */}
            <div style={{ marginTop: '14px', textAlign: 'center', opacity: 0.7 }}>
              <div style={{ display: 'inline-flex', gap: '2px', height: '24px', alignItems: 'flex-end' }}>
                {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4].map((w, i) => (
                  <div key={i} style={{ width: `${w > 5 ? 3 : w > 2 ? 2 : 1}px`, height: '24px', background: theme.titleColor }} />
                ))}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: theme.titleColor, marginTop: '2px' }}>
                WOLGYE-PASS-2026
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            공통 하단: 도장 스탬프(Stamp) & 공식 워터마크
        ========================================================================= */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: layout === 'retro-chalkboard' ? '1px solid #374151' : layout === 'neon-night' ? '1px solid #1e293b' : `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.75 }}>
            월계밥상 사장님 공식 소식 ✦ 매장 인증
          </div>

          {/* 빈티지 도장 스탬프 그래픽 */}
          {stamp && (
            <div
              style={{
                border: `2px solid ${layout === 'neon-night' ? '#f43f5e' : theme.stampBorder}`,
                color: layout === 'neon-night' ? '#f43f5e' : theme.stampText,
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 900,
                transform: 'rotate(-6deg)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            >
              ★ {stamp}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          사장님 포스터 디자인 스튜디오 툴바 (editable 모드일 때 렌더링)
      ========================================================================= */}
      {editable && onEdit && (
        <div
          className="poster-studio-toolbar"
          style={{
            marginTop: '12px',
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            display: 'grid',
            gap: '12px'
          }}
        >
          {/* 1. 템플릿 레이아웃 변경 */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
              🎨 포스터 템플릿 스타일:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.values(POSTER_TEMPLATES).map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => onEdit({ ...card, layout: tmpl.id })}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: card.layout === tmpl.id ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    background: card.layout === tmpl.id ? '#0f172a' : '#f8fafc',
                    color: card.layout === tmpl.id ? '#ffffff' : '#334155',
                    fontSize: '12px',
                    fontWeight: card.layout === tmpl.id ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={tmpl.desc}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 컬러 테마 선택 */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
              🌈 테마 컬러:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(THEME_STYLES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onEdit({ ...card, theme: key })}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '6px',
                    border: card.theme === key ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    background: t.bg,
                    color: t.titleColor,
                    fontSize: '11px',
                    fontWeight: card.theme === key ? 800 : 600,
                    cursor: 'pointer'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 스탬프 도장, 배경 사진 검색 및 뷰 모드 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>🏷️ 도장:</span>
              {['사장님 쏜다', 'HOT', 'LIMITED', 'STUDENT ONLY', 'BEST'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onEdit({ ...card, stamp: st })}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border: card.stamp === st ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                    background: card.stamp === st ? '#fee2e2' : '#fff',
                    color: card.stamp === st ? '#dc2626' : '#64748b',
                    fontSize: '11px',
                    fontWeight: card.stamp === st ? 800 : 600,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowImageSearch(true)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: '1.5px solid #1b3b11',
                  background: '#f1f4e7',
                  color: '#1b3b11',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                📷 배경 사진 웹 검색/변경
              </button>
              {card.bgImage && (
                <button
                  type="button"
                  onClick={() => onEdit({ ...card, bgImage: null })}
                  style={{
                    padding: '4px 7px',
                    borderRadius: '6px',
                    border: '1px solid #fecdd3',
                    background: '#fff1f2',
                    color: '#e11d48',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  사진 제거
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode(v => v === 'poster' ? 'compact' : 'poster')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {viewMode === 'poster' ? '📱 가로형 카드 보기' : '📜 세로 포스터 보기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포스터용 웹 이미지 검색 모달 */}
      <ImageSearchModal
        isOpen={showImageSearch}
        onClose={() => setShowImageSearch(false)}
        shopName={shopName}
        initialQuery={`${shopName || '월계동'} ${card.title || '음식'}`}
        onSelect={(imgUrl) => {
          onEdit({ ...card, bgImage: imgUrl });
          setShowImageSearch(false);
        }}
      />
    </div>
  );
}


/**
 * 고해상도 세로형 상업용 포스터(800 x 1060 px) Canvas 2D 이미지 생성 유틸리티
 */
export function generatePromoImageBase64(card, shopName) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1060;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const themeKey = THEME_STYLES[card.theme] ? card.theme : 'warm';
    const theme = THEME_STYLES[themeKey];
    const layout = card.layout || 'bold-impact';

    const heroMetric = card.heroMetric || (card.benefit?.match(/\d+[%원]|\d\+\d|무료|공짜|할인|서비스/)?.[0] || 'SPECIAL');
    const catchphrase = card.catchphrase || '월계1동 골목에서 전하는 특별한 한 끼';
    const period = card.period || '방문 시 혜택 적용';
    const stamp = card.stamp || '사장님 쏜다';

    // 1. 배경 채우기
    if (layout === 'retro-chalkboard') {
      ctx.fillStyle = '#1c221c';
      ctx.fillRect(0, 0, 800, 1060);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 6;
      ctx.setLineDash([12, 12]);
      ctx.strokeRect(30, 30, 740, 1000);
      ctx.setLineDash([]);
    } else if (layout === 'neon-night') {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, 800, 1060);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 1000);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 800, 1060);
      if (themeKey === 'dark') { grad.addColorStop(0, '#18181b'); grad.addColorStop(1, '#27272a'); }
      else if (themeKey === 'lime') { grad.addColorStop(0, '#f7fee7'); grad.addColorStop(1, '#ecfccb'); }
      else if (themeKey === 'retro') { grad.addColorStop(0, '#fff1f2'); grad.addColorStop(1, '#ffe4e6'); }
      else if (themeKey === 'pastel') { grad.addColorStop(0, '#fdf4ff'); grad.addColorStop(1, '#fae8ff'); }
      else if (themeKey === 'red-hot') { grad.addColorStop(0, '#fffbeb'); grad.addColorStop(1, '#fef3c7'); }
      else if (themeKey === 'indigo') { grad.addColorStop(0, '#eff6ff'); grad.addColorStop(1, '#dbeafe'); }
      else { grad.addColorStop(0, '#fff7ed'); grad.addColorStop(1, '#ffedd5'); }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 1060);

      // 모던 테두리 프레임
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 6;
      ctx.strokeRect(26, 26, 748, 1008);
    }


    // 2. 상단 헤더 배지 & 매장명
    ctx.fillStyle = layout === 'neon-night' ? '#ec4899' : theme.badgeBg;
    ctx.beginPath();
    ctx.roundRect(60, 60, 160, 44, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`✦ ${card.badge || '오늘의 혜택'}`, 78, 88);

    ctx.fillStyle = layout === 'retro-chalkboard' || layout === 'neon-night' ? '#94a3b8' : theme.titleColor;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`📍 ${shopName || '월계1동 골목 가게'}`, 740, 88);
    ctx.textAlign = 'left';

    // 3. 서브 캐치프레이즈
    ctx.fillStyle = layout === 'neon-night' ? '#38bdf8' : theme.accent;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(catchphrase, 400, 175);

    // 4. 메인 포스터 타이틀
    ctx.fillStyle = layout === 'retro-chalkboard' || layout === 'neon-night' ? '#ffffff' : theme.titleColor;
    ctx.font = '900 42px sans-serif';
    ctx.fillText(card.title || '사장님 이벤트 소식', 400, 240);

    // 5. 중앙 대형 HERO METRIC 카드 박스 (포스터의 핵심!)
    const heroBoxY = 290;
    ctx.fillStyle = layout === 'retro-chalkboard' ? '#272f27' : layout === 'neon-night' ? '#1e1b4b' : theme.heroBg;
    ctx.beginPath();
    ctx.roundRect(140, heroBoxY, 520, 230, 24);
    ctx.fill();

    ctx.strokeStyle = layout === 'neon-night' ? '#ec4899' : '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(140, heroBoxY, 520, 230);

    ctx.fillStyle = layout === 'neon-night' ? '#f43f5e' : theme.heroText;
    ctx.font = '900 80px sans-serif';
    ctx.fillText(heroMetric, 400, heroBoxY + 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(card.benefit || '특별 할인 혜택', 400, heroBoxY + 185);

    // 6. 이벤트 조건 및 본문 박스
    const bodyBoxY = 560;
    ctx.fillStyle = layout === 'retro-chalkboard' ? '#1f2937' : layout === 'neon-night' ? '#111827' : 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(80, bodyBoxY, 640, 270, 18);
    ctx.fill();
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(80, bodyBoxY, 640, 270);

    ctx.fillStyle = layout === 'neon-night' ? '#38bdf8' : theme.accent;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🗓️ 행사 일정: ${period}`, 110, bodyBoxY + 50);

    ctx.fillStyle = layout === 'retro-chalkboard' || layout === 'neon-night' ? '#e2e8f0' : theme.textColor;
    ctx.font = '500 22px sans-serif';
    const lines = (card.body || '').split('\n');
    let lineY = bodyBoxY + 105;
    for (const l of lines.slice(0, 4)) {
      ctx.fillText(l, 110, lineY);
      lineY += 38;
    }

    // 7. 하단 스탬프 도장
    if (stamp) {
      ctx.save();
      ctx.translate(650, 920);
      ctx.rotate(-0.1);
      ctx.strokeStyle = layout === 'neon-night' ? '#f43f5e' : theme.stampBorder;
      ctx.lineWidth = 4;
      ctx.strokeRect(-80, -25, 160, 50);
      ctx.fillStyle = layout === 'neon-night' ? '#f43f5e' : theme.stampText;
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★ ${stamp}`, 0, 8);
      ctx.restore();
    }

    // 8. 하단 워터마크 안내
    ctx.fillStyle = layout === 'retro-chalkboard' || layout === 'neon-night' ? '#94a3b8' : theme.textColor;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('월계밥상 사장님 공식 소식 ✦ 매장 방문 시 본 포스터를 보여주세요', 80, 990);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * 웹 이미지 검색 모달 (동네 배경, 메뉴 음식, 연예인/인플루언서 사진)
 */
export function ImageSearchModal({ isOpen, onClose, onSelect, initialQuery = '', shopName = '' }) {
  const [query, setQuery] = useState(initialQuery || `${shopName || '월계동'} 맛집`);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickPills = [
    { label: '🍲 대표 메뉴/음식', q: `${shopName || '골목 식당'} 대표 메뉴 음식` },
    { label: '🏘️ 월계동·광운대 골목', q: '광운대역 월계동 골목 맛집' },
    { label: '⭐ 성시경 먹방', q: '성시경 먹을텐데 감탄' },
    { label: '⭐ 백종원 리액션', q: '백종원 맛집 감탄 리액션' },
    { label: '⭐ 풍자 또간집', q: '풍자 또간집 맛집' },
    { label: '🔥 핫플레이스 분위기', q: '감성 맛집 인테리어 요리' }
  ];

  const performSearch = async (targetQuery) => {
    const q = (targetQuery || query).trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/owner/images?q=${encodeURIComponent(q)}&count=16`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '이미지 검색에 실패했어요.');
      setImages(data.items || []);
      if (!data.items?.length) setError('검색 결과가 없어요. 다른 키워드로 검색해 보세요.');
    } catch (e) {
      setError(e.message || '이미지를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      const q = initialQuery || `${shopName || '월계동'} 맛집`;
      setQuery(q);
      performSearch(q);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              📷 웹 이미지 검색 및 사진 선택
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              우리 동네 배경, 먹음직스러운 음식, 연예인/인플루언서 사진을 골라 슬라이드에 적용하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: 800,
              color: '#475569'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <form
            onSubmit={e => { e.preventDefault(); performSearch(); }}
            style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}
          >
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="검색어 입력 (예: 성시경 먹방, 광운대 칼국수, 월계동 골목)"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: '#1b3b11',
                color: '#d5f260',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {loading ? '검색 중…' : '검색'}
            </button>
          </form>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setQuery(pill.q); performSearch(pill.q); }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
              <p style={{ margin: 0, fontWeight: 600 }}>풍성한 웹 이미지를 찾고 있어요…</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#ef4444', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px'
              }}
            >
              {images.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => { onSelect(item.url); onClose(); }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.title || '검색 이미지'}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.75) 100%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '6px 8px'
                    }}
                  >
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%'
                      }}
                    >
                      {item.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 인스타그램 캐러셀 슬라이드 고해상도 Canvas 2D 이미지 생성 (1080x1350 4:5 기본 규격)
 * 실제 사진 배경 위에 인스타그램 특유의 스티커와 텍스트 박스를 렌더링합니다.
 */
export async function generateCarouselSlideBase64(slide, index, total, carousel, shopName = '월계1동 골목가게') {
  try {
    const isPortrait = carousel?.aspectRatio !== '1:1';
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = isPortrait ? 1350 : 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. 실제 사진 배경 100% 채우기 (프록시 경유하여 CORS 방지)
    const photoUrl = slide.image || 'https://postfiles.pstatic.net/MjAyNDA1MTJfMjMy/MDAxNzE1NTExMDAwMDI3.2HEUC7rXaJYPQnUsvcKrUUeHo5pu2wK55a281Kz4oJYg.CXHEANwKJV4xDvRGZqUiSvdc5iSiq-xivUCRCIcAZ8Yg.JPEG/JK69cGshoFAsVsbH3Wzez4.jpg?type=w966';
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const proxyUrl = `/api/owner/proxy-image?url=${encodeURIComponent(photoUrl)}`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = proxyUrl;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. 인스타 감성 비네팅 그라디언트 (상단 & 하단 텍스트 가독성 확보)
    const topGrad = ctx.createLinearGradient(0, 0, 0, 320);
    topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, canvas.width, 320);

    const bottomGrad = ctx.createLinearGradient(0, canvas.height - 600, 0, canvas.height);
    bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)');
    bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, canvas.height - 600, canvas.width, 600);

    // 3. 인스타그램 상단 위치 스티커 (📍 월계1동 · 매장명)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(60, 60, 480, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📍 월계1동 · ${shopName}`, 86, 98);
    ctx.restore();

    // 4. 슬라이드 인디케이터 배지 (예: 1 / 4)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 180, 60, 120, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${index + 1} / ${total}`, canvas.width - 120, 97);
    ctx.restore();

    // 5. 인스타 블랙 스토리 텍스트 박스 타이틀 & 형광 서브타이틀
    const textStartY = canvas.height - 480;

    // 배지
    const badgeText = `✦ ${slide.badge || (slide.type === 'celebrity' ? '화제의 셀럽 추천' : slide.type === 'menu' ? '시그니처 메뉴' : slide.type === 'benefit' ? '특별 혜택' : '골목 핫플')}`;
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(60, textStartY - 70, 300, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(badgeText, 80, textStartY - 38);
    ctx.restore();

    // 메인 타이틀 (인스타 블랙 박스 타이포)
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.font = '900 52px sans-serif';
    ctx.beginPath();
    ctx.roundRect(60, textStartY - 10, canvas.width - 120, 90, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(slide.title || '오늘의 골목 특선', 84, textStartY + 54);
    ctx.restore();

    // 서브타이틀 (형광 하이라이트 스티커)
    if (slide.subtitle) {
      ctx.save();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(60, textStartY + 95, 600, 50, 10);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(slide.subtitle, 80, textStartY + 130);
      ctx.restore();
    }

    // 6. 유형별 스티커 콘텐츠
    if (slide.type === 'celebrity') {
      // 셀럽 리액션 말풍선 카드 스티커
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(60, textStartY + 160, canvas.width - 120, 170, 20);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, textStartY + 160, canvas.width - 120, 170);

      ctx.fillStyle = '#b45309';
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`⭐ ${slide.celebrityName || '성시경'}의 솔직 먹방 한 줄 평 ✓`, 90, textStartY + 205);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`“${slide.quote || '이 집 국물은 진짜입니다. 꼭 드셔보세요!'}”`, 90, textStartY + 255);

      if (slide.body) {
        ctx.fillStyle = '#64748b';
        ctx.font = '500 22px sans-serif';
        ctx.fillText(slide.body, 90, textStartY + 295);
      }
      ctx.restore();
    } else if (slide.highlight) {
      // 가격/혜택 하이라이트 스티커
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(60, textStartY + 160, canvas.width - 120, 110, 16);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, textStartY + 160, canvas.width - 120, 110);

      ctx.fillStyle = '#fde047';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(slide.highlight, 90, textStartY + 235);

      if (slide.body) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(slide.body, 420, textStartY + 230);
      }
      ctx.restore();
    } else if (slide.body) {
      // 본문 안내
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.roundRect(60, textStartY + 160, canvas.width - 120, 100, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 26px sans-serif';
      ctx.fillText(slide.body, 90, textStartY + 220);
      ctx.restore();
    }

    // 7. 하단 스와이프 유도 알약 스티커
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.roundRect((canvas.width - 420) / 2, canvas.height - 90, 420, 50, 25);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`👉 옆으로 넘겨서 확인 (${index + 1}/${total})`, canvas.width / 2, canvas.height - 57);
    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * 인스타그램 공식 피드 스타일 캐러셀 뷰어 & 내보내기 컴포넌트
 */
export function InstagramCarouselView({
  carousel,
  shopName,
  editable = false,
  onEdit,
  className = '',
  initialIndex = 0,
  onSlideChange
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [aspectRatio, setAspectRatio] = useState(carousel?.aspectRatio || '4:5');
  const [downloading, setDownloading] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);

  useEffect(() => {
    if (typeof initialIndex === 'number' && initialIndex >= 0) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  if (!carousel || !Array.isArray(carousel.slides) || carousel.slides.length === 0) {
    return null;
  }

  const slides = carousel.slides;
  const currentSlide = slides[activeIndex] || slides[0];

  const updateCurrentSlide = (fields) => {
    if (!onEdit) return;
    const newSlides = slides.map((s, i) => (i === activeIndex ? { ...s, ...fields } : s));
    onEdit({ ...carousel, slides: newSlides });
  };


  const downloadCurrentSlidePng = async () => {
    setDownloading(true);
    try {
      const b64 = await generateCarouselSlideBase64(currentSlide, activeIndex, slides.length, { ...carousel, aspectRatio }, shopName);
      if (b64) {
        const a = document.createElement('a');
        a.href = b64;
        a.download = `${shopName || 'wolgye'}_instagram_slide_${activeIndex + 1}.png`;
        a.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  const downloadAllSlidesPng = async () => {
    setDownloading(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        const b64 = await generateCarouselSlideBase64(slides[i], i, slides.length, { ...carousel, aspectRatio }, shopName);
        if (b64) {
          const a = document.createElement('a');
          a.href = b64;
          a.download = `${shopName || 'wolgye'}_instagram_slide_${i + 1}.png`;
          a.click();
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  // 슬라이드 유형별 기본 고화질 실사 사진 매핑 (로컬 정적 에셋 기반 100% 보장)
  const FALLBACK_BY_TYPE = {
    cover: '/community/restaurant.jpg',
    menu: '/community/food.jpg',
    celebrity: 'https://health.chosun.com/site/data/img_dir/2025/09/09/2025090903315_0.webp',
    benefit: '/community/food.jpg',
    location: '/community/wolgye/kwangwoon-station.jpg',
    cta: '/community/wolgye/kwangwoon-station.jpg'
  };

  // 배경 실사 사진 URL (외부 URL은 브라우저 403 핫링크 차단 방지를 위해 프록시 경유, 로컬 에셋은 직렬 서빙)
  const rawPhotoUrl = currentSlide.image || FALLBACK_BY_TYPE[currentSlide.type] || FALLBACK_BY_TYPE.cover;
  const photoUrl = rawPhotoUrl.startsWith('http') && !rawPhotoUrl.includes('/api/owner/proxy-image')
    ? `/api/owner/proxy-image?url=${encodeURIComponent(rawPhotoUrl)}`
    : rawPhotoUrl;

  return (
    <div className={`instagram-feed-card-wrapper ${className}`} style={{ margin: '14px 0' }}>
      {/* =========================================================================
          상단 컨트롤 바: 규격 (4:5 인스타 피드 vs 1:1) & PNG 다운로드
      ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
          padding: '8px 12px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
            📸 인스타그램 규격:
          </span>
          <button
            type="button"
            onClick={() => setAspectRatio('4:5')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: aspectRatio === '4:5' ? '#1b3b11' : '#e2e8f0',
              color: aspectRatio === '4:5' ? '#d5f260' : '#475569',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            4:5 세로 피드 (추천)
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('1:1')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: aspectRatio === '1:1' ? '#1b3b11' : '#e2e8f0',
              color: aspectRatio === '1:1' ? '#d5f260' : '#475569',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            1:1 정사각형
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {editable && (
            <>
              <button
                type="button"
                onClick={() => setShowImageSearch(true)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #1b3b11',
                  background: '#f1f4e7',
                  color: '#1b3b11',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                📷 사진 변경/검색
              </button>
              <button
                type="button"
                onClick={() => setShowEditDrawer(!showEditDrawer)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: showEditDrawer ? '#f1f5f9' : '#ffffff',
                  color: '#334155',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✏️ 문구 수정
              </button>
            </>
          )}
          <button

            type="button"
            disabled={downloading}
            onClick={downloadCurrentSlidePng}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            📥 현재 장 받기
          </button>
          <button
            type="button"
            disabled={downloading}
            onClick={downloadAllSlidesPng}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: 'none',
              background: '#1b3b11',
              color: '#d5f260',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            📥 전 슬라이드 PNG 받기
          </button>
        </div>
      </div>

      {/* =========================================================================
          실제 인스타그램 피드 포스트 프레임 (외곽 그림자 & 모바일 뷰어)
      ========================================================================= */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          maxWidth: '460px',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* 1. 인스타그램 공식 상단 프로필 헤더 */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '15px',
                  color: '#1b3b11'
                }}
              >
                {(shopName || '월')[0]}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                  {shopName || '월계1동 골목가게'}
                </span>
                <span style={{ color: '#0284c7', fontSize: '12px' }}>✓</span>
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                월계1동 · 서울 노원구
              </span>
            </div>
          </div>

          <div style={{ fontSize: '18px', color: '#64748b', cursor: 'pointer' }}>
            •••
          </div>
        </div>

        {/* 2. 메인 사진 뷰포트 (100% 실제 사진 풀블리드 + 인스타그램 스티커 오버레이) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: aspectRatio === '4:5' ? '4 / 5' : '1 / 1',
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.85) 100%), url(${photoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 18px',
            boxSizing: 'border-box',
            color: '#ffffff'
          }}
        >
          {/* 상단 스티커 영역 (위치 스티커 & 슬라이드 인디케이터) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <span style={{ color: '#ef4444' }}>📍</span>
              <span>월계1동 · {shopName || '광운대역 골목'}</span>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              {activeIndex + 1} / {slides.length}
            </div>
          </div>

          {/* 중앙/하단 스티커 영역 (인스타 스토리 텍스트 박스, 셀럽 리액션, 하이라이트) */}
          <div style={{ zIndex: 2, margin: 'auto 0 10px' }}>
            {/* 배지 스티커 */}
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  background: '#000000',
                  color: '#fde047',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'inline-block',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                ✦ {currentSlide.badge || (currentSlide.type === 'celebrity' ? '화제의 셀럽 추천' : currentSlide.type === 'menu' ? '시그니처 메뉴' : currentSlide.type === 'benefit' ? '특별 혜택' : '골목 핫플')}
              </span>
            </div>

            {/* 메인 타이틀 (인스타 블랙 박스 타이포그래피) */}
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: aspectRatio === '4:5' ? '24px' : '21px',
                fontWeight: 900,
                lineHeight: 1.35,
                color: '#ffffff',
                wordBreak: 'keep-all'
              }}
            >
              <span
                style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                }}
              >
                {currentSlide.title}
              </span>
            </h2>

            {/* 서브타이틀 (형광 옐로우 스티커) */}
            {currentSlide.subtitle && (
              <div style={{ marginBottom: '10px' }}>
                <span
                  style={{
                    background: '#fde047',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {currentSlide.subtitle}
                </span>
              </div>
            )}

            {/* 연예인/인플루언서 리액션 말풍선 카드 */}
            {currentSlide.type === 'celebrity' && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.96)',
                  color: '#0f172a',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginTop: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  border: '2px solid #fde047'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>⭐</span>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#b45309' }}>
                    {currentSlide.celebrityName || '성시경'}의 솔직 리액션
                  </span>
                  <span style={{ fontSize: '11px', color: '#0284c7' }}>✓</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                  “{currentSlide.quote || '이 집 국물은 진짜입니다. 꼭 드셔보세요!'}”
                </div>
                {currentSlide.body && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {currentSlide.body}
                  </div>
                )}
              </div>
            )}

            {/* 메뉴 가격 또는 파격 혜택 하이라이트 스티커 */}
            {currentSlide.type !== 'celebrity' && currentSlide.highlight && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.88)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #fde047',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  marginTop: '4px'
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#fde047' }}>
                  {currentSlide.highlight}
                </span>
                {currentSlide.body && (
                  <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>
                    {currentSlide.body}
                  </span>
                )}
              </div>
            )}

            {/* 일반 본문 설명 */}
            {currentSlide.type !== 'celebrity' && !currentSlide.highlight && currentSlide.body && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.75)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'inline-block',
                  color: '#ffffff',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  marginTop: '4px'
                }}
              >
                {currentSlide.body}
              </div>
            )}

            {/* 마지막 장 전용 강력한 CTA 액션 유도 스티커 */}
            {(currentSlide.type === 'cta' || activeIndex === slides.length - 1) && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
                  color: '#0f172a',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  border: '1.5px solid #ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🔖</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#000000' }}>게시물 저장하고 혜택 받기</div>
                    <div style={{ fontSize: '11px', color: '#713f12', fontWeight: 700 }}>저장한 화면을 사장님께 보여주세요!</div>
                  </div>
                </div>
                <span
                  style={{
                    background: '#000000',
                    color: '#fde047',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 900
                  }}
                >
                  저장 필수 ↗️
                </span>
              </div>
            )}
          </div>

          {/* 하단 스와이프 유도 알약 스티커 */}
          <div
            style={{
              alignSelf: 'center',
              background: activeIndex === slides.length - 1 ? '#fde047' : 'rgba(255, 255, 255, 0.95)',
              color: activeIndex === slides.length - 1 ? '#000000' : '#0f172a',
              padding: '5px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              zIndex: 2
            }}
          >
            {activeIndex === slides.length - 1
              ? `🎉 마지막 장입니다 · 매장에서 만나요! (${activeIndex + 1}/${slides.length})`
              : `👉 옆으로 넘겨서 계속 보기 (${activeIndex + 1}/${slides.length})`}
          </div>

          {/* 슬라이드 좌우 네비게이션 플로팅 화살표 버튼 */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 10px',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <button
              type="button"
              disabled={activeIndex === 0}
              aria-label="이전 슬라이드"
              onClick={e => {
                e.stopPropagation();
                const next = Math.max(0, activeIndex - 1);
                setActiveIndex(next);
                onSlideChange?.(next);
              }}
              style={{
                pointerEvents: 'auto',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: activeIndex === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.95)',
                border: '1.5px solid rgba(0,0,0,0.1)',
                color: activeIndex === 0 ? 'rgba(255,255,255,0.4)' : '#0f172a',
                fontWeight: 900,
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.1s'
              }}
            >
              ‹
            </button>
            <button
              type="button"
              disabled={activeIndex === slides.length - 1}
              aria-label="다음 슬라이드"
              onClick={e => {
                e.stopPropagation();
                const next = Math.min(slides.length - 1, activeIndex + 1);
                setActiveIndex(next);
                onSlideChange?.(next);
              }}
              style={{
                pointerEvents: 'auto',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: activeIndex === slides.length - 1 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.95)',
                border: '1.5px solid rgba(0,0,0,0.1)',
                color: activeIndex === slides.length - 1 ? 'rgba(255,255,255,0.4)' : '#0f172a',
                fontWeight: 900,
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeIndex === slides.length - 1 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.1s'
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* 3. 인스타그램 하단 피드 액션 바 & 캡션 */}
        <div style={{ padding: '12px 16px', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '14px', fontSize: '18px', cursor: 'pointer' }}>
              <span>❤️</span>
              <span>💬</span>
              <span>↗️</span>
            </div>

            {/* 도트 인디케이터 */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    onSlideChange?.(idx);
                  }}
                  style={{
                    width: idx === activeIndex ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    border: 'none',
                    background: idx === activeIndex ? '#0284c7' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0
                  }}
                />
              ))}
            </div>

            <div style={{ fontSize: '18px', cursor: 'pointer' }}>
              <span>🔖</span>
            </div>
          </div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            좋아요 <b>486개</b>
          </div>

          <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.45 }}>
            <b>{shopName || '월계밥상'}</b> {currentSlide.title} {currentSlide.subtitle || ''}
            <div style={{ color: '#0284c7', fontSize: '11px', marginTop: '4px' }}>
              #월계동맛집 #광운대맛집 #먹스타그램 #성시경먹방 #월계밥상
            </div>
          </div>
        </div>
      </div>

      {/* 4. 수정 서랍 (선택 시 열림) */}
      {editable && showEditDrawer && (
        <div
          style={{
            maxWidth: '460px',
            margin: '12px auto 0',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              ✏️ {activeIndex + 1}번 슬라이드 문구 수정
            </span>
            <button
              type="button"
              onClick={() => setShowEditDrawer(false)}
              style={{ background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', color: '#64748b' }}
            >
              닫기 ✕
            </button>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                제목
              </label>
              <input
                type="text"
                value={currentSlide.title || ''}
                onChange={e => updateCurrentSlide({ title: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                부제목 / 카피
              </label>
              <input
                type="text"
                value={currentSlide.subtitle || ''}
                onChange={e => updateCurrentSlide({ subtitle: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            {currentSlide.type === 'celebrity' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                  연예인 추천 문구
                </label>
                <input
                  type="text"
                  value={currentSlide.quote || ''}
                  onChange={e => updateCurrentSlide({ quote: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 캐러셀 현재 슬라이드용 웹 이미지 검색 모달 */}
      <ImageSearchModal
        isOpen={showImageSearch}
        onClose={() => setShowImageSearch(false)}
        shopName={shopName}
        initialQuery={currentSlide.imageQuery || `${shopName || '월계동'} ${currentSlide.title || ''}`}
        onSelect={(imgUrl) => {
          updateCurrentSlide({ image: imgUrl });
          setShowImageSearch(false);
        }}
      />
    </div>
  );
}



