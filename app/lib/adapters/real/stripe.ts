import type { PaymentEvent, PaymentsAdapter, CheckoutSessionInput } from "../types";
import { verifyStripeSignature } from "./stripeSignature";

/** The subset of Stripe's Event object we read (https://docs.stripe.com/api/events/object, https://docs.stripe.com/api/checkout/sessions/object). */
export type StripeEvent = {
  id: string;
  object?: "event";
  type: string;
  data: {
    object: {
      id?: string;
      object?: string;
      client_reference_id?: string | null;
      metadata?: Record<string, string> | null;
      payment_status?: string;
      amount_total?: number | null;
      total_details?: { amount_tax?: number | null } | null;
      payment_intent?: string | null;
      customer_email?: string | null;
      customer_details?: { email?: string | null } | null;
    };
  };
};

export function normalizeStripeEvent(event: StripeEvent): PaymentEvent {
  const o = event.data?.object ?? {};
  return {
    id: event.id,
    type: event.type,
    sessionId: o.object === "checkout.session" || o.id?.startsWith("cs_") ? o.id : undefined,
    checkoutId: o.metadata?.checkout_id ?? o.client_reference_id ?? undefined,
    paymentStatus: o.payment_status,
    amountTotalCents: o.amount_total ?? undefined,
    amountTaxCents: o.total_details?.amount_tax ?? undefined,
    paymentIntentId: o.payment_intent ?? undefined,
    email: o.customer_details?.email ?? o.customer_email ?? undefined,
  };
}

/** Parses and verifies a webhook body with the given endpoint secret. Throws StripeSignatureError on a bad signature. */
export function parseStripeWebhook(rawBody: string, signature: string | null, secret: string): PaymentEvent {
  verifyStripeSignature(rawBody, signature, secret);
  return normalizeStripeEvent(JSON.parse(rawBody) as StripeEvent);
}

/** Stripe wants application/x-www-form-urlencoded with bracketed keys for nested data. */
export function buildCheckoutSessionParams(input: CheckoutSessionInput, opts: { automaticTax?: boolean } = {}): URLSearchParams {
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("success_url", input.successUrl);
  p.set("cancel_url", input.cancelUrl);
  p.set("customer_email", input.email);
  p.set("client_reference_id", input.checkoutId);
  p.set("metadata[checkout_id]", input.checkoutId);
  p.set("metadata[user_id]", input.userId);
  p.set("payment_intent_data[metadata][checkout_id]", input.checkoutId);
  input.lines.forEach((l, i) => {
    p.set(`line_items[${i}][quantity]`, String(l.quantity));
    p.set(`line_items[${i}][price_data][currency]`, "usd");
    p.set(`line_items[${i}][price_data][unit_amount]`, String(l.unitAmountCents));
    p.set(`line_items[${i}][price_data][product_data][name]`, l.description);
    if (l.creationId) p.set(`line_items[${i}][price_data][product_data][metadata][creation_id]`, l.creationId);
  });
  if (opts.automaticTax) p.set("automatic_tax[enabled]", "true");
  return p;
}

/** Real Stripe Checkout. Active only when STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set. Uses the REST API directly, no SDK. */
export function stripePayments(secretKey: string, webhookSecret: string, fetchImpl: typeof fetch = fetch): PaymentsAdapter {
  return {
    name: "stripe",
    async createCheckoutSession(input) {
      const res = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          // Same checkout id always maps to the same Stripe session, so a double click cannot create two.
          "Idempotency-Key": `checkout_${input.checkoutId}`,
        },
        body: buildCheckoutSessionParams(input, { automaticTax: process.env.STRIPE_AUTOMATIC_TAX === "1" }).toString(),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; url?: string | null; error?: { message?: string } };
      if (!res.ok || !body.id || !body.url) throw new Error(`Stripe error ${res.status}: ${body.error?.message ?? "no session url"}`);
      return { id: body.id, url: body.url };
    },
    async parseWebhook(rawBody, signature) {
      return parseStripeWebhook(rawBody, signature, webhookSecret);
    },
  };
}
