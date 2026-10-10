import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { buildFakeSessionEvent, signFakeEvent } from "@/lib/adapters/fake/payments";
import { advanceFakeJob } from "@/lib/adapters/fake/printer";
import { startCheckout } from "@/lib/shop/checkoutService";
import { addItem } from "@/lib/shop/cartService";
import { applyPrinterWebhook, handlePaymentWebhook, refreshOrder } from "@/lib/shop/orderService";
import { deleteAccount, exportUserData, getOrder } from "@/lib/shop/accountService";
import { readDB, updateDB } from "@/lib/shop/store";
import { validateAddress } from "@/lib/shop/address";
import { signSession, verifySession, safeNext } from "@/lib/shop/session";

const user = { userId: "u_test", email: "sam@example.com" };
const addr = { name: "Rosa Diaz", line1: "12 Elm St", city: "Leeds", region: "NY", postalCode: "10001", country: "US" };

beforeEach(() => {
  process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-test-"));
  updateDB((db) => {
    db.users[user.userId] = { id: user.userId, email: user.email, createdAt: "x", rerolls: { left: 5, allowance: 5 } };
  });
});

async function checkoutWithCard() {
  addItem(user.userId, { kind: "card", creationId: "c1", title: "Rosa card", recipientName: "Rosa", format: "mailed", mailTo: "recipient" });
  const itemId = readDB().carts[user.userId][0].id;
  const r = await startCheckout(user, { shippingMethod: "standard", proofApproved: true, shipments: { [itemId]: addr } }, "http://localhost:3103");
  if (!r.ok) throw new Error(r.error);
  const pending = readDB().checkouts[r.checkoutId];
  return { pending, itemId };
}

const pay = (pending: { sessionId?: string; id: string; totals: { totalCents: number } }, eventId: string) =>
  signFakeEvent(buildFakeSessionEvent({ sessionId: pending.sessionId!, checkoutId: pending.id, email: user.email, amountTotal: pending.totals.totalCents, paid: true, eventId }));

describe("checkout validation", () => {
  it("blocks missing proof approval, empty carts and bad addresses", async () => {
    expect((await startCheckout(user, {}, "http://x")).ok).toBe(false);
    addItem(user.userId, { kind: "card", creationId: "c1", title: "t", format: "mailed" });
    const noApproval = await startCheckout(user, { shipments: {} }, "http://x");
    expect(noApproval).toMatchObject({ ok: false, status: 400 });
    const itemId = readDB().carts[user.userId][0].id;
    const bad = await startCheckout(user, { proofApproved: true, shipments: { [itemId]: { ...addr, line1: "PO Box 12" } } }, "http://x");
    expect(bad).toMatchObject({ ok: false, status: 422 });
    expect((bad as { fieldErrors: Record<string, Record<string, string>> }).fieldErrors[itemId].line1).toMatch(/PO boxes/);
  });
  it("validates addresses", () => {
    expect(validateAddress(addr).ok).toBe(true);
    expect(validateAddress({ ...addr, postalCode: "ABC" }).ok).toBe(false);
    expect(validateAddress({ ...addr, country: "GB" }).ok).toBe(false);
    expect(validateAddress({}).ok).toBe(false);
  });
});

