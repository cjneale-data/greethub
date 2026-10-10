import React from 'react';
import { Logo } from './Logo.jsx';
import { Button } from './Button.jsx';
export function SiteNav({ links = ['Cards', 'Picture books', 'Occasions', 'Pricing'], onStart }) {
  return (
    <nav className="gh-nav">
      <a href="/" aria-label="GreetHub home" style={{ textDecoration: 'none' }}><Logo size={24} /></a>
      <div className="gh-nav__links">{links.map(l => <a key={l} href="#">{l}</a>)}</div>
      <div className="gh-nav__actions"><Button variant="ghost" size="sm" style={{ color: 'var(--gh-cocoa)' }}>Sign in</Button><Button size="sm" onClick={onStart}>Start a card</Button></div>
    </nav>
  );
}
/** Mobile bottom bar. Center slot is the Create action. Pass icon nodes per tab. */
export function TabBar({ tabs = [{ id: 'home', label: 'Home' }, { id: 'explore', label: 'Explore' }, { id: 'books', label: 'Books' }, { id: 'me', label: 'Me' }], active, onChange, onCreate }) {
  const item = t => (
    <button key={t.id} className="gh-tabbar__item" aria-current={active === t.id ? 'page' : undefined} onClick={() => onChange(t.id)}>
      {t.icon || <span style={{ width: 22, height: 22, borderRadius: 7, border: '2px solid currentColor', background: active === t.id ? 'currentColor' : 'none' }} />}{t.label}
    </button>
  );
  return <div className="gh-tabbar">{tabs.slice(0, 2).map(item)}<button className="gh-tabbar__create" aria-label="Create" onClick={onCreate}>+</button>{tabs.slice(2, 4).map(item)}</div>;
}
