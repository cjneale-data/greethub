import React from 'react';
const FILLS = [['#F6C9C0', '#5B2A4B'], ['#F5B83D', '#2B1E18'], ['#5B2A4B', '#FBF6EE'], ['#F3EADB', '#2B1E18']];
export function Avatar({ name = '', src, size = 40, index = 0 }) {
  const [bg, fg] = FILLS[index % FILLS.length];
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return <span className="gh-avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.35 }}>{src ? <img src={src} alt={name} /> : initials}</span>;
}
export function AvatarStack({ people, max = 3, size = 40 }) {
  const extra = people.length - max;
  return (
    <span className="gh-avatars">
      {people.slice(0, max).map((p, i) => <Avatar key={i} index={i} size={size} {...p} />)}
      {extra > 0 && <span className="gh-avatar" style={{ width: size, height: size, background: '#F3EADB', color: '#2B1E18', fontSize: size * 0.33 }}>+{extra}</span>}
    </span>
  );
}
export function Toast({ children, action, onAction }) {
  return <div className="gh-toast" role="status"><span className="gh-toast__dot" />{children}{action && <button className="gh-btn" onClick={onAction}>{action}</button>}</div>;
}
