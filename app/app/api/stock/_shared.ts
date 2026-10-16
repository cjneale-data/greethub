import { json } from "@/lib/shop/api";
import type { StockResult } from "@/lib/stock/service";

const STATUS = { no_card: 404, no_creation: 404, bad_text: 422, doesnt_fit: 422, bad_writing: 422, plus_required: 402, needs_attention: 422 } as const;

/** Failure body for a service result. Messages come from the service and never echo customer text. */
export function failure(r: Extract<StockResult<unknown>, { ok: false }>) {
  return json({ error: r.message, code: r.code, fit: r.fit }, STATUS[r.code] ?? 400);
}

/** Public shape of a creation (no screening internals, no storage keys). */
export function creationView(c: { id: string; stockId: string; message: string; signOff?: string; writing?: unknown; status: string; updatedAt: string }) {
  return { id: c.id, stockId: c.stockId, message: c.message, signOff: c.signOff, writing: c.writing, status: c.status, updatedAt: c.updatedAt };
}
