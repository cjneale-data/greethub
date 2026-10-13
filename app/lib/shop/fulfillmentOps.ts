/**
 * Fulfillment operations: holiday order-by dates and the stuck/late order list.
 * Pure functions (no IO) so they are unit-tested; the admin route reads the store and calls them.
 * Owner of the numbers: Fulfillment (docs/ops/). Every lead time here is an estimate until printer sandbox and
 * first live orders give real data. Update the inputs, not the dates: the dates are derived.
 */
import type { ShippingMethodId } from "@greethub/shared";
import type { Order } from "./types";

type Kind = "book" | "card";

/* ---------- business days ---------- */

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);

function isBusinessDay(d: Date, holidays: readonly string[]): boolean {
  const day = d.getUTCDay();
  return day !== 0 && day !== 6 && !holidays.includes(ymd(d));
}

/** The date `n` business days before `date` (YYYY-MM-DD). If `date` is not a business day, counting starts from it anyway. */
export function businessDaysBefore(date: string, n: number, holidays: readonly string[] = []): string {
  const d = parse(date);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (isBusinessDay(d, holidays)) left -= 1;
  }
  return ymd(d);
}

/** Latest business day on or before `date`. */
export function lastBusinessDayOnOrBefore(date: string, holidays: readonly string[] = []): string {
  const d = parse(date);
  while (!isBusinessDay(d, holidays)) d.setUTCDate(d.getUTCDate() - 1);
  return ymd(d);
}

/* ---------- holiday order-by dates ---------- */

export type CutoffInput = {
  /** Printer production, approved order to handed to carrier, in business days. Peak-season figure. */
  productionBusinessDays: number;
  /** Extra business days for unknowns (no sandbox run, first season, possible printer backlog). */
  safetyBusinessDays: number;
};

export type HolidaySeason = {
  id: string;
  label: string;
  /** The day the gift is for. */
  date: string;
  /** Carrier "send by" dates for delivery before `date`, by our shipping method. Standard maps to ground, express to priority. */
  carrierHandoff: Record<ShippingMethodId, string>;
  /** Printer closures inside the window (YYYY-MM-DD). */
  holidays: string[];
  leadTimes: Record<Kind, CutoffInput>;
  /** Where each number came from, for the ops doc. */
  sources: string[];
};

/**
 * Christmas 2026. Carrier dates: USPS recommended 2026 send-by dates for the lower 48 (Ground Advantage Dec 17,
 * Priority Mail Dec 18, Priority Mail Express Dec 19), as reported 2026-09-23 and read 2026-10-12. Lulu's MAIL and
 * Prodigi's Budget tiers may not be USPS Ground; verify on the sandbox. Lead times are GUESSES (docs/ops/03).
 */
export const CHRISTMAS_2026: HolidaySeason = {
  id: "christmas-2026",
  label: "Christmas",
  date: "2026-12-25",
  carrierHandoff: { standard: "2026-12-17", express: "2026-12-18" },
  holidays: [],
  leadTimes: {
    // Lulu: hardcovers about 5 business days, 5-8 suggested for Q4 (Lulu guides, read 2026-10-12). Use the top of the range.
    book: { productionBusinessDays: 8, safetyBusinessDays: 3 },
    // Prodigi: no published US card production time found. GUESS 3, plus 2 safety. Not valid if the SKU prints outside the US.
    card: { productionBusinessDays: 3, safetyBusinessDays: 2 },
  },
  sources: [
    "https://www.usps.com/holiday/holiday-shipping-dates.htm (2026 dates via valueaddedresource.net and local news, read 2026-10-12)",
    "https://www.thetilt.com/wp-content/uploads/2024/06/lulu-getting-started.pdf (hardcover ~5 business days, read 2026-10-12)",
    "https://blog.lulu.com/5-ways-to-get-your-lulu-xpress-shopify-store-ready-for-the-holidays (Q4 5-8 days, undated, read 2026-10-12)",
  ],
};

export const HOLIDAY_SEASONS: HolidaySeason[] = [CHRISTMAS_2026];

/** Last day (YYYY-MM-DD) a customer can place this kind of order with this method and expect it before the holiday. */
export function orderByDate(season: HolidaySeason, kind: Kind, method: ShippingMethodId): string {
  const handoff = lastBusinessDayOnOrBefore(season.carrierHandoff[method], season.holidays);
  const lt = season.leadTimes[kind];
  return businessDaysBefore(handoff, lt.productionBusinessDays + lt.safetyBusinessDays, season.holidays);
}

export type CutoffNotice = { season: string; label: string; kind: Kind; method: ShippingMethodId; orderBy: string; passed: boolean };

