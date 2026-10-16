import type { FlatCardPrinter } from "../flatCard";
import { docs } from "../../store";
import { FAKE_STAGES } from "./printer";

export type FakeFlatCardOptions = {
  /** Make submitBulk throw (tests the needs-attention path). */
  failSubmit?: boolean;
  /** Counts real submissions, so tests can prove a retry did not double-print. */
  onSubmit?: (externalId: string) => void;
};

/**
 * Mock mode flat-card printer. Same lifecycle as the Prodigi/Lulu fakes (it shares the fake_printer_jobs collection,
 * so `advanceFakeJob(externalId)` moves it along). No network, no vendor, no cost. Quotes are zero on purpose: prices
 * live only in the price config, and a fake must not look like a vendor price.
 */
export function fakeFlatCardPrinter(opts: FakeFlatCardOptions = {}): FlatCardPrinter {
  const idFor = (orderId: string, lineId: string, tail = "") => `FAKE-FLAT-${orderId.slice(-6).toUpperCase()}-${lineId.slice(-4).toUpperCase()}${tail}`;
  return {
    name: "fake",
    fake: true,
    caps: { sizes: ["flat_5x7"], doubleSided: true, papers: ["matte", "pearl", "recycled"], envelopes: "blank", addressing: "none", mailForMe: true, minQty: 10, maxQty: 300, usOnly: true },
    async quote(q) {
      if (q.qty < 10 || q.qty > 300) throw new Error("quantity out of range");
      return { cents: 0, postageCents: 0, productionDays: 2 };
    },
    async submitBulk(job) {
      if (opts.failSubmit) throw new Error("fake printer unavailable");
      if (!job.files.front) throw new Error("front file missing");
      if (job.qty < 10 || job.qty > 300) throw new Error("quantity out of range");
      const externalId = idFor(job.orderId, job.lineId);
      // Idempotent per (order, line): a second call returns the same id and does not create a second job.
      const created = await docs().insertIfAbsent("fake_printer_jobs", externalId, { stage: 0, printer: "fake" });
      if (created) opts.onSubmit?.(externalId);
      return { externalId };
    },
    async submitMailing(job) {
      if (opts.failSubmit) throw new Error("fake printer unavailable");
      const externalIds: Record<string, string> = {};
      for (const r of job.to) {
        const id = idFor(job.orderId, job.lineId, `-${r.recipientId.slice(-4).toUpperCase()}`);
        if (await docs().insertIfAbsent("fake_printer_jobs", id, { stage: 0, printer: "fake" })) opts.onSubmit?.(id);
        externalIds[r.recipientId] = id;
      }
      return { externalIds };
    },
    async status(externalId) {
      const job = await docs().get("fake_printer_jobs", externalId);
      if (!job) return { state: "error" };
      const state = FAKE_STAGES[Math.min(job.stage, FAKE_STAGES.length - 1)];
      if (state === "shipped" || state === "delivered") {
        const number = `FAKE${externalId.replace(/[^A-Z0-9]/g, "").slice(-10)}`;
        return { state, carrier: "Fake Post", trackingNumber: number, trackingUrl: `https://example.com/track/${number}` };
      }
      return { state };
    },
  };
}
