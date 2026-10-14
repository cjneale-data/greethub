import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CardWritingSchema, LAUNCH_FEATURES, MEMBERSHIP_SPEC, tierById } from "@greethub/shared";
import { setDocStoreForTest } from "@/lib/store";
import { signFakeEvent } from "@/lib/adapters/fake/payments";
import { handlePaymentWebhook } from "@/lib/shop/orderService";
import { deleteAccount, exportUserData } from "@/lib/shop/accountService";
import { buildSubscriptionCheckoutParams } from "@/lib/membership/billing";
import {
  consumeQuota, effectiveTier, featuresFor, getMembership, membershipEnabled, membershipView, periodKey, setCancel, startMembershipCheckout,
} from "@/lib/membership/service";
import { addSignature, createCustomStyle, setDefaults, writingOrderBlock, WritingError } from "@/lib/writing/service";
import { filledSheet } from "./writing/sheet-fixture";
import { makeMember } from "./membership-fixture";

const U = "u_member";
const user = { userId: U, email: "member@example.com" };
const DAY = 86_400_000;

beforeEach(() => {
  process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-member-"));
  setDocStoreForTest(null);
  delete process.env.GREETHUB_MEMBERSHIP;
});
afterEach(() => {
  delete process.env.GREETHUB_MEMBERSHIP;
});

/** What Stripe sends for a subscription, signed with the local fake secret so the real verification runs. */
function subEvent(type: string, over: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return signFakeEvent({
    id: `evt_${type}_${Math.random().toString(36).slice(2, 10)}`,
    object: "event",
    type,
    data: { object: { id: "sub_123", object: "subscription", customer: "cus_123", status: "active", cancel_at_period_end: false, current_period_end: now + 30 * 86_400, metadata: { user_id: U, tier: "plus", interval: "month" }, ...over } as never },
  });
}

describe("the CFO spec", () => {
  it("has the same feature keys on every tier and matches the published prices", () => {
    const keys = Object.keys(MEMBERSHIP_SPEC.tiers[0].features).sort();
    for (const t of MEMBERSHIP_SPEC.tiers) expect(Object.keys(t.features).sort()).toEqual(keys);
    expect(Object.keys(LAUNCH_FEATURES).sort()).toEqual(keys);
    expect(tierById("plus")).toMatchObject({ monthlyCents: 399, annualCents: 3599, trialDays: 14 });
    expect(tierById("card_club")).toMatchObject({ monthlyCents: 999, annualCents: 9900 });
  });
});

describe("switch", () => {
  it("is on in local and test runs, and can be forced either way", () => {
    expect(membershipEnabled()).toBe(true);
    expect(membershipEnabled({ GREETHUB_MEMBERSHIP: "0", NODE_ENV: "test" } as never)).toBe(false);
    expect(membershipEnabled({ NODE_ENV: "production" } as never)).toBe(false);
    expect(membershipEnabled({ NODE_ENV: "production", GREETHUB_MEMBERSHIP: "1" } as never)).toBe(true);
  });

  it("gives everyone today's features while off, so switching it off never takes anything away", async () => {
    process.env.GREETHUB_MEMBERSHIP = "0";
    expect(await featuresFor(U)).toEqual(LAUNCH_FEATURES);
    await expect(startMembershipCheckout(user, { tier: "plus", interval: "month" }, "http://x")).rejects.toMatchObject({ code: "not_open" });
    // Saved signatures still work for a free account while memberships are off.
    await expect(addSignature(U, { kind: "typed", text: "Sam", fontId: "allura" })).resolves.toBeTruthy();
  });
});

