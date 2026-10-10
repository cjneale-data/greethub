import React from 'react';
const TILTS = [-2, 2, -1.5, 3, -3, 1];
/** Card/book tile. Pass image src, or tone ('blush'|'marigold'|'cream') for a placeholder. tilt: index or degrees */
export function TemplateCard({ title, aside, image, tone = 'blush', tilt = 0, onClick }) {
  const deg = Number.isInteger(tilt) && Math.abs(tilt) < 10 && tilt >= 0 ? TILTS[tilt % TILTS.length] : tilt;
  const tones = { blush: ['#F6C9C0', '#F9D7D0', '#5B2A4B'], marigold: ['#F5B83D', '#F8C964', '#2B1E18'], cream: ['#F3EADB', '#F8F1E6', '#6B5A50'] }[tone];
  return (
    <button className="gh-card" style={{ transform: `rotate(${deg}deg)` }} onClick={onClick}>
      <div className="gh-card__media">
        {image ? <img src={image} alt="" /> : <div className="gh-placeholder" style={{ '--a': tones[0], '--b': tones[1], color: tones[2] }}>cover image</div>}
      </div>
      <div className="gh-card__meta"><span className="gh-card__title">{title}</span>{aside && <span className="gh-card__aside">{aside}</span>}</div>
    </button>
  );
}
