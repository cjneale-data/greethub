import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { setDocStoreForTest, type DocStore } from "@/lib/store";
import { supabaseDocStore } from "@/lib/store/supabaseDocs";
import { fileDocStore } from "@/lib/shop/store";
import { buildFakeSessionEvent, signFakeEvent } from "@/lib/adapters/fake/payments";
import { addItem, getCartItems } from "@/lib/shop/cartService";
import { startCheckout } from "@/lib/shop/checkoutService";
import { handlePaymentWebhook } from "@/lib/shop/orderService";
import { deleteAccount, getUser, listOrders } from "@/lib/shop/accountService";
import { ensureUser, mergeGuestInto } from "@/lib/shop/accounts";
import type { Order, UserRecord } from "@/lib/shop/types";

/**
 * One contract for both stores. The Supabase run needs a database with supabase/migrations applied, e.g. the local
 * stack (`npx supabase start`): set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY. Without them it is skipped.
 */
const sbUrl = process.env.SUPABASE_TEST_URL;
const sbKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const run = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const backends: { name: string; make: () => DocStore; enabled: boolean }[] = [
  { name: "file", make: () => fileDocStore, enabled: true },
  { name: "supabase", make: () => supabaseDocStore(createClient(sbUrl!, sbKey!, { auth: { persistSession: false } })), enabled: !!(sbUrl && sbKey) },
];

const user = (id: string): UserRecord => ({ id, email: `${id}@example.com`, createdAt: new Date().toISOString(), rerolls: { left: 5, allowance: 5 } });

for (const b of backends) {
  describe.skipIf(!b.enabled)(`DocStore contract: ${b.name}`, () => {
    let store: DocStore;
    const id = (s: string) => `${run}_${s}`;

    beforeEach(() => {
      process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-docs-"));
      store = b.make();
      setDocStoreForTest(store);
    });
    afterAll(() => setDocStoreForTest(null));

    it("creates, reads, updates and deletes through mutate", async () => {
      const k = id("u1");
      expect(await store.get("users", k)).toBeUndefined();
      await store.mutate("users", k, (cur) => cur ?? user(k));
      expect((await store.get("users", k))?.email).toBe(`${k}@example.com`);
      await store.mutate("users", k, (cur) => cur && { ...cur, firstName: "Sam" });
      expect((await store.get("users", k))?.firstName).toBe("Sam");
      await store.mutate("users", k, () => undefined);
      expect(await store.get("users", k)).toBeUndefined();
    });

    it("insertIfAbsent claims an id once", async () => {
      const k = id("ev1");
      expect(await store.insertIfAbsent("processed_events", k, { at: "x" })).toBe(true);
      expect(await store.insertIfAbsent("processed_events", k, { at: "y" })).toBe(false);
      expect(await store.get("processed_events", k)).toBeTruthy();
    });

    it("finds by owner and by ref, and removes by owner", async () => {
      const owner = id("owner");
      const order = { id: id("GH1"), userId: owner, stripeSessionId: id("cs1"), items: [{ fulfillment: { externalId: id("ext1") } }] } as unknown as Order;
      await store.insertIfAbsent("orders", order.id, order);
      expect((await store.find("orders", { owner })).map((o) => o.id)).toEqual([order.id]);
      expect((await store.find("orders", { ref: id("ext1") })).map((o) => o.id)).toEqual([order.id]);
      expect(await store.find("orders", { ref: id("nope") })).toEqual([]);
      await store.insertIfAbsent("delete_tokens", id("tok1"), { userId: owner, expiresAt: 1 });
      await store.insertIfAbsent("delete_tokens", id("tok2"), { userId: owner, expiresAt: 1 });
      await store.removeByOwner("delete_tokens", owner);
      expect(await store.find("delete_tokens", { owner })).toEqual([]);
      await store.remove("orders", order.id);
    });

    it("does not lose concurrent updates to one row", async () => {
      const k = id("cart");
      await Promise.all(
        Array.from({ length: 8 }, (_, n) =>
          store.mutate("carts", k, (cur) => [...(cur ?? []), { id: `li${n}` } as never]),
        ),
      );
      expect((await store.get("carts", k))?.length).toBe(8);
      await store.remove("carts", k);
    });

    it("runs checkout, payment and delete-my-data end to end", async () => {
      const u = { userId: await ensureUser(`${run}-buyer-${b.name}@example.com`, true), email: `${run}-buyer-${b.name}@example.com` };
      expect((await getUser(u.userId))?.acceptance?.ageConfirmed).toBe(true);
      const guest = `g_${run.replace(/[^0-9a-f]/g, "0").padEnd(16, "0").slice(0, 16)}`;
      await addItem(guest, { kind: "card", creationId: "c1", title: "Rosa card", recipientName: "Rosa", format: "mailed", mailTo: "recipient" });
      await mergeGuestInto(guest, u.userId);
      const cart = await getCartItems(u.userId);
      expect(cart).toHaveLength(1);
      expect(await getCartItems(guest)).toEqual([]);

      const addr = { name: "Rosa Diaz", line1: "12 Elm St", city: "Leeds", region: "NY", postalCode: "10001", country: "US" };
      const r = await startCheckout(u, { shippingMethod: "standard", proofApproved: true, shipments: { [cart[0].id]: addr }, saveAddresses: [{ label: "Rosa", address: addr }] }, "http://localhost:3000");
      if (!r.ok) throw new Error(r.error);
      const pending = (await store.get("checkouts", r.checkoutId))!;
      const ev = signFakeEvent(buildFakeSessionEvent({ sessionId: pending.sessionId!, checkoutId: pending.id, email: u.email, amountTotal: pending.totals.totalCents, paid: true, eventId: `${run}_evt_${b.name}` }));
      expect((await handlePaymentWebhook(ev.body, ev.signature)).status).toBe(200);
      expect((await handlePaymentWebhook(ev.body, ev.signature)).body.duplicate).toBe(true);

      const orders = await listOrders(u.userId);
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe("preparing");
      expect(await getCartItems(u.userId)).toEqual([]);
      expect((await store.get("addresses", u.userId))?.map((a) => a.label)).toEqual(["Rosa"]);

      await deleteAccount(u.userId);
      expect(await getUser(u.userId)).toBeUndefined();
      expect(await store.get("addresses", u.userId)).toBeUndefined();
      expect((await store.get("orders", orders[0].id))?.accountDeleted).toBe(true);
    });
  });
}
