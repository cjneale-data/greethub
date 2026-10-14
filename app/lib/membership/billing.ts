/**
 * Membership billing on Stripe Billing, over the REST API like lib/adapters/real/stripe.ts (no SDK).
 * Checkout runs in subscription mode with inline recurring prices, so no Stripe Product/Price setup is needed to start;
 * the CFO's prices in packages/shared/src/membership.ts are the source. Webhooks arrive on the existing
 * /api/webhooks/stripe endpoint and are routed to lib/membership/service.ts applySubscriptionEvent.
 */
import { hasEnv } from "../env";

export type SubscriptionCheckout = {
  userId: string;
  email: string;
  tierId: string;
  tierName: string;
  interval: "month" | "year";
  amountCents: number;
  trialDays: number;
  /** Existing Stripe customer, so a returning member keeps one billing record. */
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
};

export const stripeBillingConfigured = () => hasEnv("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");

export function buildSubscriptionCheckoutParams(c: SubscriptionCheckout): URLSearchParams {
  const p = new URLSearchParams();
  p.set("mode", "subscription");
  p.set("success_url", c.successUrl);
  p.set("cancel_url", c.cancelUrl);
  if (c.customerId) p.set("customer", c.customerId);
  else p.set("customer_email", c.email);
  p.set("client_reference_id", c.userId);
  for (const [k, v] of Object.entries({ user_id: c.userId, tier: c.tierId, interval: c.interval })) {
    p.set(`metadata[${k}]`, v);
    // Copied onto the subscription itself, so every later customer.subscription.* event names the member and tier.
    p.set(`subscription_data[metadata][${k}]`, v);
  }
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "usd");
  p.set("line_items[0][price_data][unit_amount]", String(c.amountCents));
  p.set("line_items[0][price_data][recurring][interval]", c.interval);
  p.set("line_items[0][price_data][product_data][name]", `GreetHub ${c.tierName}`);
  if (c.trialDays > 0) {
    p.set("subscription_data[trial_period_days]", String(c.trialDays));
    // "No card needed" (docs/finance/membership-plan.md): the trial asks for no card, and if none is added by the end
    // it simply ends instead of charging or going past due.
    p.set("payment_method_collection", "if_required");
    p.set("subscription_data[trial_settings][end_behavior][missing_payment_method]", "cancel");
  }
  if (process.env.STRIPE_AUTOMATIC_TAX === "1") p.set("automatic_tax[enabled]", "true");
  return p;
}

async function stripe(path: string, body: URLSearchParams, idempotencyKey?: string, fetchImpl: typeof fetch = fetch) {
  const res = await fetchImpl(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body.toString(),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe error ${res.status}: ${json.error?.message ?? "request failed"}`);
  return json;
}

export async function createSubscriptionCheckout(c: SubscriptionCheckout, fetchImpl?: typeof fetch): Promise<{ id: string; url: string }> {
  // A double click within the same minute reuses the same Stripe session.
  const key = `member_${c.userId}_${c.tierId}_${c.interval}_${Math.floor(Date.now() / 60_000)}`;
  const s = await stripe("checkout/sessions", buildSubscriptionCheckoutParams(c), key, fetchImpl);
  if (typeof s.id !== "string" || typeof s.url !== "string") throw new Error("Stripe returned no checkout url");
  return { id: s.id, url: s.url };
}

/** Cancel at period end (perks stay until then), or undo that. Mirrors what the Stripe customer portal does. */
export async function setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean, fetchImpl?: typeof fetch) {
  await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`, new URLSearchParams({ cancel_at_period_end: String(cancel) }), undefined, fetchImpl);
}

/** Stripe-hosted page for card details and invoices. Needs the customer portal switched on in the Stripe dashboard. */
export async function createBillingPortal(customerId: string, returnUrl: string, fetchImpl?: typeof fetch): Promise<string> {
  const s = await stripe("billing_portal/sessions", new URLSearchParams({ customer: customerId, return_url: returnUrl }), undefined, fetchImpl);
  if (typeof s.url !== "string") throw new Error("Stripe returned no portal url");
  return s.url;
}

/** Ends a subscription immediately (account deletion). DELETE /v1/subscriptions/:id. A 404 means it's already gone. */
export async function cancelSubscriptionNow(subscriptionId: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const res = await fetchImpl(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Stripe error ${res.status} cancelling subscription`);
}
