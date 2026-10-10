/** Order state machine. Pure: no IO, so it is unit-tested and shared by the webhook, printer updates and the UI. */

export const ORDER_STATUSES = ["paid", "preparing", "printing", "shipped", "delivered", "needs_attention", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Paid",
  preparing: "Preparing",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
  needs_attention: "Needs attention",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  paid: ["preparing", "delivered", "needs_attention", "cancelled", "refunded"],
  preparing: ["printing", "needs_attention", "cancelled", "refunded"],
  printing: ["shipped", "needs_attention", "refunded"],
  shipped: ["delivered", "needs_attention", "refunded"],
  delivered: ["refunded"],
  needs_attention: ["preparing", "printing", "cancelled", "refunded"],
  cancelled: [],
  refunded: [],
};

export const TERMINAL: OrderStatus[] = ["delivered", "cancelled", "refunded"];
export const isTerminal = (s: OrderStatus) => TERMINAL.includes(s);
export const isInProgress = (s: OrderStatus) => !isTerminal(s);

export class InvalidTransitionError extends Error {
  constructor(public from: OrderStatus, public to: OrderStatus) {
    super(`Order cannot go from ${from} to ${to}`);
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

export type StatusEvent = { status: OrderStatus; at: string; note?: string };

/** Returns the new status and the history with the event appended. Same-status calls are no-ops (webhook retries). */
export function applyTransition(current: OrderStatus, history: StatusEvent[], to: OrderStatus, now: Date, note?: string): { status: OrderStatus; history: StatusEvent[] } {
  if (current === to) return { status: current, history };
  if (!canTransition(current, to)) throw new InvalidTransitionError(current, to);
  return { status: to, history: [...history, { status: to, at: now.toISOString(), ...(note ? { note } : {}) }] };
}

const FLOW: OrderStatus[] = ["paid", "preparing", "printing", "shipped", "delivered"];

/** Walks forward through the happy path, one step at a time, from `from` to `to`. Used when a printer jumps ahead. */
export function pathTo(from: OrderStatus, to: OrderStatus): OrderStatus[] {
  const a = FLOW.indexOf(from);
  const b = FLOW.indexOf(to);
  if (a < 0 || b < 0 || b <= a) return canTransition(from, to) ? [to] : [];
  return FLOW.slice(a + 1, b + 1);
}

/** The order-level status from its items' statuses: the slowest active item sets the pace; any problem shows first. */
export function aggregateStatus(items: OrderStatus[]): OrderStatus {
  if (items.length === 0) return "paid";
  if (items.includes("needs_attention")) return "needs_attention";
  const live = items.filter((s) => s !== "cancelled" && s !== "refunded");
  if (live.length === 0) return items.every((s) => s === "refunded") ? "refunded" : items.includes("refunded") ? "refunded" : "cancelled";
  return live.reduce((slowest, s) => (FLOW.indexOf(s) < FLOW.indexOf(slowest) ? s : slowest));
}

/** Map a raw printer state (Lulu print-job status names, Prodigi stage names, or our fake ones) to our status. */
export function mapPrinterState(raw: string): OrderStatus | null {
  const s = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (s) {
    // Lulu: CREATED, UNPAID, PAYMENT_IN_PROGRESS, PRODUCTION_READY, PRODUCTION_DELAYED, IN_PRODUCTION, SHIPPED, REJECTED, CANCELED
    case "created":
    case "unpaid":
    case "payment_in_progress":
    case "production_ready":
    case "production_delayed":
    case "inprogress":
    case "in_progress":
    case "submitted":
      return "preparing";
    case "in_production":
    case "printing":
    case "engraving":
      return "printing";
    case "shipped":
    case "complete":
    case "completed":
      return "shipped";
    case "delivered":
      return "delivered";
    case "rejected":
    case "error":
    case "failed":
    case "on_hold":
      return "needs_attention";
    case "canceled":
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}
