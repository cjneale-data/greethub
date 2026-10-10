import { getAdapters } from "@/lib/adapters";
import { buildFakeSessionEvent, signFakeEvent } from "@/lib/adapters/fake/payments";
import { fakeAllowed, json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { findCheckoutBySession } from "@/lib/shop/checkoutService";
import { handlePaymentWebhook } from "@/lib/shop/orderService";

/**
 * Stands in for the Stripe-hosted page when no Stripe keys exist. "pay" sends a signed checkout.session.completed event
 * through the same webhook handler Stripe would call. Refuses to run when real Stripe is configured or in production.
 */
export async function GET(req: Request) {
  if (!fakeAllowed() || getAdapters().payments.name !== "fake") return json({ error: "Not available." }, 404);
  const user = await signedIn();
  if (!user) return json(NOT_SIGNED_IN, 401);
  const c = findCheckoutBySession(new URL(req.url).searchParams.get("session") ?? "");
  if (!c || c.userId !== user.userId) return json({ error: "We couldn't find that payment." }, 404);
  return json({ totalCents: c.totals.totalCents, items: c.items.map((i) => ({ title: i.title, quantity: i.quantity })), status: c.status, orderId: c.orderId ?? null });
}

export async function POST(req: Request) {
  if (!fakeAllowed() || getAdapters().payments.name !== "fake") return json({ error: "Not available." }, 404);
  const user = await signedIn();
  if (!user) return json(NOT_SIGNED_IN, 401);
  const b = (await req.json().catch(() => ({}))) as { session?: string; outcome?: "pay" | "decline" | "cancel" };
  const c = findCheckoutBySession(b.session ?? "");
  if (!c || c.userId !== user.userId) return json({ error: "We couldn't find that payment." }, 404);
  if (b.outcome === "decline") return json({ declined: true, error: "Your card was declined. Try another card, or check the details." }, 402);
  if (b.outcome === "cancel") return json({ redirect: "/cart?cancelled=1" });
  const ev = buildFakeSessionEvent({ sessionId: c.sessionId!, checkoutId: c.id, email: c.email, amountTotal: c.totals.totalCents, paid: true });
  const { body, signature } = signFakeEvent(ev);
  const r = await handlePaymentWebhook(body, signature);
  if (r.status !== 200) return json({ error: "We couldn't open payment. Nothing was charged." }, 502);
  return json({ redirect: `/checkout/success?session_id=${encodeURIComponent(c.sessionId!)}` });
}
