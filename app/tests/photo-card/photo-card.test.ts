import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { InlineQueue, RecordingQueue } from "@/lib/book/queue";
import { advanceFakeJob } from "@/lib/adapters/fake/printer";
import { fakeFlatCardPrinter } from "@/lib/adapters/fake/flatCardPrinter";
import { buildCheckoutSessionParams } from "@/lib/adapters/real/stripe";
import { addPhotoCardToCart, bandIndex, computePhotoCardTotals, priceBatchLine, setPhotoCardQuantity, PhotoCardQuantityError, type PhotoCardItem } from "@/lib/shop/photoCard/cart";
import { buildPhotoCardCheckoutLines } from "@/lib/shop/photoCard/checkoutLines";
import { PHOTO_CARD_PRICE_CONFIG, type PhotoCardPriceConfig } from "@/lib/shop/photoCard/priceConfig";
import { batchJobId, enqueueOrderBatchLines, mockRender, refreshBatchJob, refreshOrderBatchJobs, runBatchJob } from "@/lib/shop/photoCard/batchJobs";
import { docs } from "@/lib/store";
import { readDB, updateDB } from "@/lib/shop/store";
import type { Order } from "@/lib/shop/types";

const base = { kind: "photo_card" as const, creationId: "d1", designVersion: 1, title: "Holiday 2026", product: "holiday_flat_5x7" as const, sizeId: "flat_5x7" as const };
const line = (quantity: number, paper: "matte" | "pearl" = "matte"): PhotoCardItem => ({ ...base, id: "pc1", addedAt: "x", quantity, paper, envelopes: "blank", delivery: { mode: "ship_to_me" } });

// A made-up config proves no price is hard-coded in logic.
const other: PhotoCardPriceConfig = {
  ...PHOTO_CARD_PRICE_CONFIG,
  phase1Quantities: { holiday_flat_5x7: [10, 25] },
  unitCentsByBand: { holiday_flat_5x7: [1000, 500, 400, 300, 200] },
  addOnUnitCents: { premium_paper: 7, ai_background: 0 },
  delivery: { ship_to_me: { orderCents: 111 } },
};

describe("photo card cart and pricing", () => {
  it("finds the band and applies the band price to every card", () => {
    expect([9, 10, 24, 25, 49, 50, 99, 100, 199, 200].map((q) => bandIndex(q))).toEqual([-1, 0, 0, 1, 1, 2, 2, 3, 3, 4]);
    const p = priceBatchLine(line(50));
    expect(p.unitCents).toBe(PHOTO_CARD_PRICE_CONFIG.unitCentsByBand.holiday_flat_5x7[2]);
    expect(p.productCents).toBe(p.unitCents * 50);
    expect(p.envelopesIncluded).toBe(true);
  });
  it("reads every price from the config", () => {
    expect(priceBatchLine(line(25), other).productCents).toBe(500 * 25);
    expect(priceBatchLine(line(25, "pearl"), other).paperCents).toBe(7 * 25);
    const t = computePhotoCardTotals([line(25)], other);
    expect(t).toMatchObject({ shippingCents: 111, totalCents: 500 * 25 + 111 });
  });
  it("charges shipping once per order and nothing for an empty cart", () => {
    const a = line(25);
    const b = { ...line(50), id: "pc2" };
    const t = computePhotoCardTotals([a, b]);
    expect(t.shippingCents).toBe(PHOTO_CARD_PRICE_CONFIG.delivery.ship_to_me.orderCents);
    expect(computePhotoCardTotals([]).totalCents).toBe(0);
  });
  it("allows only the Phase 1 quantities", () => {
    expect(() => addPhotoCardToCart([], { ...base, quantity: 24 })).toThrow(PhotoCardQuantityError);
    expect(() => addPhotoCardToCart([], { ...base, quantity: 200 })).toThrow(PhotoCardQuantityError);
    const cart = addPhotoCardToCart([], { ...base, quantity: 25 }, undefined, new Date(0), () => "pc1");
    expect(cart[0]).toMatchObject({ quantity: 25, envelopes: "blank", delivery: { mode: "ship_to_me" } });
    // Adding 25 more to the same line merges to 50 (allowed); another 25 would be 75 (refused).
    const merged = addPhotoCardToCart(cart, { ...base, quantity: 25 });
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(50);
    expect(() => addPhotoCardToCart(merged, { ...base, quantity: 25 })).toThrow(PhotoCardQuantityError);
    expect(setPhotoCardQuantity(cart, "pc1", 100).items[0].quantity).toBe(100);
    expect(setPhotoCardQuantity(cart, "pc1", 30).error).toBeInstanceOf(PhotoCardQuantityError);
  });
});

