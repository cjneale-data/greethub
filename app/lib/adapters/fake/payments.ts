import type { PaymentsAdapter } from "../types";
import { parseStripeWebhook, type StripeEvent } from "../real/stripe";
import { signStripePayload } from "../real/stripeSignature";

/** Webhook secret used only by the local fake. The fake signs its own events with it, so the real verification code runs locally. */
export const FAKE_WEBHOOK_SECRET = "whsec_greethub_local_fake";

/** Builds a Stripe-shaped checkout.session.completed event for the fake checkout page. */
export function buildFakeSessionEvent(opts: { sessionId: string; checkoutId: string; email: string; amountTotal: number; paid: boolean; eventId?: string }): StripeEvent {
  return {
    id: opts.eventId ?? `evt_fake_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: opts.sessionId,
        object: "checkout.session",
        client_reference_id: opts.checkoutId,
        metadata: { checkout_id: opts.checkoutId },
        payment_status: opts.paid ? "paid" : "unpaid",
        amount_total: opts.amountTotal,
        payment_intent: `pi_fake_${opts.sessionId.slice(-10)}`,
        customer_email: opts.email,
        customer_details: { email: opts.email },
      },
    },
  };
}

export function signFakeEvent(event: StripeEvent): { body: string; signature: string } {
  const body = JSON.stringify(event);
  return { body, signature: signStripePayload(body, FAKE_WEBHOOK_SECRET) };
}

/** Local stand-in for Stripe Checkout: the "hosted page" is /checkout/fake on this site. */
export const fakePayments: PaymentsAdapter = {
  name: "fake",
  async createCheckoutSession(input) {
    const id = `cs_fake_${input.checkoutId.replace(/^co_/, "")}`;
    return { id, url: `/checkout/fake?session=${encodeURIComponent(id)}` };
  },
  async parseWebhook(rawBody, signature) {
    return parseStripeWebhook(rawBody, signature, FAKE_WEBHOOK_SECRET);
  },
};
