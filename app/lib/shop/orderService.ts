import { isPrinted, itemSku, priceLine, describeItem, type CartItem } from "@greethub/shared";
import { getAdapters, type PrintJob, type PrinterAdapter, type PaymentEvent } from "../adapters";
import { docs } from "../store";
import { newId } from "./store";
import { aggregateStatus, applyTransition, canTransition, isTerminal, mapPrinterState, pathTo, type OrderStatus } from "./orderState";
import { sendNeedsAttention, sendOrderConfirmed, sendShipped } from "./mail";
import { fakeAllowed } from "./policies";
import { findCheckoutBySession } from "./checkoutService";
import type { Order, OrderItem, PendingCheckout } from "./types";
import { applySubscriptionEvent, isSubscriptionEvent, type StripeSubscription } from "../membership/service";

/* ---------- building an order from a paid checkout ---------- */

export function toOrderItem(item: CartItem, pending: PendingCheckout): OrderItem {
  const p = priceLine(item);
  const printed = isPrinted(item);
  return {
    id: newId("li"),
    creationId: item.creationId,
    kind: item.kind,
    source: item.kind === "card" && item.source === "stock" ? "stock" : undefined,
    sku: itemSku(item),
    title: item.title,
    description: describeItem(item),
    recipientName: item.recipientName,
    quantity: item.quantity,
    productCents: p.productCents,
    postageCents: p.postageCents,
    printed,
    shipTo: printed ? pending.shipTo[item.id] : undefined,
    status: "paid",
  };
}

/**
 * The order keeps what the customer was actually charged. Our cart tax is a placeholder (0), and Stripe automatic tax
 * adds the real tax on top, so take tax and total from the payment event when it has them. Bookkeeping needs the
 * collected sales tax per order (finance/ops). The pre-tax amount was already checked against the cart before this runs.
 */
function chargedTotals(totals: Order["totals"], ev: Pick<PaymentEvent, "amountTotalCents" | "amountTaxCents">): Order["totals"] {
  if (ev.amountTotalCents == null) return totals;
  return { ...totals, taxCents: ev.amountTaxCents ?? totals.taxCents, totalCents: ev.amountTotalCents };
}

const orderNumber = () => "GH-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

/**
 * Creates the order for a paid checkout. Idempotent: a second call for the same checkout returns the existing order,
 * so Stripe's retried webhook deliveries (and the fake page being double-clicked) never create two orders.
 * The order number is claimed on the checkout first, so a retry after a crash part-way through reuses it.
 */
export async function createOrderFromCheckout(
  checkoutId: string,
  ev: Pick<PaymentEvent, "paymentIntentId" | "sessionId" | "amountTotalCents" | "amountTaxCents">,
  now = new Date(),
): Promise<{ order: Order; created: boolean } | null> {
  const store = docs();
  const claim = orderNumber();
  const pending = await store.mutate("checkouts", checkoutId, (c) => c && (c.orderId ? c : { ...c, orderId: claim }));
  if (!pending?.orderId) return null;
  const existing = await store.get("orders", pending.orderId);
  if (existing) return { order: existing, created: false };
  const order: Order = {
    id: pending.orderId,
    userId: pending.userId,
    email: pending.email,
    firstName: pending.firstName,
    stripeSessionId: ev.sessionId ?? pending.sessionId ?? "",
    paymentIntentId: ev.paymentIntentId,
    createdAt: now.toISOString(),
    status: "paid",
    history: [{ status: "paid", at: now.toISOString() }],
    items: pending.items.map((i) => toOrderItem(i, pending)),
    totals: chargedTotals(pending.totals, ev),
    shippingMethod: pending.shippingMethod,
    deliveryDate: pending.deliveryDate,
    consent: pending.consent,
  };
  if (!(await store.insertIfAbsent("orders", order.id, order))) {
    const raced = await store.get("orders", order.id);
    return raced ? { order: raced, created: false } : null;
  }
  await store.mutate("checkouts", checkoutId, (c) => c && { ...c, status: "completed" });
  // The purchased lines leave the cart; anything added since stays.
  const bought = new Set(pending.items.map((i) => i.id));
  await store.mutate("carts", pending.userId, (cart) => (cart ?? []).filter((i) => !bought.has(i.id)));
  // Save addresses the buyer asked us to keep.
  if (pending.saveAddresses.length) {
    const ids = pending.saveAddresses.map(() => newId("ad"));
    await store.mutate("addresses", pending.userId, (cur) => {
      const book = cur ?? [];
      pending.saveAddresses.forEach((s, n) => {
        const dup = book.some((a) => a.address.line1 === s.address.line1 && a.address.postalCode === s.address.postalCode);
        if (!dup) book.push({ id: ids[n], label: s.label, address: s.address, isDefault: book.length === 0 });
      });
      return book;
    });
  }
  // Recipients become "used in" counts later; creators own that. Nothing to do here.
  return { order, created: true };
}

