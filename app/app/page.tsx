import Link from "next/link";
import { Suspense } from "react";
import { Badge, ButtonLink } from "@/components/brand";
import { HeroShowcase } from "@/components/shop/HeroShowcase";
import { HomeGallery } from "@/components/shop/HomeGallery";
import { HomeToast } from "@/components/shop/HomeToast";
import { ShopShell } from "@/components/shop/ShopShell";
import { priceTokens } from "@greethub/shared";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "GreetHub — cards and picture books that sound like you",
  description: "Custom illustrated greeting cards and picture books, drawn from your story, printed and mailed for you.",
  path: "/",
});

export default function Home() {
  const p = priceTokens();
  return (
    <ShopShell>
      <Suspense>
        <HomeToast />
      </Suspense>
      <section className="gh-hero">
        <div className="gh-hero__copy">
          {/* The out-of-date "Mother's Day ships free until May 4" promo was removed (CX-03). Bring promos back only from a dated config. */}
          <h1 className="gh-hero__h1">
            Cards that sound like <em>you.</em>
          </h1>
          <p className="gh-hero__lede">Tell us who it’s for and what you’d say. We draw it, write it with you, print it and mail it.</p>
          <div className="gh-hero__ctas">
            <ButtonLink size="lg" variant="dark" href="/create/card">
              Start a card
            </ButtonLink>
            <ButtonLink size="lg" variant="secondary" href="/create/book">
              Make a picture book
            </ButtonLink>
          </div>
          <p className="gs-muted gs-small" style={{ margin: 0 }}>Try one card free. No account needed.</p>
        </div>
        <HeroShowcase />
      </section>

      <HomeGallery />

      <section className="gs-section">
        <h2 className="gs-h2">Three steps. A card takes about ten minutes.</h2>
        <div className="gs-steps">
          <div className="gs-step"><h3 className="gs-h3">Tell us.</h3><p>Chat with the Greet Guide or fill a short form. Who it’s for, what to say, how it should feel.</p></div>
          <div className="gs-step"><h3 className="gs-h3">Check the look.</h3><p>See your card or your characters before anything is final. Change what’s off.</p></div>
          <div className="gs-step"><h3 className="gs-h3">We print and mail.</h3><p>Real paper, real postage. To you, or straight to them.</p></div>
        </div>
      </section>

      <section className="gs-section" id="books">
        <div className="gs-band">
          <h2 className="gs-h2">Make the book your family keeps.</h2>
          <p>Tell us the memory and add a few photos. We write the story with you, draw everyone once for you to approve, then draw every page from that approved sheet. Hardcover, 8.5 by 8.5 inches, printed to order.</p>
          <div><ButtonLink variant="sunny" href="/create/book">Start a picture book</ButtonLink></div>
        </div>
      </section>

      <section className="gs-section">
        <div className="gs-panel gs-panel--cream gs-stack gs-stack--sm">
          <div><Badge tone="new">Coming soon</Badge></div>
          <h2 className="gs-h2">Ask your AI assistant to start a card.</h2>
          <p className="gs-muted" style={{ margin: 0, maxWidth: 560 }}>Soon you can draft a GreetHub card from the assistant you already use. You approve the card and pay on greethub.com, and you set the limits.</p>
          <div><Link className="gs-link" href="/assistants">How it will work</Link></div>
        </div>
      </section>

      <section className="gs-section" id="pricing">
        <h2 className="gs-h2">Simple prices.</h2>
        <p className="gs-lede" style={{ marginBottom: 12 }}>
          Card {p.card_digital} digital, {p.card_mailed} mailed. Picture book from {p.book_24}. Tax is worked out at checkout.
        </p>
        <Link className="gs-link" href="/pricing">See pricing</Link>
      </section>
    </ShopShell>
  );
}
