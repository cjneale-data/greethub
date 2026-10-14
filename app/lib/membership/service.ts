import {
  LAUNCH_FEATURES, MEMBERSHIP_SPEC, PURCHASABLE_TIERS, tierById,
  type FeatureKey, type Features, type TierId,
} from "@greethub/shared";
import { docs } from "../store";
import { fakeAllowed } from "../shop/policies";
import { cancelSubscriptionNow, createBillingPortal, createSubscriptionCheckout, setCancelAtPeriodEnd, stripeBillingConfigured } from "./billing";
import type { MembershipRecord, MembershipStatus } from "./types";

export class MembershipError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/**
 * On in local dev, tests and opted-in previews; in production only when the owner sets GREETHUB_MEMBERSHIP=1 (after the
 * attorney's auto-renewal review, docs/finance/membership-plan.md). While off, everyone gets LAUNCH_FEATURES: nothing
 * is gated and nothing can be bought.
 */
export const membershipEnabled = (env: NodeJS.ProcessEnv = process.env) =>
  env.GREETHUB_MEMBERSHIP === "1" || (env.GREETHUB_MEMBERSHIP !== "0" && (env.NODE_ENV !== "production" || env.GREETHUB_ALLOW_FAKE === "1"));

const iso = (d: Date) => d.toISOString();
const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);
const DAY = 86_400_000;

export async function getMembership(userId: string): Promise<MembershipRecord | undefined> {
  return docs().get("memberships", userId);
}

/** Which tier's perks apply right now. Cancelled members keep perks to period end; past-due keeps them for the grace. */
export function effectiveTier(m: MembershipRecord | undefined, now = new Date()): TierId {
  if (!m) return "free";
  const end = Date.parse(m.currentPeriodEnd);
  if (m.status === "trialing" || m.status === "active") return end > now.getTime() ? (m.tier as TierId) : "free";
  if (m.status === "past_due") return end + MEMBERSHIP_SPEC.rules.pastDueGraceDays * DAY > now.getTime() ? (m.tier as TierId) : "free";
  if (m.status === "canceled") return end > now.getTime() ? (m.tier as TierId) : "free";
  return "free";
}

export async function featuresFor(userId: string | null): Promise<Features> {
  if (!membershipEnabled()) return LAUNCH_FEATURES;
  if (!userId) return tierById("free").features as Features;
  return tierById(effectiveTier(await getMembership(userId))).features as Features;
}

/**
 * Quota period. Paid tiers: monthly slices anchored to the billing day (so annual plans refresh monthly too).
 * Free: the calendar month, UTC.
 */
export function periodKey(m: MembershipRecord | undefined, now = new Date()): string {
  if (!m || effectiveTier(m, now) === "free") return monthKey(now);
  const day = new Date(m.currentPeriodEnd).getUTCDate();
  const y = now.getUTCFullYear(), mo = now.getUTCMonth();
  const clamp = (yy: number, mm: number) => Math.min(day, new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate());
  const startThisMonth = Date.UTC(y, mo, clamp(y, mo));
  const start = now.getTime() >= startThisMonth ? new Date(startThisMonth) : new Date(Date.UTC(y, mo - 1, clamp(y, mo - 1)));
  return `bp-${start.toISOString().slice(0, 10)}`;
}

export type QuotaResult = { ok: true; used: number; limit: number } | { ok: false; used: number; limit: number };

/**
 * Atomically uses one unit of a monthly quota. A limit of -1 is unlimited (still counted, for the meter).
 * Returns ok:false without counting when the limit is reached.
 */
export async function consumeQuota(userId: string, key: FeatureKey): Promise<QuotaResult> {
  const f = await featuresFor(userId);
  const limit = Number(f[key]);
  let result: QuotaResult = { ok: true, used: 0, limit };
  await docs().mutate("memberships", userId, (cur) => {
    const rec = cur ?? freeRecord(userId);
    const period = periodKey(cur);
    const usage = rec.usage.period === period ? rec.usage : { period, counts: {} };
    const used = usage.counts[key] ?? 0;
    if (limit !== -1 && used >= limit) {
      result = { ok: false, used, limit };
      return cur; // unchanged (and nothing written for a member with no record)
    }
    usage.counts[key] = used + 1;
    result = { ok: true, used: used + 1, limit };
    return { ...rec, usage, updatedAt: iso(new Date()) };
  });
  return result;
}