describe("plan state", () => {
  const rec = (over: object) => ({ userId: U, tier: "plus", interval: "month" as const, status: "active" as const, currentPeriodEnd: new Date(Date.now() + 5 * DAY).toISOString(), cancelAtPeriodEnd: false, usage: { period: "", counts: {} }, history: [], updatedAt: "", ...over });

  it("keeps perks through the period after a cancel, through the past-due grace, then drops to free", () => {
    expect(effectiveTier(undefined)).toBe("free");
    expect(effectiveTier(rec({}))).toBe("plus");
    expect(effectiveTier(rec({ status: "trialing" }))).toBe("plus");
    expect(effectiveTier(rec({ status: "canceled" }))).toBe("plus");
    expect(effectiveTier(rec({ status: "canceled", currentPeriodEnd: new Date(Date.now() - DAY).toISOString() }))).toBe("free");
    expect(effectiveTier(rec({ status: "past_due", currentPeriodEnd: new Date(Date.now() - 3 * DAY).toISOString() }))).toBe("plus");
    expect(effectiveTier(rec({ status: "past_due", currentPeriodEnd: new Date(Date.now() - 8 * DAY).toISOString() }))).toBe("free");
    expect(effectiveTier(rec({ status: "incomplete" }))).toBe("free");
  });

  it("slices quota periods monthly from the billing day, even on a yearly plan", () => {
    const m = rec({ interval: "year", currentPeriodEnd: "2027-03-20T00:00:00.000Z" });
    expect(periodKey(m, new Date("2026-11-25T12:00:00Z"))).toBe("bp-2026-11-20");
    expect(periodKey(m, new Date("2026-11-19T12:00:00Z"))).toBe("bp-2026-10-20");
    expect(periodKey(undefined, new Date("2026-11-19T12:00:00Z"))).toBe("2026-11");
  });
});

describe("quotas", () => {
  it("counts 'Write it for me' and stops at the free limit; Plus raises it", async () => {
    for (let i = 0; i < 10; i++) expect((await consumeQuota(U, "ai_message_writes_per_month")).ok).toBe(true);
    const over = await consumeQuota(U, "ai_message_writes_per_month");
    expect(over).toEqual({ ok: false, used: 10, limit: 10 });
    await makeMember(U, "plus");
    expect(await consumeQuota(U, "ai_message_writes_per_month")).toMatchObject({ ok: true, limit: 100 });
  });
});

describe("free plan limits on handwriting", () => {
  it("allows one preview style, no saved signatures and no 'every new card', each with an upgrade message", async () => {
    await expect(addSignature(U, { kind: "typed", text: "Sam", fontId: "allura" })).rejects.toMatchObject({ status: 402, code: "upgrade_required" });
    await expect(setDefaults(U, { applyToNewCards: true })).rejects.toMatchObject({ status: 402 });
    await createCustomStyle(U, { data: await filledSheet() });
    await expect(createCustomStyle(U, { data: await filledSheet() })).rejects.toMatchObject({ status: 402, code: "upgrade_required" });
    const own = CardWritingSchema.parse({ message: "handwritten", styleId: "custom_abc123def4" });
    expect(await writingOrderBlock(U, own)).toMatch(/Plus/);
    await makeMember(U, "plus");
    expect(await writingOrderBlock(U, own)).toBeNull();
    await expect(addSignature(U, { kind: "typed", text: "Sam", fontId: "allura" })).resolves.toBeTruthy();
  }, 30_000);

  it("keeps a downgraded member's signatures but blocks new orders that use them", async () => {
    await makeMember(U, "plus");
    const p = await addSignature(U, { kind: "typed", text: "Sam", fontId: "allura" });
    await makeMember(U, "plus", { status: "canceled", currentPeriodEnd: new Date(Date.now() - DAY).toISOString() });
    expect((await membershipView(U)).tier).toBe("free");
    const sig = CardWritingSchema.parse({ signature: { kind: "saved", signatureId: p.signatures[0].id } });
    expect(await writingOrderBlock(U, sig)).toMatch(/Plus/);
    const { getWriting } = await import("@/lib/writing/service");
    expect((await getWriting(U)).signatures).toHaveLength(1);
  });
});

