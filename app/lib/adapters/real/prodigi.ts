import type { PrintJob, PrinterAdapter, PrinterStatus } from "../types";

/**
 * Prodigi Print API v4 (https://www.prodigi.com/print-api/docs/, sandbox https://api.sandbox.prodigi.com/v4.0).
 * Auth: X-API-Key header. Submit: POST /orders. Status: GET /orders/{id}. Inactive without PRODIGI_API_KEY.
 * Not yet exercised against the sandbox: no key. Verify field names and the SKU on the first sandbox run.
 */

/** UNVERIFIED placeholder for the 5x7 folded greeting card. Pick the real SKU from Prodigi's catalogue and set PRODIGI_CARD_SKU. */
export const PRODIGI_CARD_SKU_PLACEHOLDER = "GLOBAL-GRE-5X7";

type Cfg = { apiKey: string; apiBase: string; cardSku?: string };

export function prodigiPrinter(cfg: Cfg, fetchImpl: typeof fetch = fetch): PrinterAdapter {
  const base = cfg.apiBase.replace(/\/$/, "");
  const headers = { "X-API-Key": cfg.apiKey, "Content-Type": "application/json" };

  return {
    name: "prodigi",
    fake: false,
    async validateFiles(job) {
      const problems: string[] = [];
      if (!job.pdfUrls.single) problems.push("Card artwork is missing");
      return { ok: problems.length === 0, problems };
    },
    async submit(job: PrintJob) {
      const payload = {
        merchantReference: `${job.orderId}-${job.lineId}`,
        shippingMethod: job.expedited ? "Express" : "Budget",
        idempotencyKey: `${job.orderId}-${job.lineId}`,
        recipient: {
          name: job.shipTo.name,
          email: job.email,
          ...(job.shipTo.phone ? { phoneNumber: job.shipTo.phone } : {}),
          address: {
            line1: job.shipTo.line1,
            ...(job.shipTo.line2 ? { line2: job.shipTo.line2 } : {}),
            postalOrZipCode: job.shipTo.postalCode,
            countryCode: job.shipTo.country,
            townOrCity: job.shipTo.city,
            stateOrCounty: job.shipTo.region,
          },
        },
        items: [
          {
            merchantReference: job.lineId,
            sku: cfg.cardSku || PRODIGI_CARD_SKU_PLACEHOLDER,
            copies: job.quantity,
            sizing: "fillPrintArea",
            assets: [{ printArea: "default", url: job.pdfUrls.single }],
          },
        ],
      };
      const res = await fetchImpl(`${base}/orders`, { method: "POST", headers, body: JSON.stringify(payload) });
      const body = (await res.json().catch(() => ({}))) as { outcome?: string; order?: { id?: string } };
      if (!res.ok || !body.order?.id) throw new Error(`Prodigi submit failed (${res.status}, ${body.outcome ?? "no outcome"})`);
      return { externalId: body.order.id };
    },
    async status(externalId): Promise<PrinterStatus> {
      const res = await fetchImpl(`${base}/orders/${encodeURIComponent(externalId)}`, { headers });
      const body = (await res.json().catch(() => ({}))) as {
        order?: { status?: { stage?: string }; shipments?: { carrier?: { name?: string }; tracking?: { number?: string; url?: string } }[] };
      };
      if (!res.ok || !body.order) throw new Error(`Prodigi status failed (${res.status})`);
      const ship = body.order.shipments?.find((s) => s.tracking?.number || s.tracking?.url);
      // Prodigi's stage is InProgress until the whole order is Complete; a shipment with tracking means it is on its way.
      const state = ship ? "shipped" : (body.order.status?.stage ?? "unknown");
      return { state, carrier: ship?.carrier?.name, trackingNumber: ship?.tracking?.number, trackingUrl: ship?.tracking?.url };
    },
  };
}
