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

          {/* 3. 스탬프 도장 및 뷰 모드 */}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
