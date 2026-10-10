import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { StripeSignatureError, signStripePayload, verifyStripeSignature } from "@/lib/adapters/real/stripeSignature";
import { buildCheckoutSessionParams, normalizeStripeEvent, parseStripeWebhook, stripePayments } from "@/lib/adapters/real/stripe";
import { buildFakeSessionEvent } from "@/lib/adapters/fake/payments";

const secret = "whsec_test_secret";
const body = JSON.stringify(buildFakeSessionEvent({ sessionId: "cs_test_1", checkoutId: "co_1", email: "a@b.co", amountTotal: 1098, paid: true, eventId: "evt_1" }));

describe("Stripe webhook signature", () => {
  it("accepts a valid signature", () => {
    const t = 1_700_000_000;
    expect(() => verifyStripeSignature(body, signStripePayload(body, secret, t), secret, 300, t + 10)).not.toThrow();
  });
  it("matches Stripe's documented scheme: HMAC-SHA256 of t.payload", () => {
    expect(signStripePayload("{}", "k", 1)).toBe("t=1,v1=" + createHmac("sha256", "k").update("1.{}").digest("hex"));
  });
  it("rejects a tampered body, wrong secret, stale timestamp, missing or malformed header", () => {
    const t = 1_700_000_000;
    const h = signStripePayload(body, secret, t);
    expect(() => verifyStripeSignature(body + " ", h, secret, 300, t)).toThrow(StripeSignatureError);
    expect(() => verifyStripeSignature(body, h, "other", 300, t)).toThrow(StripeSignatureError);
    expect(() => verifyStripeSignature(body, h, secret, 300, t + 301)).toThrow(/tolerance/);
    expect(() => verifyStripeSignature(body, null, secret)).toThrow(/Missing/);
    expect(() => verifyStripeSignature(body, "garbage", secret)).toThrow(/Malformed/);
  });
  it("accepts any matching v1 when several are sent", () => {
    const t = 1_700_000_000;
    const good = signStripePayload(body, secret, t).split(",")[1];
    expect(() => verifyStripeSignature(body, `t=${t},v1=deadbeef,${good}`, secret, 300, t)).not.toThrow();
  });
});

describe("Stripe event shapes", () => {
  it("normalizes checkout.session.completed", () => {
    expect(normalizeStripeEvent(JSON.parse(body))).toMatchObject({ id: "evt_1", type: "checkout.session.completed", sessionId: "cs_test_1", checkoutId: "co_1", paymentStatus: "paid", amountTotalCents: 1098, email: "a@b.co" });
  });
  it("parseStripeWebhook verifies before parsing", () => {
    expect(parseStripeWebhook(body, signStripePayload(body, secret), secret).sessionId).toBe("cs_test_1");
    expect(() => parseStripeWebhook(body, "t=1,v1=00", secret)).toThrow();
  });
  it("builds Checkout Session params in Stripe's form encoding", () => {
    const p = buildCheckoutSessionParams({ checkoutId: "co_9", userId: "u1", email: "a@b.co", successUrl: "https://x/s?session_id={CHECKOUT_SESSION_ID}", cancelUrl: "https://x/c", lines: [{ sku: "card_mailed", description: "Card", unitAmountCents: 799, quantity: 2, creationId: "c1" }] });
    expect(p.get("mode")).toBe("payment");
    expect(p.get("line_items[0][price_data][unit_amount]")).toBe("799");
    expect(p.get("line_items[0][quantity]")).toBe("2");
    expect(p.get("line_items[0][price_data][currency]")).toBe("usd");
    expect(p.get("metadata[checkout_id]")).toBe("co_9");
    expect(p.get("client_reference_id")).toBe("co_9");
  });
  it("createCheckoutSession posts with auth and an idempotency key", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ id: "cs_live_1", url: "https://checkout.stripe.com/c/pay/cs_live_1" }), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await stripePayments("sk_test_x", secret, f).createCheckoutSession({ checkoutId: "co_9", userId: "u", email: "a@b.co", successUrl: "s", cancelUrl: "c", lines: [] });
    expect(r.id).toBe("cs_live_1");
    const s = seen as unknown as { url: string; init: RequestInit };
    expect(s.url).toBe("https://api.stripe.com/v1/checkout/sessions");
    const h = s.init.headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer sk_test_x");
    expect(h["Idempotency-Key"]).toBe("checkout_co_9");
  });
  it("surfaces Stripe errors", async () => {
    const f = (async () => new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 })) as unknown as typeof fetch;
    await expect(stripePayments("sk", secret, f).createCheckoutSession({ checkoutId: "c", userId: "u", email: "e", successUrl: "s", cancelUrl: "c", lines: [] })).rejects.toThrow(/bad key/);
  });
});