/** Current period's usage for the meters on the membership page. */
export async function usageFor(userId: string): Promise<Record<string, number>> {
  const m = await getMembership(userId);
  return m && m.usage.period === periodKey(m) ? m.usage.counts : {};
}

function freeRecord(userId: string): MembershipRecord {
  const now = new Date();
  return { userId, tier: "free", interval: "month", status: "canceled", currentPeriodEnd: iso(new Date(0)), cancelAtPeriodEnd: false, usage: { period: monthKey(now), counts: {} }, history: [], updatedAt: iso(now) };
}

/* ---------- what the membership page shows ---------- */

export async function membershipView(userId: string) {
  const m = await getMembership(userId);
  const tier = membershipEnabled() ? effectiveTier(m) : "free";
  const paid = !!m && m.tier !== "free" && m.status !== "incomplete" && m.status !== "incomplete_expired";
  return {
    enabled: membershipEnabled(),
    tier,
    purchasable: PURCHASABLE_TIERS,
    subscription: paid
      ? { tier: m!.tier, interval: m!.interval, status: m!.status, currentPeriodEnd: m!.currentPeriodEnd, cancelAtPeriodEnd: m!.cancelAtPeriodEnd, trialEnd: m!.trialEnd ?? null, canManageBilling: !!m!.stripeCustomerId && stripeBillingConfigured() }
      : null,
    features: await featuresFor(userId),
    usage: await usageFor(userId),
    history: m?.history ?? [],
  };
}
export type MembershipView = Awaited<ReturnType<typeof membershipView>>;

/* ---------- buying, cancelling ---------- */

export async function startMembershipCheckout(user: { userId: string; email: string }, input: { tier: string; interval: string }, origin: string): Promise<{ url: string }> {
  if (!membershipEnabled()) throw new MembershipError(404, "not_open", "Memberships open soon.");
  const tier = tierById(input.tier);
  const interval = input.interval === "year" ? "year" : "month";
  if (tier.id === "free" || !PURCHASABLE_TIERS.includes(tier.id)) throw new MembershipError(400, "not_purchasable", "That plan isn't available yet.");
  const cur = await getMembership(user.userId);
  if (cur && effectiveTier(cur) !== "free" && !cur.cancelAtPeriodEnd) throw new MembershipError(409, "already_member", "You're already a member. Manage your plan below.");
  const amountCents = interval === "year" ? tier.annualCents : tier.monthlyCents;
  // One free trial per member, ever.
  const trialDays = cur?.history.some((h) => h.status === "trialing") ? 0 : tier.trialDays;
  if (!stripeBillingConfigured()) {
    if (!fakeAllowed()) throw new MembershipError(503, "billing_unavailable", "We can't take payments right now. Try again later.");
    const q = new URLSearchParams({ tier: tier.id, interval, trial: String(trialDays) });
    return { url: `/account/membership/fake-checkout?${q}` };
  }
  const s = await createSubscriptionCheckout({
    userId: user.userId,
    email: user.email,
    tierId: tier.id,
    tierName: tier.name,
    interval,
    amountCents,
    trialDays,
    customerId: cur?.stripeCustomerId,
    successUrl: `${origin}/account/membership?joined=1`,
    cancelUrl: `${origin}/account/membership?cancelled=1`,
  });
  return { url: s.url };
}

export async function setCancel(userId: string, cancel: boolean): Promise<void> {
  const m = await getMembership(userId);
  if (!m || m.tier === "free" || effectiveTier(m) === "free") throw new MembershipError(404, "no_membership", "You don't have a membership to change.");
  if (m.stripeSubscriptionId && stripeBillingConfigured()) await setCancelAtPeriodEnd(m.stripeSubscriptionId, cancel);
  else if (!fakeAllowed()) throw new MembershipError(503, "billing_unavailable", "We can't change your plan right now. Try again later.");
  // Recorded now so the page updates at once; Stripe's customer.subscription.updated confirms the same state.
  await docs().mutate("memberships", userId, (cur) => cur && withHistory({ ...cur, cancelAtPeriodEnd: cancel, status: cur.status }, cancel ? "cancel_requested" : "resumed"));
}

