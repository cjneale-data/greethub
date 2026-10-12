"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, ButtonLink, Logo, TabBar } from "@/components/brand";
import { Modal } from "./ui";
import { useSession } from "./client";

const LINKS = [
  { label: "Cards", href: "/browse?product=card", match: "/browse" },
  { label: "Picture books", href: "/browse?product=book", match: "/browse" },
  { label: "Pricing", href: "/pricing", match: "/pricing" },
  { label: "AI assistants", href: "/assistants", match: "/assistants" },
  { label: "FAQ", href: "/faq", match: "/faq" },
];

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.6L5.5 4H3" />
      <circle cx="10" cy="20.5" r="1" />
      <circle cx="17" cy="20.5" r="1" />
    </svg>
  );
}

export function ShopNav() {
  const s = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const name = s.firstName || s.email?.split("@")[0] || "";
  return (
    <header className="gs-nav">
      <nav className="gs-nav__in" aria-label="Main">
        <Link href="/" aria-label="GreetHub home" style={{ textDecoration: "none", flex: "none" }}>
          <Logo size={24} />
        </Link>
        <div className="gs-nav__links">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} aria-current={path === l.match ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="gs-nav__actions">
          <Link href="/cart" className="gs-nav__cart" aria-label={`Cart, ${s.cartCount} items`}>
            <CartIcon />
            {s.cartCount > 0 && <span className="gs-nav__count">{s.cartCount}</span>}
          </Link>
          {s.signedIn ? (
            <Link href="/account" className="gs-nav__me gs-nav__desktop-only">
              <Avatar name={name} size={32} index={0} />
              Your account
            </Link>
          ) : (
            <ButtonLink className="gs-nav__desktop-only" variant="ghost" size="sm" href="/login" style={{ color: "var(--gh-cocoa)" }}>
              Sign in
            </ButtonLink>
          )}
          <ButtonLink className="gs-nav__desktop-only" size="sm" href="/create/card">
            Start a card
          </ButtonLink>
          <button type="button" className="gh-btn gh-btn--ghost gh-btn--sm gs-nav__menu-btn" style={{ color: "var(--gh-cocoa)", minWidth: 44, minHeight: 44 }} aria-expanded={open} aria-controls="gs-drawer" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>
      {open && (
        <div className="gs-drawer" id="gs-drawer" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link href={s.signedIn ? "/account" : "/login"}>{s.signedIn ? "Your account" : "Sign in"}</Link>
        </div>
      )}
    </header>
  );
}

/** Mobile bottom bar: Home, Explore, Books, Me, with the raised Create button opening "What are we making?". */
export function MobileTabs() {
  const router = useRouter();
  const path = usePathname();
  const [sheet, setSheet] = useState(false);
  const active = path === "/" ? "home" : path.startsWith("/browse") ? "explore" : path.startsWith("/account") || path.startsWith("/orders") ? "me" : path.startsWith("/create/book") ? "books" : undefined;
  const go = (id: string) => router.push(id === "home" ? "/" : id === "explore" ? "/browse" : id === "books" ? "/browse?product=book" : "/account");
  return (
    <>
      <div className="gs-tabs-mobile">
        <TabBar active={active} onChange={go} onCreate={() => setSheet(true)} />
      </div>
      {sheet && (
        <Modal
          title="What are we making?"
          onClose={() => setSheet(false)}
          actions={
            <>
              <ButtonLink variant="dark" href="/create/card" onClick={() => setSheet(false)}>
                Card
              </ButtonLink>
              <ButtonLink variant="secondary" href="/create/book" onClick={() => setSheet(false)}>
                Picture book
              </ButtonLink>
            </>
          }
        >
          <p>A 5 by 7 card, or a hardcover story starring your people.</p>
        </Modal>
      )}
    </>
  );
}
