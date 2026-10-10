import React from 'react';
export function Chip({ selected, ...rest }) { return <button type="button" className="gh-chip" aria-pressed={!!selected} {...rest} />; }
export function ChipGroup({ options, value, onChange }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{options.map(o => <Chip key={o} selected={o === value} onClick={() => onChange(o)}>{o}</Chip>)}</div>;
}
export function Toggle({ checked, onChange, children }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} className="gh-toggle" onClick={() => onChange(!checked)}>
      <span className="gh-toggle__track"><span className="gh-toggle__thumb" /></span>{children}
    </button>
  );
}
export function Segmented({ options, value, onChange }) {
  return <div className="gh-seg" role="tablist">{options.map(o => <button key={o} role="tab" aria-selected={o === value} className="gh-seg__item" onClick={() => onChange(o)}>{o}</button>)}</div>;
}
/** tone: new | draft | sent | promo */
export function Badge({ tone = 'new', children }) { return <span className={`gh-badge gh-badge--${tone}`}>{children}</span>; }
export function Progress({ value, label }) {
  return (
    <div className="gh-progress">
      <div className="gh-progress__row"><span style={{ fontWeight: 600 }}>{label}</span><span style={{ color: 'var(--gh-cocoa-70)' }}>{Math.round(value)}%</span></div>
      <div className="gh-progress__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className="gh-progress__bar" style={{ width: value + '%' }} /></div>
    </div>
  );
}
