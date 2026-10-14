import { signFakeEvent } from "@/lib/adapters/fake/payments";
import { fakeAllowed, json } from "@/lib/shop/api";
import { stripeBillingConfigured } from "@/lib/membership/billing";
import { membershipEnabled } from "@/lib/membership/service";
import { handlePaymentWebhook } from "@/lib/shop/orderService";
import { PURCHASABLE_TIERS, tierById } from "@greethub/shared";
import { memberRoute } from "../_lib";

/**
 * Stands in for Stripe Checkout when no Stripe keys exist (local dev, opted-in previews). "subscribe" sends a signed
 * customer.subscription.created event through the same webhook handler Stripe would call. Never available with real
 * billing or outside fake mode.
 */
export const POST = memberRoute(async (req, u) => {
  if (!fakeAllowed() || stripeBillingConfigured() || !membershipEnabled()) return json({ error: "Not available." }, 404);
  const b = (await req.json().catch(() => ({}))) as { tier?: string; interval?: string; trial?: number; outcome?: "subscribe" | "decline" };
  const tier = tierById(b.tier ?? "");
  if (!PURCHASABLE_TIERS.includes(tier.id)) return json({ error: "That plan isn't available yet." }, 400);
  if (b.outcome === "decline") return json({ declined: true, error: "Your card was declined. Nothing was charged." }, 402);
  const interval = b.interval === "year" ? "year" : "month";
  const now = Math.floor(Date.now() / 1000);
  const trialDays = Math.max(0, Math.min(tier.trialDays, Number(b.trial) || 0));
  const periodEnd = trialDays ? now + trialDays * 86_400 : now + (interval === "year" ? 365 : 30) * 86_400;
  const sub = {
    id: `sub_fake_${u.userId.replace(/[^a-z0-9]/gi, "").slice(-12)}`,
    object: "subscription",
    customer: `cus_fake_${u.userId.replace(/[^a-z0-9]/gi, "").slice(-12)}`,
    status: trialDays ? "trialing" : "active",
    cancel_at_period_end: false,
    current_period_end: periodEnd,
    trial_end: trialDays ? periodEnd : null,
    metadata: { user_id: u.userId, tier: tier.id, interval },
  };
  const { body, signature } = signFakeEvent({ id: `evt_fake_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`, object: "event", type: "customer.subscription.created", data: { object: sub as never } });
  const r = await handlePaymentWebhook(body, signature);
  if (r.status !== 200) return json({ error: "We couldn't start your membership. Nothing was charged." }, 502);
  return json({ redirect: "/account/membership?joined=1" });
});