/** Every order-by date for seasons whose holiday has not happened yet, for a checkout banner or the help page. */
export function upcomingCutoffs(today: Date = new Date(), seasons: HolidaySeason[] = HOLIDAY_SEASONS): CutoffNotice[] {
  const t = ymd(today);
  const out: CutoffNotice[] = [];
  for (const s of seasons) {
    if (t > s.date) continue;
    for (const kind of ["book", "card"] as const) {
      for (const method of ["standard", "express"] as const) {
        const orderBy = orderByDate(s, kind, method);
        out.push({ season: s.id, label: s.label, kind, method, orderBy, passed: t > orderBy });
      }
    }
  }
  return out;
}

/* ---------- stuck and late orders ---------- */

/** Thresholds for the exception list. Calendar hours/days; tune from vendor data (docs/ops/04). */
export const EXCEPTION_THRESHOLDS = {
  /** Paid printed line with no printer job after this long: the submit never ran or crashed. */
  notSubmittedHours: 2,
  /** Submitted but not shipped after this many days. Lulu Q4 is 5-8 business days, so 12 calendar days is late. */
  notShippedDays: { book: 12, card: 6 } as Record<Kind, number>,
  /** Shipped this long ago with no delivery: check tracking; past the lost threshold, offer reprint or refund. */
  shippedCheckDays: 10,
  /** An arrive-by date this close (days) with the line not yet shipped puts the date at risk (CX P1). */
  arriveByRiskDays: 5,
} as const;

export type ExceptionCode = "needs_attention" | "not_submitted" | "not_shipped" | "arrive_by_at_risk" | "shipped_no_tracking" | "shipped_check_tracking";

export type FulfillmentException = {
  orderId: string;
  lineId: string;
  kind: Kind;
  printer?: string;
  externalId?: string;
  status: string;
  code: ExceptionCode;
  /** Plain reason for the ops list. Never contains names, emails or addresses. */
  detail: string;
  ageDays: number;
  /** Which playbook section in docs/ops/01-order-exception-playbook.md. */
  playbook: string;
};

const DAY = 86_400_000;
const PRIORITY: Record<ExceptionCode, number> = { not_submitted: 0, needs_attention: 1, arrive_by_at_risk: 2, not_shipped: 3, shipped_no_tracking: 4, shipped_check_tracking: 5 };

/**
 * Lists printed lines that need a person, most urgent first. Holds no customer content: ids, states and ages only,
 * so the list can be shown to a contractor or pasted into a ticket.
 */
export function findFulfillmentExceptions(orders: Order[], now: Date = new Date(), t = EXCEPTION_THRESHOLDS): FulfillmentException[] {
  const out: FulfillmentException[] = [];
  for (const o of orders) {
    const paidAt = Date.parse(o.createdAt);
    const shippedAt = [...o.history].reverse().find((h) => h.status === "shipped")?.at;
    for (const i of o.items) {
      if (!i.printed || ["delivered", "cancelled", "refunded"].includes(i.status)) continue;
      const f = i.fulfillment;
      const base = { orderId: o.id, lineId: i.id, kind: i.kind, printer: f?.printer, externalId: f?.externalId, status: i.status };
      const sinceSubmit = f ? (now.getTime() - Date.parse(f.submittedAt)) / DAY : 0;
      const sincePaid = (now.getTime() - paidAt) / DAY;
      const push = (code: ExceptionCode, detail: string, ageDays: number, playbook: string) =>
        out.push({ ...base, code, detail, ageDays: Math.round(ageDays * 10) / 10, playbook });

      if (i.status === "needs_attention") {
        push("needs_attention", f ? `Printer state "${f.state}"` : (i.note ?? "Failed before submit"), f ? sinceSubmit : sincePaid, f ? "A2 Rejected file" : "A1 Failed submission");
        continue;
      }
      if (!f) {
        if (sincePaid * 24 >= t.notSubmittedHours) push("not_submitted", "Paid, never sent to the printer", sincePaid, "A1 Failed submission");
        continue;
      }
      if (i.status === "shipped") {
        if (!f.trackingNumber && !f.trackingUrl) push("shipped_no_tracking", "Shipped with no tracking", sinceSubmit, "A3 Late");
        const since = shippedAt ? (now.getTime() - Date.parse(shippedAt)) / DAY : sinceSubmit;
        if (since >= t.shippedCheckDays) push("shipped_check_tracking", `Shipped ${Math.floor(since)} days ago, no delivery recorded`, since, "A4 Lost");
        continue;
      }
      // preparing or printing
      if (o.deliveryDate) {
        const left = (Date.parse(`${o.deliveryDate}T00:00:00Z`) - now.getTime()) / DAY;
        if (left <= t.arriveByRiskDays) {
          push("arrive_by_at_risk", `Arrive-by ${o.deliveryDate}, not shipped`, sinceSubmit, "A3 Late");
          continue;
        }
      }
      if (sinceSubmit >= t.notShippedDays[i.kind]) push("not_shipped", `Submitted ${Math.floor(sinceSubmit)} days ago, not shipped`, sinceSubmit, "A3 Late");
    }
  }
  return out.sort((a, b) => PRIORITY[a.code] - PRIORITY[b.code] || b.ageDays - a.ageDays);
}
