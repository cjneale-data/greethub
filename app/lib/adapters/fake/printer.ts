import type { PrinterAdapter } from "../types";
import { readDB, updateDB } from "../../shop/store";

/** Fake print lifecycle. Each call to `advanceFakeJob` moves one step; real printers do this on their own schedule. */
export const FAKE_STAGES = ["submitted", "in_production", "shipped", "delivered"] as const;

const label = { lulu: "LULU", prodigi: "PRODIGI", gelato: "GELATO" } as const;

export function fakePrinter(name: PrinterAdapter["name"]): PrinterAdapter {
  return {
    name,
    fake: true,
    async validateFiles(job) {
      // Real validation checks PDF boxes, bleed and fonts. The fake only catches a title that signals a test failure.
      if (/needs[-_ ]fix/i.test(job.title)) return { ok: false, problems: ["Page 9 has text outside the safe area"] };
      return { ok: true, problems: [] };
    },
    async submit(job) {
      const externalId = `FAKE-${label[name]}-${job.orderId.slice(-6).toUpperCase()}-${job.lineId.slice(-4).toUpperCase()}`;
      updateDB((db) => {
        db.fakePrinterJobs[externalId] = db.fakePrinterJobs[externalId] ?? { stage: 0, printer: name };
      });
      return { externalId };
    },
    async status(externalId) {
      const job = readDB().fakePrinterJobs[externalId];
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

export function advanceFakeJob(externalId: string): void {
  updateDB((db) => {
    const j = db.fakePrinterJobs[externalId];
    if (j && j.stage < FAKE_STAGES.length - 1) j.stage += 1;
  });
}
