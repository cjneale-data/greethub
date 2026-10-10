import { SiteNav, Badge, ButtonLink } from "@/components/brand";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="gh-hero">
          <div className="gh-hero__copy">
            <div className="gh-hero__badge">
              <Badge tone="promo">Mother’s Day ships free until May 4</Badge>
            </div>
            <h1 className="gh-hero__h1">
              Cards that sound like <em>you.</em>
            </h1>
            <p className="gh-hero__lede">
              Your photos, your words, your in-jokes — printed on thick matte paper and mailed for you. Or make it a whole picture book.
            </p>
            <div className="gh-hero__ctas">
              <ButtonLink size="lg" href="/create/card">
                Start a card
              </ButtonLink>
              <ButtonLink size="lg" variant="secondary" href="/create/book">
                Make a picture book
              </ButtonLink>
            </div>
          </div>
          <div className="gh-hero__pile" aria-hidden="true">
            <div className="gh-hero__card gh-hero__card--a">
              <div className="gh-placeholder" style={{ "--a": "#F5B83D", "--b": "#F8C964" } as React.CSSProperties}>
                family photo card
              </div>
            </div>
            <div className="gh-hero__card gh-hero__card--b">
              <div className="gh-placeholder" style={{ "--a": "#F6C9C0", "--b": "#F9D7D0", color: "#5B2A4B" } as React.CSSProperties}>
                birthday card cover
              </div>
            </div>
            <span className="gh-hero__sticker">Love, Maya</span>
          </div>
        </section>
      </main>
    </>
  );
}