/* ---------- printing ---------- */

const printerFor = (item: OrderItem): PrinterAdapter => (item.kind === "book" ? getAdapters().bookPrinter : getAdapters().cardPrinter);

/** TODO(storage): resolve signed URLs for the creation's interior/cover/card PDFs once the creator pipeline stores them. */
async function printAssets(): Promise<PrintJob["pdfUrls"]> {
  return {};
}

async function saveOrder(order: Order) {
  await docs().mutate("orders", order.id, () => order);
}

/** Moves the order status to match its items, recording each step on the timeline. */
export function recomputeOrder(order: Order, now = new Date(), note?: string): Order {
  const target = aggregateStatus(order.items.map((i) => i.status));
  if (target === order.status) return order;
  const steps = pathTo(order.status, target);
  let { status, history } = order;
  if (steps.length === 0 && canTransition(status, target)) steps.push(target);
  steps.forEach((s, i) => {
    const r = applyTransition(status, history, s, now, i === steps.length - 1 ? note : undefined);
    status = r.status;
    history = r.history;
  });
  return { ...order, status, history };
}

function setItemStatus(item: OrderItem, to: OrderStatus): OrderItem {
  if (item.status === to) return item;
  const steps = pathTo(item.status, to);
  if (steps.length === 0 && !canTransition(item.status, to)) return item;
  return { ...item, status: to };
}

/** Validates and submits each printed line to its printer; digital lines are delivered at once. Safe to call again: submitted lines are skipped. */
export async function submitOrder(orderId: string, now = new Date()): Promise<Order | null> {
  const found = await docs().get("orders", orderId);
  if (!found) return null;
  let order: Order = structuredClone(found);
  const attention: { item: OrderItem; reason: string }[] = [];

  order.items = await Promise.all(
    order.items.map(async (item): Promise<OrderItem> => {
      if (!item.printed) return { ...item, status: "delivered", note: "Digital copy sent to your email." };
      if (item.fulfillment || !item.shipTo) return item;
      const printer = printerFor(item);
      const job: PrintJob = {
        orderId: order.id,
        lineId: item.id,
        sku: item.sku,
        title: item.title,
        email: order.email,
        pdfUrls: await printAssets(),
        shipTo: item.shipTo,
        quantity: item.quantity,
        expedited: order.shippingMethod === "express",
      };
      try {
        const v = await printer.validateFiles(job);
        if (!v.ok) {
          attention.push({ item, reason: v.problems[0] ?? "the print files need a fix" });
          return { ...item, status: "needs_attention", note: v.problems.join("; ") };
        }
        const { externalId } = await printer.submit(job);
        return { ...item, status: "preparing", fulfillment: { printer: printer.name, externalId, state: "submitted", submittedAt: now.toISOString() }, note: undefined };
      } catch (err) {
        console.error("print submit failed", orderId, err);
        attention.push({ item, reason: "we couldn't reach the print shop" });
        return { ...item, status: "needs_attention", note: "We couldn't reach the print shop. We're looking into it." };
      }
    }),
  );
  order = recomputeOrder(order, now);
  await saveOrder(order);
  for (const a of attention) await sendNeedsAttention(order, a.item).catch((e) => console.error("email failed", e));
  return order;
}

