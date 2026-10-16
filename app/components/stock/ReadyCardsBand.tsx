import { ButtonLink } from "@/components/brand";
import "./stock.css";

/** Home band, below the gallery (docs/cmo/stock-cards-positioning.md section 5). No prices. */
export function ReadyCardsBand() {
  return (
    <section className="gs-section" id="ready-cards" aria-labelledby="rc-band-title">
      <div className="rc-band">
        <h2 className="gs-h2" id="rc-band-title">Need one <em>today?</em></h2>
        <p>Pick a card that&apos;s already drawn. Change the words so they sound like you, and we&apos;ll print and mail it. Two minutes, not twenty.</p>
        <div className="rc-band__ctas">
          <ButtonLink variant="dark" href="/ready-cards">Browse Ready Cards</ButtonLink>
          <ButtonLink variant="secondary" href="/create/card">Or make one from scratch</ButtonLink>
        </div>
        <p className="gs-small gs-muted" style={{ margin: 0 }}>Same paper and printing as our custom cards.</p>
      </div>
    </section>
  );
}
