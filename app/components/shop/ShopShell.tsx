import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand";
import { MobileTabs, ShopNav } from "./ShopNav";
import { ToastProvider } from "./client";
import { CookieNotice } from "./CookieNotice";
import "./shop.css";

export function Footer() {
  return (
    <footer className="gs-footer">
      <div className="gs-footer__in">
        <div>
          <Logo size={22} />
          <p className="gs-footer__line">Made for the people who matter.</p>
        </div>
        <div>
          <h4>Make</h4>
          <Link href="/create/card">Start a card</Link>
          <Link href="/create/book">Make a picture book</Link>
          <Link href="/browse">Browse templates</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/orders">Track an order</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/acceptable-use">Acceptable use</Link>
          <Link href="/refunds">Refund &amp; reprint</Link>
          <Link href="/report">Report content / DMCA</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/privacy#choices">Your privacy choices</Link>
          <a href="mailto:hello@greethub.example">Contact</a>
        </div>
      </div>
      <p className="gs-footer__legal">
        {/* TODO(owner): company legal name and postal address (docs/legal 06, req. 50). */}
        GreetHub, [company legal name], [postal address]. Art is AI-illustrated. For adults 18 and over.
      </p>
    </footer>
  );
}

/** Nav, footer, mobile tab bar and toast host shared by every shop page. */
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="gs-nav" style={{ minHeight: 65 }} />}>
        <ShopNav />
      </Suspense>
      <main className="gs-main">{children}</main>
      <Footer />
      <Suspense>
        <MobileTabs />
      </Suspense>
      <CookieNotice />
    </ToastProvider>
  );
}