export async function billingPortalUrl(userId: string, returnUrl: string): Promise<string> {
  const m = await getMembership(userId);
  if (!m?.stripeCustomerId || !stripeBillingConfigured()) throw new MembershipError(404, "no_billing", "There's no billing account to manage yet.");
  return createBillingPortal(m.stripeCustomerId, returnUrl);
}

function withHistory(rec: MembershipRecord, event: string): MembershipRecord {
  const at = iso(new Date());
  return { ...rec, updatedAt: at, history: [...rec.history, { at, event, tier: rec.tier, status: rec.status }].slice(-20) };
}

/* ---------- Stripe subscription webhooks ---------- */

/** The fields of a Stripe subscription object we read. Newer API versions move current_period_end onto the items. */
export type StripeSubscription = {
  id: string;
  object?: "subscription";
  customer: string;
  status: MembershipStatus;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  trial_end?: number | null;
  metadata?: Record<string, string> | null;
  items?: { data?: { current_period_end?: number; price?: { recurring?: { interval?: string } | null } | null }[] };
};

export const isSubscriptionEvent = (type: string) => type.startsWith("customer.subscription.");

/** Applies customer.subscription.created/updated/deleted. Returns what happened, for the webhook's response body. */
export async function applySubscriptionEvent(type: string, sub: StripeSubscription): Promise<Record<string, unknown>> {
  // The subscription carries user_id in its metadata (set at checkout); older or edited ones are found by Stripe id.
  const owner = sub.metadata?.user_id ?? (await findByStripeRef(sub.id)) ?? (await findByStripeRef(sub.customer));
  if (!owner) return { membership: "unknown_member" };
  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  const interval = (sub.items?.data?.[0]?.price?.recurring?.interval ?? sub.metadata?.interval) === "year" ? "year" : "month";
  const status: MembershipStatus = type === "customer.subscription.deleted" ? "canceled" : sub.status;
  await docs().mutate("memberships", owner, (cur) => {
    const base = cur ?? freeRecord(owner);
    const next: MembershipRecord = {
      ...base,
      userId: owner,
      tier: sub.metadata?.tier ?? base.tier,
      interval,
      status,
      // A deletion ends perks now; otherwise perks run to the period end Stripe reports.
      currentPeriodEnd: type === "customer.subscription.deleted" ? iso(new Date()) : periodEnd ? iso(new Date(periodEnd * 1000)) : base.currentPeriodEnd,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      trialEnd: sub.trial_end ? iso(new Date(sub.trial_end * 1000)) : undefined,
      stripeCustomerId: sub.customer,
      stripeSubscriptionId: sub.id,
    };
    return withHistory(next, type.replace("customer.subscription.", "subscription_"));
  });
  return { membership: status, userId: owner };
}

async function findByStripeRef(ref: string | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  return (await docs().find("memberships", { ref }))[0]?.userId;
}

/* ---------- export and deletion ---------- */

export async function exportMembership(userId: string) {
  const m = await getMembership(userId);
  return m ? { tier: m.tier, interval: m.interval, status: m.status, currentPeriodEnd: m.currentPeriodEnd, cancelAtPeriodEnd: m.cancelAtPeriodEnd, history: m.history } : null;
}

/**
 * Account deletion: stop billing first, then forget the record. A paid membership must never keep charging a deleted
 * account, so a Stripe failure here is thrown, not swallowed (the deletion is retried rather than half-done).
 */
export async function deleteMembership(userId: string): Promise<void> {
  const m = await getMembership(userId);
  if (!m) return;
  if (m.stripeSubscriptionId && m.status !== "canceled" && stripeBillingConfigured()) await cancelSubscriptionNow(m.stripeSubscriptionId);
  await docs().remove("memberships", userId);
}