/* ---------- printer updates (poll or webhook) ---------- */

function applyPrinterState(order: Order, item: OrderItem, raw: { state: string; trackingUrl?: string; trackingNumber?: string; carrier?: string }): { item: OrderItem; justShipped: boolean } {
  const mapped = mapPrinterState(raw.state);
  const f = item.fulfillment;
  if (!f) return { item, justShipped: false };
  let next: OrderItem = { ...item, fulfillment: { ...f, state: raw.state, trackingUrl: raw.trackingUrl ?? f.trackingUrl, trackingNumber: raw.trackingNumber ?? f.trackingNumber, carrier: raw.carrier ?? f.carrier } };
  if (mapped && !isTerminal(item.status)) next = setItemStatus(next, mapped);
  if (mapped === "needs_attention") next.note = "The print shop flagged this one. We're looking at it.";
  else if (next.status !== "needs_attention") next.note = undefined;
  const justShipped = next.status === "shipped" && item.status !== "shipped" && item.status !== "delivered";
  void order;
  return { item: next, justShipped };
}

async function finishUpdate(order: Order, shipped: OrderItem[], now: Date): Promise<Order> {
  let out = recomputeOrder(order, now);
  if (out.accountDeleted && isTerminal(out.status)) out = scrubOrder(out);
  await saveOrder(out);
  for (const s of shipped) await sendShipped(out, s).catch((e) => console.error("email failed", e));
  return out;
}

/** Polls the printers for each open line. Real printers also call the webhook; polling covers a missed delivery. */
export async function refreshOrder(orderId: string, now = new Date()): Promise<Order | null> {
  const found = await docs().get("orders", orderId);
  if (!found) return null;
  const order: Order = structuredClone(found);
  const shipped: OrderItem[] = [];
  order.items = await Promise.all(
    order.items.map(async (item) => {
      if (!item.fulfillment || isTerminal(item.status)) return item;
      try {
        const st = await printerFor(item).status(item.fulfillment.externalId);
        const r = applyPrinterState(order, item, st);
        if (r.justShipped) shipped.push(r.item);
        return r.item;
      } catch (err) {
        console.error("printer status failed", orderId, err);
        return item;
      }
    }),
  );
  return finishUpdate(order, shipped, now);
}

const lastRefresh = new Map<string, number>();

/**
 * Page-view polling: refreshes an order from the printers at most once per `minMs` per instance, so an account page
 * that is reloaded (or many customers at a peak) does not turn into one printer API call per open line per view.
 */
export async function refreshOrderIfStale(orderId: string, minMs = 5 * 60_000, now = Date.now()): Promise<void> {
  const last = lastRefresh.get(orderId) ?? 0;
  if (now - last < minMs) return;
  lastRefresh.set(orderId, now);
  if (lastRefresh.size > 5000) lastRefresh.delete(lastRefresh.keys().next().value!);
  await refreshOrder(orderId);
}

/** Printer webhook entry: find the line by the printer's id and apply the new state. */
export async function applyPrinterWebhook(externalId: string, state: string, tracking: { trackingUrl?: string; trackingNumber?: string; carrier?: string } = {}, now = new Date()): Promise<Order | null> {
  const order = (await docs().find("orders", { ref: externalId })).find((o) => o.items.some((i) => i.fulfillment?.externalId === externalId));
  if (!order) return null;
  const copy: Order = structuredClone(order);
  const shipped: OrderItem[] = [];
  copy.items = copy.items.map((item) => {
    if (item.fulfillment?.externalId !== externalId) return item;
    const r = applyPrinterState(copy, item, { state, ...tracking });
    if (r.justShipped) shipped.push(r.item);
    return r.item;
  });
  return finishUpdate(copy, shipped, now);
}

/* ---------- privacy ---------- */

