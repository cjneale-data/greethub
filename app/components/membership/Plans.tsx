"use client";
import { useState } from "react";
import { Badge, Button, ButtonLink, Segmented } from "@/components/brand";
import { MEMBERSHIP_SPEC, PURCHASABLE_TIERS, annualSavingsPct, formatMoney, formatMoneyShort, perMonthCents, type Features, type MembershipTier, type TierId } from "@greethub/shared";
import "./membership.css";

type Row = { label: string; value: (f: Features) => string | boolean };

/** What each plan includes, in members' words. Order = what people care about most. Values come from the CFO spec. */
export const PLAN_ROWS: Row[] = [
  { label: "8 handwriting styles on any card", value: (f) => f.preset_handwriting },
  { label: "Your own handwriting", value: (f) => (f.own_handwriting_print ? `Up to ${f.own_handwriting_styles} styles, on printed cards` : f.own_handwriting_styles > 0 ? "Try 1 style (preview only)" : false) },
  { label: "Saved signatures (draw, upload or pick a style)", value: (f) => (f.saved_signatures > 0 ? `Up to ${f.saved_signatures}` : false) },
  { label: "Your handwriting and signature on every new card", value: (f) => f.apply_to_new_cards },
  { label: "\"Write it for me\" messages", value: (f) => `${f.ai_message_writes_per_month === -1 ? "Unlimited" : f.ai_message_writes_per_month} a month` },
  { label: "Card redraws", value: (f) => `${f.card_redraws_per_month} a month` },
  { label: "Picture book page redraws", value: (f) => `${f.book_page_redraws_per_book} per book` },
  { label: "Drafts kept", value: (f) => (f.drafts_retention_days >= 365 ? "1 year" : `${f.drafts_retention_days} days`) },
  { label: "Free e-card", value: (f) => (f.digital_card_credits_per_month ? `${f.digital_card_credits_per_month} a month` : false) },
  { label: "Mailed card, postage included", value: (f) => (f.mailed_card_credits_per_month ? `${f.mailed_card_credits_per_month} a month (save up to ${f.mailed_card_credit_bank_max})` : false) },
  { label: "Off extra mailed cards", value: (f) => (f.printed_card_discount_pct ? `${f.printed_card_discount_pct}%` : false) },
];

const TAGLINE: Record<TierId, string> = {
  free: "Everything you need to make one great card.",
  plus: "Cards that look like you wrote them yourself.",
  card_club: "For people who never miss a birthday.",
};

export function priceLabel(t: MembershipTier, interval: "month" | "year") {
  if (!t.monthlyCents) return { main: "$0", sub: "Free forever" };
  return interval === "year"
    ? { main: `${formatMoneyShort(t.annualCents)}/year`, sub: `${formatMoney(perMonthCents(t, "year"))} a month, billed yearly` }
    : { main: `${formatMoney(t.monthlyCents)}/month`, sub: "Billed monthly. Cancel anytime." };
}

/**
 * Plan cards with a monthly/yearly switch. `current` marks the member's plan; `onChoose` runs for buyable paid plans
 * (the account page starts checkout; the landing page links to the account page instead via `chooseHref`).
 */
export function Plans({ current, onChoose, chooseHref, busy, enabled = true, trialUsed }: {
  current?: TierId;
  onChoose?: (tier: TierId, interval: "month" | "year") => void;
  chooseHref?: (tier: TierId, interval: "month" | "year") => string;
  busy?: boolean;
  enabled?: boolean;
  trialUsed?: boolean;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const save = Math.max(...MEMBERSHIP_SPEC.tiers.map(annualSavingsPct));
  return (
    <div className="gm-plans">
      <div className="gm-plans__switch">
        <Segmented options={["Monthly", `Yearly (save up to ${save}%)`]} value={interval === "month" ? "Monthly" : `Yearly (save up to ${save}%)`} onChange={(v) => setInterval(v === "Monthly" ? "month" : "year")} />
      </div>
      <div className="gm-plans__grid">
        {MEMBERSHIP_SPEC.tiers.map((t) => {
          const f = t.features as Features;
          const price = priceLabel(t, interval);
          const buyable = PURCHASABLE_TIERS.includes(t.id);
          const isCurrent = current === t.id;
          const trial = t.trialDays && !trialUsed ? `Start ${t.trialDays}-day free trial` : `Join ${t.name}`;
          return (
            <section key={t.id} className={`gm-plan ${t.id === "plus" ? "gm-plan--featured" : ""}`} aria-labelledby={`plan-${t.id}`}>
              <div className="gm-plan__head">
                <h3 id={`plan-${t.id}`} className="gm-plan__name">{t.name}</h3>
                {isCurrent ? <Badge tone="new">Your plan</Badge> : t.id === "plus" ? <Badge tone="new">Most popular</Badge> : !buyable && t.id !== "free" ? <Badge tone="draft">Coming soon</Badge> : null}
              </div>
              <p className="gm-plan__tag">{TAGLINE[t.id]}</p>
              <p className="gm-plan__price">{price.main}</p>
              <p className="gm-plan__sub">{price.sub}</p>
              <ul className="gm-plan__list">
                {PLAN_ROWS.map((r) => {
                  const v = r.value(f);
                  if (v === false) return null;
                  return <li key={r.label}><span aria-hidden="true">✓</span> {v === true ? r.label : <><strong>{v}</strong> · {r.label}</>}</li>;
                })}
              </ul>
              <div className="gm-plan__cta">
                {t.id === "free" ? (
                  isCurrent ? <span className="gs-small gs-muted">You’re on Free.</span> : chooseHref ? <ButtonLink variant="secondary" href={chooseHref("free", interval)}>Make a free account</ButtonLink> : null
                ) : isCurrent ? (
                  <span className="gs-small gs-muted">You’re a {t.name} member.</span>
                ) : !buyable ? (
                  <Button variant="secondary" disabled>Coming soon</Button>
                ) : !enabled ? (
                  <Button variant="secondary" disabled>Opens soon</Button>
                ) : chooseHref ? (
                  <ButtonLink variant={t.id === "plus" ? "primary" : "dark"} href={chooseHref(t.id, interval)}>{trial}</ButtonLink>
                ) : (
                  <Button variant={t.id === "plus" ? "primary" : "dark"} disabled={busy} onClick={() => onChoose?.(t.id, interval)}>{trial}</Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="gs-small gs-muted gm-plans__fine">
        Paid plans renew automatically at the price shown until you cancel. Cancel anytime in your account; you keep your perks until the end of the period you paid for. Free trials need no card details from you here and end on their own unless you choose to join. Prices in US dollars; tax may apply.
      </p>
    </div>
  );
}
