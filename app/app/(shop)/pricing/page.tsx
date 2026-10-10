import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/brand";
import { PRICING, formatMoney, formatMoneyShort } from "@greethub/shared";
import { PageTitle } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Pricing | GreetHub" };

const s = PRICING.skus;
const ship = (c: number) => (c ? `${formatMoneyShort(c)} postage` : "No shipping");

const PLANS = [
  { name: "Digital card", price: s.card_digital.cents, ship: ship(0), points: ["Full-size card file", "Send it by text or email", "Print it at home"] },
  { name: "Mailed card", price: s.card_mailed.cents, ship: ship(s.card_mailed.postageCents), points: ["Printed 5 by 7 card and envelope", "Mailed to you or straight to them", "Heavy card stock"] },
  { name: "Picture book, 24 pages", price: s.book_24.cents, ship: ship(s.book_24.postageCents), points: ["Hardcover, 8.5 by 8.5 inches", "Your people, drawn once", "Printed to order"] },
  { name: "Picture book, 32 pages", price: s.book_32.cents, ship: ship(s.book_32.postageCents), points: ["Hardcover, 8.5 by 8.5 inches", "Eight more pages of story", "Printed to order"] },
];

export default function PricingPage() {
  return (
    <div className="gs-page">
      <PageTitle title="Simple prices." lede="Pay when you're happy with the proof. Not before." />
      <div className="gs-pricing">
        {PLANS.map((p) => (
          <section key={p.name} className="gs-panel gs-price" aria-label={p.name}>
            <h2 className="gs-h3">{p.name}</h2>
            <div className="gs-price__amt">{formatMoneyShort(p.price)}</div>
            <div className="gs-price__ship">{p.ship}</div>
            <ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        ))}
      </div>
      <div className="gs-stack" style={{ marginTop: 32, maxWidth: 720 }}>
        <p className="gs-muted" style={{ margin: 0 }}>
          <strong>Free:</strong> one watermarked card preview, no account. <strong>With a free account:</strong> saved drafts, saved people, monthly re-rolls, full-size proofs, order tracking.
        </p>
        <p className="gs-muted gs-small" style={{ margin: 0 }}>
          Prices don&apos;t include tax. Tax is worked out at checkout. Faster shipping is {formatMoney(PRICING.shippingMethods.express.extraCents)} more per order. We ship to the US to start. The art is drawn by AI and you always see it before it prints.
        </p>
        <div>
          <h2 className="gs-h3">If it&apos;s not right</h2>
          <p className="gs-muted" style={{ margin: 0 }}>
            If something arrives damaged or printed wrong, tell us within 30 days and we&apos;ll reprint it or refund it. If it&apos;s just not to your taste, we&apos;ll help you fix it before it prints. See the <Link className="gs-link" href="/refunds">Refund &amp; Reprint Policy</Link>.
          </p>
        </div>
        <div className="gs-row">
          <ButtonLink variant="dark" href="/create/card">Start a card</ButtonLink>
          <ButtonLink variant="secondary" href="/create/book">Make a picture book</ButtonLink>
        </div>
      </div>
    </div>
  );
}
