"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button } from "@/components/brand";
import { tierById, type TierId } from "@greethub/shared";
import { Plans } from "@/components/membership/Plans";
import { useMembership } from "@/components/membership/useMembership";
import "@/components/membership/membership.css";
import { ErrorBox, Modal, SkeletonList } from "./ui";
import { api, useToast } from "./client";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Account → Membership: current plan in plain words, what's used this month, compare and join, cancel in two clicks. */
export function MembershipPage() {
  const toast = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const { state, setView, reload } = useMembership();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const greeted = useRef(false);

  useEffect(() => {
    if (state.status === "guest") router.replace(`/login?next=${encodeURIComponent("/account/membership")}&reason=signin`);
  }, [state.status, router]);
  useEffect(() => {
    if (greeted.current || state.status !== "ready") return;
    if (sp.get("joined")) toast(`Welcome to ${tierById(state.view.tier).name}. Your perks are on.`);
    if (sp.get("cancelled")) toast("No change made. Nothing was charged.");
    greeted.current = true;
  }, [sp, state, toast]);

  const head = <h1 className="gs-h2" style={{ margin: 0 }}>Membership</h1>;
  if (state.status === "guest") return null;
  if (state.status === "error") return <div className="gs-stack gs-stack--lg">{head}<ErrorBox message="Something broke on our side. It's not you. Try again in a minute." onRetry={reload} /></div>;
  if (state.status === "loading") return <div className="gs-stack gs-stack--lg">{head}<SkeletonList rows={2} h={140} /></div>;
  const v = state.view;
  const sub = v.subscription;
  const tier = tierById(v.tier);

  async function choose(t: TierId, interval: "month" | "year") {
    setBusy(true);
    setErr("");
    const r = await api<{ url: string }>("/api/account/membership/checkout", { method: "POST", json: { tier: t, interval } });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error ?? "We couldn't open payment. Nothing was charged.");
    window.location.assign(r.data.url as string);
  }
  async function changeRenewal(cancel: boolean) {
    setBusy(true);
    setConfirmCancel(false);
    const r = await api("/api/account/membership/cancel", { method: "POST", json: { cancel } });
    setBusy(false);
    if (!r.ok) return toast(r.data.error ?? "That didn't work. Try again?");
    setView(r.data as never);
    toast(cancel ? "Done. Your perks stay on until the end of this period." : "Welcome back. Your membership will renew.");
  }
  async function billing() {
    setBusy(true);
    const r = await api<{ url: string }>("/api/account/membership/portal", { method: "POST" });
    setBusy(false);
    if (!r.ok) return toast(r.data.error ?? "Billing isn't available right now.");
    window.location.assign(r.data.url as string);
  }

  // Plain-words status line (CX: name, price, next charge date, what happens next).
  let status: React.ReactNode = <>You’re on <strong>Free</strong>. Join Plus to write cards in your own hand and keep your signature.</>;
  if (sub) {
    const name = tierById(sub.tier).name;
    if (sub.status === "trialing") status = <>Your <strong>{name}</strong> free trial ends on <strong>{fmtDate(sub.trialEnd ?? sub.currentPeriodEnd)}</strong>. {sub.cancelAtPeriodEnd ? "It won't continue after that." : "Add a card before then to keep your perks."}</>;
    else if (sub.status === "past_due") status = <>We couldn’t take your last <strong>{name}</strong> payment. Your perks stay on for a few days; update your card to keep them.</>;
    else if (v.tier === "free") status = <>Your <strong>{name}</strong> membership has ended. You’re on Free now, and everything you saved is still here.</>;
    else if (sub.cancelAtPeriodEnd) status = <>Your <strong>{name}</strong> membership ends on <strong>{fmtDate(sub.currentPeriodEnd)}</strong>. You keep your perks until then.</>;
    else status = <>You’re a <strong>{name}</strong> member, billed {sub.interval === "year" ? "yearly" : "monthly"}. Renews on <strong>{fmtDate(sub.currentPeriodEnd)}</strong>.</>;
  }

  const meters = [
    { key: "ai_message_writes_per_month", label: "\"Write it for me\" messages" },
  ] as const;

  return (
    <div className="gs-stack gs-stack--lg">
      {head}
      {!v.enabled && <div className="gs-panel" role="status"><p style={{ margin: 0 }}><strong>Memberships open soon.</strong> Everything you can do today stays free until then.</p></div>}

      <section className="gs-panel gm-status" aria-labelledby="mb-current">
        <div className="gs-row gs-row--between">
          <h2 id="mb-current" className="gs-h3" style={{ margin: 0 }}>Your plan</h2>
          <Badge tone={v.tier === "free" ? "draft" : "new"}>{tier.name}</Badge>
        </div>
        <p style={{ margin: 0 }}>{status}</p>
        {v.enabled && (
          <div className="gm-meters">
            {meters.map((m) => {
              const limit = Number(v.features[m.key]);
              const used = v.usage[m.key] ?? 0;
              if (limit === -1) return null;
              return (
                <div key={m.key} className="gm-meter">
                  <span>{m.label}: <strong>{Math.max(0, limit - used)} of {limit} left</strong> this month</span>
                  <div className="gm-meter__bar" role="img" aria-label={`${used} of ${limit} used`}><i style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
        {sub && v.tier !== "free" && (
          <div className="gs-row" style={{ flexWrap: "wrap" }}>
            {sub.cancelAtPeriodEnd ? (
              <Button disabled={busy} onClick={() => void changeRenewal(false)}>Turn renewal back on</Button>
            ) : (
              <Button variant="ghost" disabled={busy} onClick={() => setConfirmCancel(true)}>Cancel membership</Button>
            )}
            {sub.canManageBilling && <Button variant="secondary" disabled={busy} onClick={() => void billing()}>Card and receipts</Button>}
          </div>
        )}
      </section>

      {err && <ErrorBox message={err} />}

      <section className="gs-stack" aria-labelledby="mb-plans">
        <h2 id="mb-plans" className="gs-h3" style={{ margin: 0 }}>{v.tier === "free" ? "Choose a plan" : "Compare plans"}</h2>
        <Plans current={v.tier} onChoose={(t, i) => void choose(t, i)} busy={busy} enabled={v.enabled} trialUsed={v.history.some((h) => h.status === "trialing")} />
      </section>

      {confirmCancel && sub && (
        <Modal title="Cancel your membership?" onClose={() => setConfirmCancel(false)} actions={<><Button variant="ghost" onClick={() => setConfirmCancel(false)}>Keep it</Button><Button variant="dark" disabled={busy} onClick={() => void changeRenewal(true)}>Cancel membership</Button></>}>
          <p>You keep everything until {fmtDate(sub.currentPeriodEnd)}. After that you’re on Free: your handwriting styles and signatures stay saved, and you can turn renewal back on anytime before then.</p>
        </Modal>
      )}
    </div>
  );
}

/** Stand-in for Stripe Checkout in local mode. Never shown when real billing is configured. */
export function FakeMembershipCheckout() {
  const sp = useSearchParams();
  const tier = tierById(sp.get("tier") ?? "");
  const interval = sp.get("interval") === "year" ? "year" : "month";
  const trial = Number(sp.get("trial") ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go(outcome: "subscribe" | "decline") {
    setBusy(true);
    const r = await api<{ redirect: string }>("/api/account/membership/fake", { method: "POST", json: { tier: tier.id, interval, trial, outcome } });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error ?? "That didn't work.");
    window.location.assign(r.data.redirect as string);
  }
  const amount = interval === "year" ? tier.annualCents : tier.monthlyCents;
  return (
    <div className="gs-stack gs-stack--lg">
      <h1 className="gs-h2" style={{ margin: 0 }}>Test checkout</h1>
      <div className="gs-devnote">Local mode: this page stands in for Stripe. No real payment is taken.</div>
      <div className="gs-panel gs-stack">
        <p style={{ margin: 0 }}><strong>GreetHub {tier.name}</strong>, {interval === "year" ? "yearly" : "monthly"}: ${(amount / 100).toFixed(2)} {trial ? `after a ${trial}-day free trial` : "today"}.</p>
        {err && <ErrorBox message={err} />}
        <div className="gs-row">
          <Button disabled={busy} onClick={() => void go("subscribe")} data-testid="fake-subscribe">{trial ? "Start free trial" : "Pay and join"}</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void go("decline")}>Simulate a declined card</Button>
        </div>
      </div>
    </div>
  );
}
