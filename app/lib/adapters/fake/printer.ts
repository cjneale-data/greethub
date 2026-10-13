import type { PrinterAdapter } from "../types";
import { docs } from "../../store";

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
      await docs().insertIfAbsent("fake_printer_jobs", externalId, { stage: 0, printer: name });
      return { externalId };
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

export async function advanceFakeJob(externalId: string): Promise<void> {
  await docs().mutate("fake_printer_jobs", externalId, (j) => j && { ...j, stage: Math.min(j.stage + 1, FAKE_STAGES.length - 1) });
}
