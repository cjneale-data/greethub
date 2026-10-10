import { describe, expect, it } from "vitest";
import { InvalidTransitionError, aggregateStatus, applyTransition, canTransition, mapPrinterState, pathTo, type OrderStatus, type StatusEvent } from "@/lib/shop/orderState";

const now = new Date("2026-10-10T12:00:00Z");

describe("order state machine", () => {
  it("allows the happy path and records history", () => {
    let cur: { status: OrderStatus; history: StatusEvent[] } = { status: "paid", history: [{ status: "paid", at: "x" }] };
    for (const to of ["preparing", "printing", "shipped", "delivered"] as const) cur = applyTransition(cur.status, cur.history, to, now);
    expect(cur.status).toBe("delivered");
    expect(cur.history.map((h) => h.status)).toEqual(["paid", "preparing", "printing", "shipped", "delivered"]);
  });
  it("rejects illegal jumps and leaving terminal states", () => {
    expect(() => applyTransition("paid", [], "shipped", now)).toThrow(InvalidTransitionError);
    expect(canTransition("delivered", "printing")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
    expect(canTransition("printing", "cancelled")).toBe(false);
  });
  it("same-status is a no-op (webhook retries)", () => {
    expect(applyTransition("printing", [], "printing", now).history).toHaveLength(0);
  });
  it("needs_attention can recover", () => {
    expect(canTransition("preparing", "needs_attention")).toBe(true);
    expect(canTransition("needs_attention", "printing")).toBe(true);
  });
  it("walks forward when a printer jumps ahead", () => {
    expect(pathTo("preparing", "shipped")).toEqual(["printing", "shipped"]);
  });
  it("aggregates line statuses", () => {
    expect(aggregateStatus(["shipped", "printing"])).toBe("printing");
    expect(aggregateStatus(["delivered", "delivered"])).toBe("delivered");
    expect(aggregateStatus(["delivered", "needs_attention"])).toBe("needs_attention");
    expect(aggregateStatus(["cancelled", "shipped"])).toBe("shipped");
    expect(aggregateStatus(["cancelled", "cancelled"])).toBe("cancelled");
  });
  it("maps printer states", () => {
    expect(mapPrinterState("IN_PRODUCTION")).toBe("printing");
    expect(mapPrinterState("SHIPPED")).toBe("shipped");
    expect(mapPrinterState("REJECTED")).toBe("needs_attention");
    expect(mapPrinterState("CANCELED")).toBe("cancelled");
    expect(mapPrinterState("InProgress")).toBe("preparing");
    expect(mapPrinterState("???")).toBeNull();
  });
});
