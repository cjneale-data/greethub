import Link from "next/link";
import { ButtonLink } from "@/components/brand";
import { LandingPlans } from "@/components/membership/LandingPlans";
import "@/components/membership/membership.css";
import { HANDWRITING_PRESETS, formatMoney, formatMoneyShort, tierById } from "@greethub/shared";
import { membershipEnabled } from "@/lib/membership/service";
import { pageMetadata } from "@/lib/seo";
import { templateImage } from "@/lib/shop/templates";

/* Copy and rationale: docs/cmo/membership-landing.md. Every number below comes from MEMBERSHIP_SPEC, never typed in. */

export const metadata = pageMetadata({
  title: "GreetHub Plus: cards in your own handwriting",
  description: "Print every card in your own handwriting and sign it with your saved signature. Try GreetHub Plus free for 14 days, no card needed. Cancel anytime.",
  path: "/membership",
});

const free = tierById("free").features;
const plus = tierById("plus");
const pf = plus.features;
const JOIN_HREF = "/account/membership";

export default function MembershipLandingPage() {
  const enabled = membershipEnabled();
  const trialCta = `Start ${plus.trialDays}-day free trial`;

  return (
    <div className="gm-land">
      <section className="gh-hero gm-land__hero" aria-labelledby="gm-land-title">
        <div className="gh-hero__copy">
          <h1 id="gm-land-title" className="gh-hero__h1">
            Your cards, in your own <em>handwriting.</em>
          </h1>
          <p className="gh-hero__lede">
            Fill in one sheet with a pen. From then on, every card you make can carry your handwriting and your signature, so it reads like you sat down and wrote it.
          </p>
          {enabled ? (
            <>
              <div className="gh-hero__ctas">
                <ButtonLink size="lg" variant="dark" href={JOIN_HREF}>{trialCta}</ButtonLink>
                <ButtonLink size="lg" variant="secondary" href="#plans">See the plans</ButtonLink>
              </div>
              <p className="gs-muted gs-small" style={{ margin: 0 }}>
                GreetHub Plus. {plus.trialDays} days free, no card needed. Then {formatMoney(plus.monthlyCents)} a month or {formatMoneyShort(plus.annualCents)} a year. Cancel anytime.
              </p>
            </>
          ) : (
            <>
              <div className="gs-panel gm-land__soon" role="status">
                <p style={{ margin: 0 }}><strong>Memberships open soon.</strong> Everything you can do today stays free until then.</p>
              </div>
              <div className="gh-hero__ctas">
                <ButtonLink size="lg" variant="dark" href="/create/card">Start a card</ButtonLink>
                <ButtonLink size="lg" variant="secondary" href="#plans">See the plans</ButtonLink>
              </div>
            </>
          )}
        </div>

        <figure className="gm-land__figure">
          <div className="gm-land__sample" role="img" aria-label="A sample card. Inside, a handwritten note reads: Nonna, thank you for every Sunday. I still can't make the sauce like you do. Love you always. It is signed Maya.">
            <div className="gm-land__cover" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={templateImage("for-nonna", 800)} alt="" />
            </div>
            <div className="gm-land__inside" aria-hidden="true">
              <p className="gm-land__note" style={{ fontFamily: "gh-hw-cedarville_cursive, cursive" }}>
                Nonna,<br />thank you for every Sunday. I still can&rsquo;t make the sauce like you do.<br />Love you always,
              </p>
              <p className="gm-land__sig" style={{ fontFamily: "gh-hw-mr_dafoe, cursive" }}>Maya</p>
            </div>
            <span className="gm-land__tag" aria-hidden="true">Her hand. Her name.</span>
          </div>
          <figcaption className="gs-small gs-muted">Sample shown in two of our built-in styles. With Plus, it&rsquo;s your own.</figcaption>
        </figure>
      </section>

      <section className="gs-section" aria-labelledby="gm-land-get">
        <h2 id="gm-land-get" className="gs-h2">What Plus gives you</h2>
        <div className="gm-land__benefits">
          <div className="gs-panel gm-land__benefit">
            <h3 className="gs-h3">It looks like you wrote it.</h3>
            <p>Your own handwriting, printed on real cards. Keep up to {pf.own_handwriting_styles} styles, say your everyday hand and your best one.</p>
          </div>
          <div className="gs-panel gm-land__benefit">
            <h3 className="gs-h3">Sign once.</h3>
            <p>Save up to {pf.saved_signatures} signatures. Draw one with your finger, upload a photo of one on paper, or pick a style for your name.</p>
          </div>
          <div className="gs-panel gm-land__benefit">
            <h3 className="gs-h3">Set it and forget it.</h3>
            <p>Turn on &ldquo;Use on every new card&rdquo; and each new card starts in your hand, already signed. You can still change any card.</p>
          </div>
          <div className="gs-panel gm-land__benefit">
            <h3 className="gs-h3">Help when the words won&rsquo;t come.</h3>
            <p>{pf.ai_message_writes_per_month} &ldquo;Write it for me&rdquo; messages a month (Free has {free.ai_message_writes_per_month}), more redraws, drafts kept for a year, and {pf.digital_card_credits_per_month} free e-card every month.</p>
          </div>
        </div>
        <p className="gs-muted" style={{ margin: "20px 0 0", maxWidth: 680 }}>
          <strong>Free stays free.</strong> Anyone can use our {HANDWRITING_PRESETS.length} handwriting styles and type their name as a signature on any card. You never need Plus to make a card or a picture book.
        </p>
      </section>

      <section className="gs-section" id="plans" aria-labelledby="gm-land-plans">
        <h2 id="gm-land-plans" className="gs-h2">Pick a plan</h2>
        <p className="gs-lede">Start free. Add Plus when you want your own hand on the card.</p>
        <LandingPlans enabled={enabled} />
      </section>

      <section className="gs-section" aria-labelledby="gm-land-how">
        <h2 id="gm-land-how" className="gs-h2">How your handwriting gets on the card</h2>
        <div className="gs-steps">
          <div className="gs-step"><h3 className="gs-h3">Print the sheet.</h3><p>One page with a box for every letter, number and mark. Print it at actual size.</p></div>
          <div className="gs-step"><h3 className="gs-h3">Fill it in.</h3><p>Write one character in each box with a dark pen, the way you normally write.</p></div>
          <div className="gs-step"><h3 className="gs-h3">Snap a photo.</h3><p>Upload it in your account. We check every letter is there, then your cards can use your hand.</p></div>
        </div>
        <p className="gs-muted gs-small" style={{ margin: "16px 0 0", maxWidth: 680 }}>
          You can try one sheet on a free account and see it in your card preview. Printing it on a card needs Plus.
        </p>
      </section>

      <section className="gs-section" aria-labelledby="gm-land-faq">
        <h2 id="gm-land-faq" className="gs-h2">Questions</h2>
        <div className="gs-faq gs-stack gs-stack--sm" style={{ maxWidth: 760 }}>
          <details>
            <summary>How does the free trial work?</summary>
            <p>You get {plus.trialDays} days of Plus without giving us card details. When the trial ends you go back to Free, unless you choose to join. One trial per account. The monthly free e-card starts once you join.</p>
          </details>
          <details>
            <summary>Can I cancel anytime?</summary>
            <p>Yes. Go to Account, then Membership, and cancel in two clicks. No call, no chat. You keep Plus until the end of the time you&rsquo;ve paid for, and you can turn it back on before then.</p>
          </details>
          <details>
            <summary>What happens to my handwriting if I cancel?</summary>
            <p>It stays saved in your account, and so do your signatures. Printing them on new cards needs Plus, so they&rsquo;re paused until you rejoin. Cards you&rsquo;ve already paid for print as you approved them. You can delete your handwriting or signatures any time.</p>
          </details>
          <details>
            <summary>Is my signature safe?</summary>
            <p>Your handwriting sheet and signatures are private to your account. We use them only to print your own cards: never to sign anything else, never shared, and never used to train AI. They&rsquo;re deleted when you delete your account.</p>
          </details>
          <details>
            <summary>Do I need Plus to make a card?</summary>
            <p>No. Cards and picture books are for everyone. Plus adds your own handwriting, saved signatures and higher limits.</p>
          </details>
          <details>
            <summary>What is Card Club?</summary>
            <p>A plan we&rsquo;re still getting ready: everything in Plus, plus one mailed card a month with postage included and money off extra mailed cards. You can&rsquo;t join it yet.</p>
          </details>
        </div>
      </section>

      <section className="gs-section">
        <div className="gs-band">
          <h2 className="gs-h2">Next card, in your own hand.</h2>
          {enabled ? (
            <>
              <p>{plus.trialDays} days of Plus, free. No card details. Cancel anytime.</p>
              <div><ButtonLink variant="sunny" href={JOIN_HREF}>{trialCta}</ButtonLink></div>
            </>
          ) : (
            <>
              <p>Memberships open soon. Until then, start a card with one of our handwriting styles.</p>
              <div><ButtonLink variant="sunny" href="/create/card">Start a card</ButtonLink></div>
            </>
          )}
        </div>
        <p className="gs-small gs-muted" style={{ margin: "16px 0 0" }}>
          See all <Link className="gs-link" href="/pricing">card and book prices</Link>.
        </p>
      </section>
    </div>
  );
}