describe("photo card stripe tax lines", () => {
  it("tags print, paper and shipping lines with the config tax codes and sends no zero lines", () => {
    const lines = buildPhotoCardCheckoutLines([line(50, "pearl")]);
    expect(lines.map((l) => l.sku)).toEqual(["photo_card", "photo_card_paper", "shipping_ship_to_me"]);
    expect(lines[0].taxCode).toBe(PHOTO_CARD_PRICE_CONFIG.taxCodes.print);
    expect(lines[1].taxCode).toBe(PHOTO_CARD_PRICE_CONFIG.taxCodes.print);
    expect(lines[2]).toMatchObject({ taxCode: PHOTO_CARD_PRICE_CONFIG.taxCodes.shipping, quantity: 1 });
    expect(buildPhotoCardCheckoutLines([line(50)]).map((l) => l.sku)).toEqual(["photo_card", "shipping_ship_to_me"]);
    const sum = lines.reduce((s, l) => s + l.unitAmountCents * l.quantity, 0);
    expect(sum).toBe(computePhotoCardTotals([line(50, "pearl")]).totalCents);
  });
  it("the Stripe request marks tagged lines tax-exclusive with the code, and leaves untagged lines alone", () => {
    const p = buildCheckoutSessionParams({ checkoutId: "co", userId: "u", email: "a@example.com", successUrl: "s", cancelUrl: "c", lines: [...buildPhotoCardCheckoutLines([line(25)]), { sku: "x", description: "plain", unitAmountCents: 1, quantity: 1 }] });
    expect(p.get("line_items[0][price_data][product_data][tax_code]")).toBe("txcd_99999999");
    expect(p.get("line_items[0][price_data][tax_behavior]")).toBe("exclusive");
    expect(p.get("line_items[1][price_data][product_data][tax_code]")).toBe("txcd_92010001");
    expect(p.get("line_items[2][price_data][tax_behavior]")).toBeNull();
  });
});

describe("flat card printer fake", () => {
  beforeEach(() => {
    process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-pc-"));
  });
  it("is idempotent per line and walks to delivered with tracking", async () => {
    const seen: string[] = [];
    const p = fakeFlatCardPrinter({ onSubmit: (id) => seen.push(id) });
    const job = { orderId: "GH-ABCDEF12", lineId: "li_0001", sizeId: "flat_5x7" as const, qty: 25, files: { front: "f.pdf" }, paper: "matte", shipTo: { name: "A", line1: "1 Elm", city: "Leeds", region: "NY", postalCode: "10001", country: "US" }, email: "a@example.com" };
    const a = await p.submitBulk(job);
    const b = await p.submitBulk(job);
    expect(a.externalId).toBe(b.externalId);
    expect(seen).toHaveLength(1);
    expect((await p.status(a.externalId)).state).toBe("submitted");
    await advanceFakeJob(a.externalId);
    await advanceFakeJob(a.externalId);
    expect((await p.status(a.externalId)).trackingNumber).toBeTruthy();
    await expect(p.submitBulk({ ...job, qty: 5 })).rejects.toThrow();
  });
});

const addr = { name: "Rosa Diaz", line1: "12 Elm St", city: "Leeds", region: "NY", postalCode: "10001", country: "US" };
function paidOrder(): Order {
  return {
    id: "GH-PCORDER1", userId: "u_pc", email: "sam@example.com", stripeSessionId: "cs_1", createdAt: "x", status: "paid", history: [{ status: "paid", at: "x" }],
    items: [{ id: "li_pcline1", creationId: "d1", kind: "card", sku: "photo_card", title: "Holiday 2026", description: "50 cards", quantity: 50, productCents: 8950, postageCents: 0, printed: true, shipTo: addr, status: "paid", batch: { sizeId: "flat_5x7", designVersion: 1, paper: "matte", envelopes: "blank", delivery: "ship_to_me" } }],
    totals: { subtotalCents: 8950, postageCents: 0, methodCents: 699, taxCents: 0, totalCents: 9649 }, shippingMethod: "standard",
  };
}

