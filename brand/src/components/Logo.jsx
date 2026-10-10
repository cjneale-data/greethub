import React from 'react';
/** Folded-card mark. variant: 'brand' (persimmon card) | 'reverse' (paper card, for persimmon backgrounds) */
export function LogoMark({ size = 40, variant = 'brand', title = 'GreetHub' }) {
  const card = variant === 'reverse' ? '#FBF6EE' : '#EE5A36';
  const glyph = variant === 'reverse' ? '#EE5A36' : '#FBF6EE';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={title}>
      <path d="M16 0H42L64 22V48A16 16 0 0 1 48 64H16A16 16 0 0 1 0 48V16A16 16 0 0 1 16 0Z" fill={card} />
      <path d="M42 0V14A8 8 0 0 0 50 22H64Z" fill="#F5B83D" />
      <text x="30" y="47" textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="800" fontSize="42" fill={glyph}>g</text>
    </svg>
  );
}
/** Lockup. theme: 'light' | 'plum' | 'persimmon' */
export function Logo({ size = 24, theme = 'light', mark = true }) {
  const ink = theme === 'plum' ? '#FBF6EE' : '#2B1E18';
  const hub = theme === 'plum' ? '#F5B83D' : theme === 'persimmon' ? '#2B1E18' : '#EE5A36';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.3 }}>
      {mark && <LogoMark size={size * 1.25} variant={theme === 'persimmon' ? 'reverse' : 'brand'} />}
      <span style={{ fontFamily: 'var(--gh-font-display)', fontWeight: 800, fontSize: size, letterSpacing: '-0.045em', lineHeight: 1, color: ink }}>
        greet<span style={{ color: hub }}>hub</span>
      </span>
    </span>
  );
}
