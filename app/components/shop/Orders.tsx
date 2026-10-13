"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, ButtonLink, ChipGroup } from "@/components/brand";
import { formatMoney } from "@greethub/shared";
import { STATUS_LABEL, isInProgress, type OrderStatus } from "@/lib/shop/orderState";
import type { Order } from "@/lib/shop/types";
import { CartLineThumb } from "./CartView";
import { EmptyState, ErrorBox, SkeletonList } from "./ui";
import { api, useSession, useToast } from "./client";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const badgeTone = (s: OrderStatus) => (s === "shipped" || s === "delivered" ? "sent" : s === "paid" ? "new" : "draft");

export function OrdersList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const load = useCallback(async () => {
    const r = await api<{ orders: Order[] }>("/api/orders");
    if (r.status === 401) return (window.location.href = "/login?next=/orders&reason=signin");
    if (!r.ok) return setError(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    setError("");
    setOrders(r.data.orders);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!orders) return <SkeletonList rows={3} h={92} />;
  if (orders.length === 0) return <EmptyState message="No orders yet. Your first one will show up here." actions={[{ label: "Start a card", href: "/create/card" }]} />;
  const shown = orders.filter((o) => filter === "All" || (filter === "In progress" ? isInProgress(o.status) : !isInProgress(o.status)));
  return (
    <div className="gs-stack">
      <ChipGroup options={["All", "In progress", "Delivered"]} value={filter} onChange={setFilter} />
      {shown.length === 0 && <EmptyState message="Nothing in that list yet." />}
      {shown.map((o) => {
        const first = o.items[0];
        return (
          <Link key={o.id} href={`/orders/${o.id}`} className="gs-panel gs-order-row">
            {first && <CartLineThumb item={{ title: first.title, kind: first.kind }} />}
            <div>
              <strong>{first?.title}{o.items.length > 1 ? ` and ${o.items.length - 1} more` : ""}</strong>
              <div className="gs-small gs-muted">{fmt(o.createdAt)}</div>
            </div>
            <Badge tone={badgeTone(o.status)}>{STATUS_LABEL[o.status]}</Badge>
            <span className="gs-order-row__total">{formatMoney(o.totals.totalCents)}</span>
          </Link>
        );
      })}
    </div>
  );
}

const STEPS: OrderStatus[] = ["paid", "preparing", "printing", "shipped", "delivered"];

export function OrderDetail({ id }: { id: string }) {
  const toast = useToast();
  const session = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const prev = useRef<OrderStatus | null>(null);

  const apply = useCallback(
    (o: Order) => {
      if (prev.current && prev.current !== o.status && o.status === "shipped") toast(`Your ${o.items[0]?.kind ?? "card"}'s on its way to ${o.items[0]?.recipientName ?? "you"}.`);
      prev.current = o.status;
      setOrder(o);
    },
    [toast],
  );
  const load = useCallback(async () => {
    const r = await api<{ order: Order }>(`/api/orders/${id}`);
    if (r.status === 401) return (window.location.href = `/login?next=/orders/${id}&reason=signin`);
    if (!r.ok) return setError(r.data.error ?? "We couldn't find that order.");
    setError("");
    apply(r.data.order);
  }, [id, apply]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function advance() {
    setBusy(true);
    const r = await api<{ order: Order }>(`/api/orders/${id}/advance`, { method: "POST" });
    setBusy(false);
    if (r.ok) apply(r.data.order);
  }

  if (error) return <div className="gs-stack"><ErrorBox message={error} onRetry={load} /><ButtonLink variant="secondary" href="/orders">All orders</ButtonLink></div>;
  if (!order) return <SkeletonList rows={2} h={160} />;

  const at = (s: OrderStatus) => order.history.find((h) => h.status === s)?.at;
  const idx = STEPS.indexOf(order.status);
  const closed = order.status === "cancelled" || order.status === "refunded";
  const attention = order.status === "needs_attention";
  const printed = order.items.filter((i) => i.printed);
  const tracked = printed.filter((i) => i.fulfillment?.trackingNumber || i.fulfillment?.trackingUrl);
  const title = order.items[0]?.recipientName ? `${order.items[0].recipientName}'s ${order.items[0].kind}` : order.items[0]?.title;

  return (
    <div className="gs-two">
      <div className="gs-stack gs-stack--lg">
        <div className="gs-row gs-row--between">
          <div>
            <h1 className="gs-h1" style={{ marginBottom: 4 }}>{title}</h1>
            <div className="gs-small gs-muted">Order {order.id}, placed {fmt(order.createdAt)}</div>
          </div>
          <Badge tone={badgeTone(order.status)}>{STATUS_LABEL[order.status]}</Badge>
        </div>
        {attention && <ErrorBox message="We hit a snag before printing. It's on our side and a person is looking at it. We'll email you with what happens next." />}
        {closed && <div className="gs-banner">This order was {STATUS_LABEL[order.status].toLowerCase()}.</div>}
        <section className="gs-panel" aria-label="Order status">
          <ol className="gs-timeline">
            {STEPS.map((s, i) => {
              const frozen = closed || attention;
              const state = frozen ? (at(s) ? "done" : "todo") : idx === STEPS.length - 1 || i < idx ? "done" : i === idx ? "current" : "todo";
              return (
                <li key={s} data-state={state}>
                  <span className="gs-dot" aria-hidden="true">{state === "done" ? "✓" : i + 1}</span>
                  <div>
                    <div className="gs-timeline__label">{STATUS_LABEL[s]}{state === "current" ? " (now)" : ""}</div>
                    <div className="gs-timeline__when">
                      {at(s) ? fmt(at(s)!) : s === "shipped" ? "Tracking link when available" : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
        {tracked.length > 0 ? (
          <section className="gs-panel gs-stack gs-stack--sm" aria-label="Tracking">
            <h2 className="gs-h3" style={{ margin: 0 }}>Tracking</h2>
            {tracked.map((i) => (
              <div key={i.id} className="gs-small">
                {i.title}: {i.fulfillment?.carrier ?? "Carrier"} {i.fulfillment?.trackingNumber}{" "}
                {i.fulfillment?.trackingUrl && <a className="gs-link" href={i.fulfillment.trackingUrl} target="_blank" rel="noreferrer">Track package</a>}
              </div>
            ))}
          </section>
        ) : (
          printed.length > 0 && !closed && <p className="gs-muted" style={{ margin: 0 }}>Tracking shows up once it ships. We&apos;ll email you.</p>
        )}
        {session.fake.printers && isInProgress(order.status) && (
          <div className="gs-devnote">
            Local mode: the print shops are fake. <button className="gs-link" data-testid="advance" disabled={busy} onClick={advance}>Simulate a printer update</button>
          </div>
        )}
      </div>
      <aside className="gs-panel gs-stack gs-sticky" aria-label="Order details">
        <h2 className="gs-h3" style={{ margin: 0 }}>What&apos;s in it</h2>
        {order.items.map((i) => (
          <div key={i.id} className="gs-stack gs-stack--sm">
            <div className="gs-row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <CartLineThumb item={i} />
              <div className="gs-small">
                <strong>{i.title}</strong>{i.quantity > 1 ? ` x${i.quantity}` : ""}
                <br /><span className="gs-muted">{i.description}</span>
                {i.shipTo ? <><br /><span className="gs-muted">Shipping to: {i.shipTo.name}, {i.shipTo.city}</span></> : null}
                {i.note ? <><br /><span className="gs-muted">{i.note}</span></> : null}
              </div>
            </div>
          </div>
        ))}
        <div className="gs-sum__row gs-sum__row--total"><span>Total paid</span><span>{formatMoney(order.totals.totalCents)}</span></div>
        <Button variant="ghost" onClick={() => (window.location.href = `mailto:hello@greethub.example?subject=${encodeURIComponent("About order " + order.id)}`)}>Ask us about this order</Button>
      </aside>
    </div>
  );
}