describe("batch job orchestration", () => {
  beforeEach(async () => {
    process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-pc-"));
    updateDB(() => undefined);
    await docs().insertIfAbsent("orders", "GH-PCORDER1", paidOrder());
  });
  const jobId = batchJobId("GH-PCORDER1", "li_pcline1");

  it("order -> render -> submitBulk -> tracking through the queue and the order state machine", async () => {
    const submitted: string[] = [];
    const printer = fakeFlatCardPrinter({ onSubmit: (id) => submitted.push(id) });
    const deps = { printer, render: mockRender };
    const queue = new InlineQueue(async (id) => void (await runBatchJob(id, deps)));
    expect(await enqueueOrderBatchLines("GH-PCORDER1", queue)).toBe(1);

    let job = (await docs().get("batch_jobs", jobId))!;
    expect(job).toMatchObject({ step: "submitted", attempts: 1, printer: "fake" });
    expect(job.files?.front).toContain("front.pdf");
    expect(JSON.stringify(job)).not.toContain("Rosa");
    let order = (await docs().get("orders", "GH-PCORDER1"))!;
    expect(order.status).toBe("preparing");
    expect(order.items[0].fulfillment).toMatchObject({ printer: "fake", state: "submitted" });

    await advanceFakeJob(job.externalId!); // in_production
    await refreshOrderBatchJobs("GH-PCORDER1", deps);
    expect((await docs().get("orders", "GH-PCORDER1"))!.status).toBe("printing");

    await advanceFakeJob(job.externalId!); // shipped
    await refreshBatchJob(jobId, deps);
    order = (await docs().get("orders", "GH-PCORDER1"))!;
    expect(order.status).toBe("shipped");
    expect(order.items[0].fulfillment?.trackingNumber).toBeTruthy();
    expect(order.history.map((h) => h.status)).toEqual(["paid", "preparing", "printing", "shipped"]);
    expect(readDB().outbox.some((m) => m.tag === "shipped")).toBe(true);

    await advanceFakeJob(job.externalId!); // delivered
    await refreshBatchJob(jobId, deps);
    expect((await docs().get("orders", "GH-PCORDER1"))!.status).toBe("delivered");
    expect(submitted).toHaveLength(1);
    job = (await docs().get("batch_jobs", jobId))!;
    expect(job.trackingUrl).toMatch(/^https:/);
  });

  it("running or enqueueing twice does not double-print or re-render", async () => {
    const submitted: string[] = [];
    let renders = 0;
    const deps = { printer: fakeFlatCardPrinter({ onSubmit: (id) => submitted.push(id) }), render: async (c: Parameters<typeof mockRender>[0]) => (renders++, mockRender(c)) };
    const queue = new InlineQueue(async (id) => void (await runBatchJob(id, deps)));
    await enqueueOrderBatchLines("GH-PCORDER1", queue);
    await enqueueOrderBatchLines("GH-PCORDER1", queue);
    await runBatchJob(jobId, deps);
    expect(submitted).toHaveLength(1);
    expect(renders).toBe(1);
    expect((await docs().get("batch_jobs", jobId))!.attempts).toBe(1);
  });

  it("only queues; the render step runs when the queue runs the job", async () => {
    const q = new RecordingQueue();
    await enqueueOrderBatchLines("GH-PCORDER1", q);
    expect(q.ids).toEqual([jobId]);
    expect((await docs().get("batch_jobs", jobId))!.step).toBe("queued");
  });

  it("a printer failure marks the line needs_attention and a retry recovers without re-rendering", async () => {
    let renders = 0;
    const render = async (c: Parameters<typeof mockRender>[0]) => (renders++, mockRender(c));
    await enqueueOrderBatchLines("GH-PCORDER1", new RecordingQueue());
    const failed = await runBatchJob(jobId, { printer: fakeFlatCardPrinter({ failSubmit: true }), render });
    expect(failed?.step).toBe("failed");
    let order = (await docs().get("orders", "GH-PCORDER1"))!;
    expect(order.status).toBe("needs_attention");
    expect(order.items[0].note).toMatch(/print shop/);
    expect(readDB().outbox.some((m) => m.tag === "needs_attention")).toBe(true);

    const ok = await runBatchJob(jobId, { printer: fakeFlatCardPrinter(), render });
    expect(ok?.step).toBe("submitted");
    expect(renders).toBe(1);
    order = (await docs().get("orders", "GH-PCORDER1"))!;
    expect(order.status).toBe("preparing");
    expect(order.items[0].note).toBeUndefined();
  });

  it("ignores an out-of-order printer state that would move a line backwards", async () => {
    const printer = fakeFlatCardPrinter();
    const deps = { printer, render: mockRender };
    await enqueueOrderBatchLines("GH-PCORDER1", new RecordingQueue());
    const job = (await runBatchJob(jobId, deps))!;
    await advanceFakeJob(job.externalId!);
    await refreshBatchJob(jobId, deps);
    expect((await docs().get("orders", "GH-PCORDER1"))!.status).toBe("printing");
    const stale = { ...printer, status: async () => ({ state: "submitted" }) };
    await refreshBatchJob(jobId, { printer: stale });
    expect((await docs().get("orders", "GH-PCORDER1"))!.status).toBe("printing");
  });

  it("fails clearly when the order line has no address", async () => {
    await docs().mutate("orders", "GH-PCORDER1", (o) => o && { ...o, items: o.items.map((i) => ({ ...i, shipTo: undefined })) });
    await enqueueOrderBatchLines("GH-PCORDER1", new RecordingQueue());
    const r = await runBatchJob(jobId, { printer: fakeFlatCardPrinter(), render: mockRender });
    expect(r).toMatchObject({ step: "failed", error: "no ship-to address" });
  });
});
