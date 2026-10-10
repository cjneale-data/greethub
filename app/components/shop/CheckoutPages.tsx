"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink, Progress } from "@/components/brand";
import { formatMoney } from "@greethub/shared";
import { ErrorBox, SkeletonList } from "./ui";
import { api, refreshSession, useSession } from "./client";

/** Stand-in for the Stripe-hosted page. Only reachable while the fake payments adapter is active. */
export function FakePayment() {
  const sp = useSearchParams();
  const router = useRouter();
  const session = sp.get("session") ?? "";
  const [info, setInfo] = useState<{ totalCents: number; items: { title: string; quantity: number }[] } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<{ totalCents: number; items: { title: string; quantity: number }[] }>(`/api/checkout/fake?session=${encodeURIComponent(session)}`).then((r) => {
      if (r.ok) setInfo(r.data);
      else setError(r.data.error ?? "We couldn't open payment. Nothing was charged.");
    });
  }, [session]);

  async function act(outcome: "pay" | "decline" | "cancel") {
    setBusy(true);
    setError("");
    const r = await api<{ redirect?: string }>("/api/checkout/fake", { method: "POST", json: { session, outcome } });
    if (r.ok && r.data.redirect) return router.push(r.data.redirect);
    setBusy(false);
    setError(r.data.error ?? "We couldn't open payment. Nothing was charged.");
  }

  return (
    <div className="gs-page gs-page--form">
      <div className="gs-auth gs-stack">
        <Progress value={100} label="Step 2 of 2: Payment" />
        <h1 className="gs-h2" style={{ margin: 0 }}>Test payment</h1>
        <p className="gs-muted" style={{ margin: 0 }}>This stands in for Stripe while no Stripe keys are set. No real card is used and nothing is charged.</p>
        {!info && !error && <SkeletonList rows={1} h={80} />}
        {info && (
          <div className="gs-panel gs-panel--cream gs-stack gs-stack--sm">
            {info.items.map((i) => <div key={i.title} className="gs-small">{i.title}{i.quantity > 1 ? ` x${i.quantity}` : ""}</div>)}
            <div className="gs-sum__row gs-sum__row--total"><span>Total</span><span>{formatMoney(info.totalCents)}</span></div>
          </div>
        )}
        {error && <ErrorBox message={error} />}
        <Button size="lg" disabled={busy || !info} onClick={() => act("pay")}>Pay with test card 4242</Button>
        <Button variant="secondary" disabled={busy || !info} onClick={() => act("decline")}>Simulate a declined card</Button>
        <Button variant="ghost" disabled={busy} onClick={() => act("cancel")} style={{ color: "var(--gh-cocoa)" }}>Cancel and go back</Button>
      </div>
    </div>
  );
}

/** Landing after payment. The webhook can arrive a moment after the browser, so poll until the order exists. */
export function CheckoutSuccess() {
  const sp = useSearchParams();
  const session = useSession();
  const sid = sp.get("session_id") ?? "";
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sid || orderId) return;
    let stop = false;
    const tick = async () => {
      const r = await api<{ orderId: string | null }>(`/api/checkout/session?session_id=${encodeURIComponent(sid)}`);
      if (stop) return;
      if (r.ok && r.data.orderId) {
        setOrderId(r.data.orderId);
        void refreshSession();
        return;
      }
      if (!r.ok && r.status !== 0) return setError(r.data.error ?? "We couldn't find that payment.");
      setTries((t) => t + 1);
      setTimeout(tick, 1000);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [sid, orderId]);

  if (error) return <div className="gs-page gs-page--narrow gs-stack"><ErrorBox message={error} /><ButtonLink variant="secondary" href="/orders">See your orders</ButtonLink></div>;
  if (!orderId) {
    return (
      <div className="gs-page gs-page--narrow gs-stack" role="status">
        <Progress value={Math.min(90, 30 + tries * 10)} label="Confirming your payment" />
        {tries > 15 && <p className="gs-muted">This is taking longer than usual. We&apos;ll email you when it&apos;s ready. You can also check <Link className="gs-link" href="/orders">your orders</Link>.</p>}
      </div>
    );
  }
  const first = session.firstName || session.email?.split("@")[0] || "";
  return (
    <div className="gs-page gs-page--narrow gs-stack gs-stack--lg">
      <h1 className="gs-h1">Thanks{first ? `, ${first}` : ""}. We&apos;re on it.</h1>
      <p className="gs-lede" style={{ margin: 0 }}>We emailed {session.email ?? "you"} with what&apos;s on its way.</p>
      <div className="gs-row">
        <ButtonLink size="lg" href={`/orders/${orderId}`}>Track this order</ButtonLink>
        <ButtonLink size="lg" variant="secondary" href="/create/card">Make another</ButtonLink>
      </div>
    </div>
  );
}
