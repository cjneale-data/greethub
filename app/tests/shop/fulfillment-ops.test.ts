import { describe, expect, it } from "vitest";
import { CHRISTMAS_2026, businessDaysBefore, findFulfillmentExceptions, orderByDate, upcomingCutoffs } from "@/lib/shop/fulfillmentOps";
import type { Order, OrderItem } from "@/lib/shop/types";

describe("holiday order-by dates", () => {
  it("counts business days back over weekends", () => {
    expect(businessDaysBefore("2026-12-14", 1)).toBe("2026-12-11"); // Monday -> Friday
    expect(businessDaysBefore("2026-12-17", 5, ["2026-12-15"])).toBe("2026-12-09");
  });

  it("derives Christmas 2026 dates from carrier send-by dates and lead times", () => {
    expect(orderByDate(CHRISTMAS_2026, "book", "standard")).toBe("2026-12-02");
    expect(orderByDate(CHRISTMAS_2026, "book", "express")).toBe("2026-12-03");
    expect(orderByDate(CHRISTMAS_2026, "card", "standard")).toBe("2026-12-10");
    expect(orderByDate(CHRISTMAS_2026, "card", "express")).toBe("2026-12-11");
  });

  it("marks passed dates and drops seasons that are over", () => {
    const mid = upcomingCutoffs(new Date("2026-12-05T12:00:00Z"));
    expect(mid.find((c) => c.kind === "book" && c.method === "standard")?.passed).toBe(true);
    expect(mid.find((c) => c.kind === "card" && c.method === "standard")?.passed).toBe(false);
    expect(upcomingCutoffs(new Date("2026-12-26T00:00:00Z"))).toEqual([]);
  });
});

const line = (over: Partial<OrderItem> = {}): OrderItem => ({
  id: "li_1", creationId: "c1", kind: "book", sku: "book_24", title: "T", description: "d", quantity: 1,
  productCents: 3900, postageCents: 599, printed: true, status: "preparing", recipientName: "Secret Name",
  shipTo: { name: "Secret Name", line1: "1 Secret St", city: "X", region: "NY", postalCode: "10001", country: "US" },
  ...over,
});
const order = (items: OrderItem[], over: Partial<Order> = {}): Order => ({
  id: "GH-1", userId: "u", email: "secret@example.com", stripeSessionId: "s", createdAt: "2026-11-01T00:00:00Z",
  status: "preparing", history: [{ status: "paid", at: "2026-11-01T00:00:00Z" }], items,
  totals: { subtotalCents: 0, postageCents: 0, methodCents: 0, taxCents: 0, totalCents: 0 }, shippingMethod: "standard", ...over,
});
const sub = (at: string, state = "IN_PRODUCTION") => ({ printer: "lulu" as const, externalId: "L1", state, submittedAt: at });

describe("fulfillment exception list", () => {
  const now = new Date("2026-11-20T00:00:00Z");

  it("flags paid lines never sent to the printer, and printer rejections", () => {
    const ex = findFulfillmentExceptions([order([line({ status: "paid" }), line({ id: "li_2", status: "needs_attention", fulfillment: sub("2026-11-19T00:00:00Z", "REJECTED") })])], now);
    expect(ex.map((e) => e.code)).toEqual(["not_submitted", "needs_attention"]);
    expect(ex[1].playbook).toMatch(/A2/);
  });

  it("flags books not shipped after the threshold but not cards within theirs", () => {
    const ex = findFulfillmentExceptions([order([line({ fulfillment: sub("2026-11-05T00:00:00Z") }), line({ id: "li_c", kind: "card", fulfillment: sub("2026-11-16T00:00:00Z") })])], now);
    expect(ex.map((e) => [e.lineId, e.code])).toEqual([["li_1", "not_shipped"]]);
  });

  it("flags an arrive-by date at risk before the usual late threshold", () => {
    const ex = findFulfillmentExceptions([order([line({ fulfillment: sub("2026-11-18T00:00:00Z") })], { deliveryDate: "2026-11-23" })], now);
    expect(ex[0].code).toBe("arrive_by_at_risk");
  });

  it("flags shipped lines with no tracking or no delivery after the check window", () => {
    const shipped = line({ status: "shipped", fulfillment: sub("2026-11-02T00:00:00Z", "SHIPPED") });
    const ex = findFulfillmentExceptions([order([shipped], { history: [{ status: "shipped", at: "2026-11-05T00:00:00Z" }] })], now);
    expect(ex.map((e) => e.code)).toEqual(["shipped_no_tracking", "shipped_check_tracking"]);
  });

  it("skips digital, delivered and healthy lines, and never returns customer details", () => {
    const ex = findFulfillmentExceptions([order([line({ printed: false, status: "paid" }), line({ id: "li_d", status: "delivered" }), line({ id: "li_ok", fulfillment: sub("2026-11-18T00:00:00Z") }), line({ id: "li_x", status: "paid" })])], now);
    expect(ex.map((e) => e.lineId)).toEqual(["li_x"]);
    expect(JSON.stringify(ex)).not.toMatch(/Secret|secret@/);
  });
});