describe("buying and Stripe events", () => {
  it("only sells purchasable plans, once, and sends local checkout to the fake page with the trial", async () => {
    await expect(startMembershipCheckout(user, { tier: "card_club", interval: "month" }, "http://x")).rejects.toMatchObject({ code: "not_purchasable" });
    await expect(startMembershipCheckout(user, { tier: "free", interval: "month" }, "http://x")).rejects.toMatchObject({ code: "not_purchasable" });
    const { url } = await startMembershipCheckout(user, { tier: "plus", interval: "year" }, "http://x");
    expect(url).toBe("/account/membership/fake-checkout?tier=plus&interval=year&trial=14");
    await makeMember(U, "plus");
    await expect(startMembershipCheckout(user, { tier: "plus", interval: "month" }, "http://x")).rejects.toMatchObject({ code: "already_member" });
  });

  it("builds a Stripe subscription checkout with the trial asking for no card", () => {
    const p = buildSubscriptionCheckoutParams({ userId: U, email: "m@example.com", tierId: "plus", tierName: "Plus", interval: "month", amountCents: 399, trialDays: 14, successUrl: "s", cancelUrl: "c" });
    expect(p.get("mode")).toBe("subscription");
    expect(p.get("line_items[0][price_data][recurring][interval]")).toBe("month");
    expect(p.get("line_items[0][price_data][unit_amount]")).toBe("399");
    expect(p.get("subscription_data[trial_period_days]")).toBe("14");
    expect(p.get("payment_method_collection")).toBe("if_required");
    expect(p.get("subscription_data[trial_settings][end_behavior][missing_payment_method]")).toBe("cancel");
    expect(p.get("subscription_data[metadata][user_id]")).toBe(U);
  });

  it("follows a subscription through Stripe's events on the shared webhook, idempotently", async () => {
    const created = subEvent("customer.subscription.created", { status: "trialing" });
    expect((await handlePaymentWebhook(created.body, created.signature)).status).toBe(200);
    expect(await getMembership(U)).toMatchObject({ tier: "plus", status: "trialing", stripeCustomerId: "cus_123", stripeSubscriptionId: "sub_123" });
    expect((await handlePaymentWebhook(created.body, created.signature)).body).toMatchObject({ duplicate: true });
    // Later events may lack metadata: the member is found by the Stripe subscription id.
    const updated = subEvent("customer.subscription.updated", { cancel_at_period_end: true, metadata: {} });
    await handlePaymentWebhook(updated.body, updated.signature);
    expect(await getMembership(U)).toMatchObject({ cancelAtPeriodEnd: true, status: "active" });
    expect((await membershipView(U)).tier).toBe("plus");
    const deleted = subEvent("customer.subscription.deleted", { status: "canceled", metadata: {} });
    await handlePaymentWebhook(deleted.body, deleted.signature);
    expect((await membershipView(U)).tier).toBe("free");
    expect((await getMembership(U))!.history.map((h) => h.event)).toEqual(["subscription_created", "subscription_updated", "subscription_deleted"]);
  });

  it("does not treat a subscription checkout as a card or book order", async () => {
    const ev = signFakeEvent({ id: "evt_cs_sub", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_sub", object: "checkout.session", mode: "subscription", payment_status: "paid", metadata: { user_id: U } } as never } });
    expect((await handlePaymentWebhook(ev.body, ev.signature)).body).toMatchObject({ membershipCheckout: true });
  });

  it("cancels at period end and turns renewal back on", async () => {
    await makeMember(U, "plus");
    await setCancel(U, true);
    expect((await membershipView(U)).subscription).toMatchObject({ cancelAtPeriodEnd: true });
    await setCancel(U, false);
    expect((await membershipView(U)).subscription).toMatchObject({ cancelAtPeriodEnd: false });
  });
});

describe("export and deletion", () => {
  it("exports the membership and its history, and deleting the account removes it", async () => {
    const created = subEvent("customer.subscription.created");
    await handlePaymentWebhook(created.body, created.signature);
    expect((await exportUserData(U)).membership).toMatchObject({ tier: "plus", status: "active" });
    await deleteAccount(U);
    expect(await getMembership(U)).toBeUndefined();
  });
});

describe("rejects bad input", () => {
  it("keeps WritingError for storage limits on paid plans", () => {
    expect(new WritingError(422, "too_many", "x").status).toBe(422);
  });
});