describe("payment webhook to order", () => {
  it("rejects a bad signature", async () => {
    const { pending } = await checkoutWithCard();
    const { body } = pay(pending, "evt_bad");
    expect((await handlePaymentWebhook(body, "t=1,v1=00")).status).toBe(400);
    expect(Object.keys(readDB().orders)).toHaveLength(0);
  });

  it("creates one order, submits to the printer and emails, even when Stripe retries", async () => {
    const { pending } = await checkoutWithCard();
    const { body, signature } = pay(pending, "evt_1");
    const first = await handlePaymentWebhook(body, signature);
    expect(first.status).toBe(200);
    const retry = await handlePaymentWebhook(body, signature);
    expect(retry.body.duplicate).toBe(true);
    // A different event id for the same session must still not create a second order.
    const second = pay(pending, "evt_2");
    await handlePaymentWebhook(second.body, second.signature);
    const db = readDB();
    expect(Object.keys(db.orders)).toHaveLength(1);
    const order = Object.values(db.orders)[0];
    expect(order.status).toBe("preparing");
    expect(order.items[0].fulfillment?.printer).toBe("prodigi");
    expect(order.items[0].fulfillment?.externalId).toMatch(/^FAKE-PRODIGI/);
    expect(db.carts[user.userId]).toHaveLength(0);
    expect(order.consent?.proofApproved).toBe(true);
    expect(db.outbox.filter((m) => m.tag === "order_confirmed")).toHaveLength(1);
  });

  it("refuses to fulfil when the paid amount does not match", async () => {
    const { pending } = await checkoutWithCard();
    const ev = signFakeEvent(buildFakeSessionEvent({ sessionId: pending.sessionId!, checkoutId: pending.id, email: user.email, amountTotal: 1, paid: true, eventId: "evt_m" }));
    const r = await handlePaymentWebhook(ev.body, ev.signature);
    expect(r.body.mismatch).toBe(true);
    expect(Object.keys(readDB().orders)).toHaveLength(0);
  });

  it("ignores unpaid completions and other event types", async () => {
    const { pending } = await checkoutWithCard();
    const ev = signFakeEvent(buildFakeSessionEvent({ sessionId: pending.sessionId!, checkoutId: pending.id, email: user.email, amountTotal: pending.totals.totalCents, paid: false, eventId: "evt_u" }));
    await handlePaymentWebhook(ev.body, ev.signature);
    expect(Object.keys(readDB().orders)).toHaveLength(0);
  });

  it("walks printing to shipped to delivered with tracking and a shipped email", async () => {
    const { pending } = await checkoutWithCard();
    const p = pay(pending, "evt_w");
    await handlePaymentWebhook(p.body, p.signature);
    const id = Object.keys(readDB().orders)[0];
    const ext = readDB().orders[id].items[0].fulfillment!.externalId;
    advanceFakeJob(ext);
    expect((await refreshOrder(id))!.status).toBe("printing");
    advanceFakeJob(ext);
    const shipped = (await refreshOrder(id))!;
    expect(shipped.status).toBe("shipped");
    expect(shipped.items[0].fulfillment?.trackingNumber).toMatch(/^FAKE/);
    expect(readDB().outbox.filter((m) => m.tag === "shipped")).toHaveLength(1);
    await refreshOrder(id);
    expect(readDB().outbox.filter((m) => m.tag === "shipped")).toHaveLength(1);
    advanceFakeJob(ext);
    const done = (await refreshOrder(id))!;
    expect(done.status).toBe("delivered");
    expect(done.history.map((h) => h.status)).toEqual(["paid", "preparing", "printing", "shipped", "delivered"]);
  });

  it("applies a printer webhook by external id", async () => {
    const { pending } = await checkoutWithCard();
    const p = pay(pending, "evt_pw");
    await handlePaymentWebhook(p.body, p.signature);
    const o = Object.values(readDB().orders)[0];
    const r = await applyPrinterWebhook(o.items[0].fulfillment!.externalId, "SHIPPED", { trackingNumber: "T1", carrier: "UPS" });
    expect(r?.status).toBe("shipped");
    expect(r?.items[0].fulfillment?.trackingNumber).toBe("T1");
  });

  it("flags a print file problem as needs_attention", async () => {
    addItem(user.userId, { kind: "card", creationId: "c2", title: "needs-fix card", format: "mailed" });
    const itemId = readDB().carts[user.userId][0].id;
    const r = await startCheckout(user, { proofApproved: true, shipments: { [itemId]: addr } }, "http://x");
    if (!r.ok) throw new Error(r.error);
    const pending = readDB().checkouts[r.checkoutId];
    const p = pay(pending, "evt_na");
    await handlePaymentWebhook(p.body, p.signature);
    expect(Object.values(readDB().orders)[0].status).toBe("needs_attention");
  });
});

describe("account data", () => {
  it("exports, then deletes the account but keeps a scrubbed order record", async () => {
    const { pending } = await checkoutWithCard();
    const p = pay(pending, "evt_d");
    await handlePaymentWebhook(p.body, p.signature);
    const id = Object.keys(readDB().orders)[0];
    const exp = exportUserData(user.userId);
    expect(exp.orders).toHaveLength(1);
    expect(exp.profile?.email).toBe(user.email);

    deleteAccount(user.userId);
    const db = readDB();
    expect(db.users[user.userId]).toBeUndefined();
    expect(getOrder(user.userId, id)?.accountDeleted).toBe(true);
    // Open order keeps its ship-to until delivered, then it is scrubbed.
    const ext = db.orders[id].items[0].fulfillment!.externalId;
    advanceFakeJob(ext);
    advanceFakeJob(ext);
    advanceFakeJob(ext);
    const done = (await refreshOrder(id))!;
    expect(done.status).toBe("delivered");
    expect(done.scrubbed).toBe(true);
    expect(done.items[0].shipTo).toBeUndefined();
    expect(done.email).toBe("deleted");
  });
});

describe("session cookie", () => {
  it("signs, verifies and rejects tampering or expiry", () => {
    const v = signSession("u1", "a@b.co", 1000);
    expect(verifySession(v, 2000)).toEqual({ uid: "u1", email: "a@b.co" });
    expect(verifySession(v.slice(0, -2) + "xx", 2000)).toBeNull();
    expect(verifySession(v, 1000 + 1000 * 60 * 60 * 24 * 31)).toBeNull();
    expect(verifySession(undefined)).toBeNull();
  });
  it("only allows same-site redirects", () => {
    expect(safeNext("/orders/1")).toBe("/orders/1");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
  });
});