export function scrubOrder(order: Order): Order {
  return {
    ...order,
    email: "deleted",
    firstName: undefined,
    scrubbed: true,
    items: order.items.map((i) => ({ ...i, shipTo: undefined, recipientName: undefined })),
  };
}

/* ---------- webhook entry ---------- */

export type WebhookResult = { status: number; body: Record<string, unknown> };

/**
 * Handles a payment-provider webhook end to end: verify signature, ignore events we already handled, and on
 * checkout.session.completed with a paid session create the order, email the buyer and send printed lines to the printers.
 * Returns an HTTP-shaped result so the route stays thin and tests can call it directly.
 */
export async function handlePaymentWebhook(rawBody: string, signature: string | null): Promise<WebhookResult> {
  // Without Stripe keys the fake adapter verifies with a public constant secret, so anyone could sign a "paid" event.
  // Outside local dev and opted-in previews, refuse rather than create orders from forged events.
  if (getAdapters().payments.name === "fake" && !fakeAllowed()) return { status: 404, body: { error: "not available" } };
  let ev: PaymentEvent;
  try {
    ev = await getAdapters().payments.parseWebhook(rawBody, signature);
  } catch {
    return { status: 400, body: { error: "invalid signature" } };
  }
  // Replays of an event we already finished are acknowledged without doing anything. The event is recorded only after
  // success, so a crash mid-way lets Stripe's retry run again; order creation itself is idempotent per checkout.
  const store = docs();
  if (await store.get("processed_events", ev.id)) return { status: 200, body: { received: true, duplicate: true } };
  const done = async (body: Record<string, unknown>): Promise<WebhookResult> => {
    await store.insertIfAbsent("processed_events", ev.id, { at: new Date().toISOString() });
    return { status: 200, body: { received: true, ...body } };
  };

  // Membership subscriptions share this endpoint (lib/membership). Their checkout sessions are not orders.
  const obj = (JSON.parse(rawBody) as { data?: { object?: Record<string, unknown> } }).data?.object ?? {};
  if (isSubscriptionEvent(ev.type)) return done(await applySubscriptionEvent(ev.type, obj as unknown as StripeSubscription));
  if (obj.mode === "subscription") return done({ membershipCheckout: true });

  if (ev.type !== "checkout.session.completed" && ev.type !== "checkout.session.async_payment_succeeded") {
    return done({ ignored: ev.type });
  }
  if (ev.paymentStatus && ev.paymentStatus !== "paid" && ev.paymentStatus !== "no_payment_required") {
    // Unpaid on completion (delayed payment method): wait for async_payment_succeeded.
    return { status: 200, body: { received: true, waiting: ev.paymentStatus } };
  }
  const pending = ev.checkoutId ? await store.get("checkouts", ev.checkoutId) : ev.sessionId ? await findCheckoutBySession(ev.sessionId) : undefined;
  if (!pending) return done({ unknown: true });
  const checkoutId = pending.id;
  // Stripe automatic tax adds tax on top of our lines, so compare amounts before tax on both sides.
  const paidBeforeTax = ev.amountTotalCents == null ? null : ev.amountTotalCents - (ev.amountTaxCents ?? 0);
  if (paidBeforeTax != null && paidBeforeTax !== pending.totals.totalCents - pending.totals.taxCents) {
    // A mismatch means the cart changed under the session. Record it and do not fulfil; a human reviews it.
    console.error("checkout amount mismatch", checkoutId, ev.amountTotalCents, pending.totals.totalCents);
    await store.mutate("checkouts", checkoutId, (c) => c && { ...c, status: "failed" });
    return done({ mismatch: true });
  }
  const res = await createOrderFromCheckout(checkoutId, ev);
  if (!res) return done({ unknown: true });
  if (res.created) {
    await sendOrderConfirmed(res.order).catch((e) => console.error("confirmation email failed", e));
    await submitOrder(res.order.id).catch((e) => console.error("order submit failed", e));
  }
  return done({ orderId: res.order.id });
}
