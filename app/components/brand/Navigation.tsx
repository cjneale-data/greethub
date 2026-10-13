import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { ButtonLink } from "./Button";

export type NavLink = { label: string; href: string };
const DEFAULT_LINKS: NavLink[] = [
  { label: "Cards", href: "/#cards" },
  { label: "Picture books", href: "/#books" },
  { label: "Occasions", href: "/#occasions" },
  { label: "Pricing", href: "/#pricing" },
];

export function SiteNav({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  return (
    <nav className="gh-nav" aria-label="Main">
      <Link href="/" title="GreetHub home" style={{ textDecoration: "none" }}>
        <Logo size={24} />
      </Link>
      <div className="gh-nav__links">
        {links.map((l) => (
          <Link key={l.label} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="gh-nav__actions">
        <ButtonLink variant="ghost" size="sm" href="/login" style={{ color: "var(--gh-cocoa)" }}>
          Sign in
        </ButtonLink>
        <ButtonLink size="sm" href="/create/card">
          Start a card
        </ButtonLink>
      </div>
    </nav>
  );
}

export type Tab = { id: string; label: string; icon?: ReactNode };
const DEFAULT_TABS: Tab[] = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Explore" },
  { id: "books", label: "Books" },
  { id: "me", label: "Me" },
];

/** Mobile bottom bar (PWA now, Expo later). Center slot is the Create action. */
export function TabBar({
  tabs = DEFAULT_TABS,
  active,
  onChange,
  onCreate,
}: {
  tabs?: Tab[];
  active?: string;
  onChange: (id: string) => void;
  onCreate: () => void;
}) {
  const item = (t: Tab) => (
    <button key={t.id} className="gh-tabbar__item" aria-current={active === t.id ? "page" : undefined} onClick={() => onChange(t.id)}>
      {t.icon || (
        <span style={{ width: 22, height: 22, borderRadius: 7, border: "2px solid currentColor", background: active === t.id ? "currentColor" : "none" }} />
      )}
      {t.label}
    </button>
  );
  return (
    <div className="gh-tabbar">
      {tabs.slice(0, 2).map(item)}
      <button className="gh-tabbar__create" aria-label="Create" onClick={onCreate}>
        +
      </button>
      {tabs.slice(2, 4).map(item)}
    </div>
  );
}
