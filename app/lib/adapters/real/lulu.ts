import type { PrintJob, PrinterAdapter, PrinterStatus } from "../types";

/**
 * Lulu Print API (https://api.lulu.com/docs, sandbox https://api.sandbox.lulu.com).
 * Auth: OAuth2 client credentials against /auth/realms/glasstree/protocol/openid-connect/token.
 * Submit: POST /print-jobs/. Status: GET /print-jobs/{id}/. Inactive without LULU_CLIENT_KEY / LULU_CLIENT_SECRET.
 * Not yet exercised against the sandbox: no keys. Field names follow Lulu's published examples; verify on first sandbox run.
 */

/** 8.5x8.5 inch, full colour, premium, casewrap hardcover, 80# coated white, gloss. Lulu's package id encodes trim size and binding.
 *  VERIFY against Lulu's pod-package list for the final spec (docs/cto/setup-needed.md). Override with LULU_BOOK_POD_PACKAGE_ID. */
export const LULU_BOOK_POD_PACKAGE_ID = "0850X0850FCPREMCW080CW444GXX";

type Cfg = { clientKey: string; clientSecret: string; apiBase: string; podPackageId?: string };

export function luluPrinter(cfg: Cfg, fetchImpl: typeof fetch = fetch): PrinterAdapter {
  const base = cfg.apiBase.replace(/\/$/, "");
  let token: { value: string; exp: number } | null = null;

  async function getToken(): Promise<string> {
    if (token && token.exp > Date.now() + 30_000) return token.value;
    const res = await fetchImpl(`${base}/auth/realms/glasstree/protocol/openid-connect/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${cfg.clientKey}:${cfg.clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
    if (!res.ok || !body.access_token) throw new Error(`Lulu auth failed (${res.status})`);
    token = { value: body.access_token, exp: Date.now() + (body.expires_in ?? 300) * 1000 };
    return token.value;
  }

  async function api(path: string, init: RequestInit = {}) {
    const res = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, body };
  }

  return {
    name: "lulu",
    fake: false,
    async validateFiles(job) {
      const problems: string[] = [];
      if (!job.pdfUrls.interior) problems.push("Interior PDF is missing");
      if (!job.pdfUrls.cover) problems.push("Cover PDF is missing");
      // TODO(M6 sandbox): call POST /validate-interior/ and /validate-cover/ with the source URLs and poll for status VALIDATED.
      return { ok: problems.length === 0, problems };
    },
    async submit(job: PrintJob) {
      const payload = {
        contact_email: job.email,
        external_id: `${job.orderId}-${job.lineId}`,
        line_items: [
          {
            external_id: job.lineId,
            title: job.title,
            quantity: job.quantity,
            printable_normalization: {
              pod_package_id: cfg.podPackageId || LULU_BOOK_POD_PACKAGE_ID,
              cover: { source_url: job.pdfUrls.cover },
              interior: { source_url: job.pdfUrls.interior },
            },
          },
        ],
        production_delay: 120, // minutes before production starts, so a cancel is still possible
        shipping_level: job.expedited ? "EXPEDITED" : "MAIL",
        shipping_address: {
          name: job.shipTo.name,
          street1: job.shipTo.line1,
          ...(job.shipTo.line2 ? { street2: job.shipTo.line2 } : {}),
          city: job.shipTo.city,
          state_code: job.shipTo.region,
          country_code: job.shipTo.country,
          postcode: job.shipTo.postalCode,
          phone_number: job.shipTo.phone || "0000000000",
        },
      };
      const r = await api("/print-jobs/", { method: "POST", body: JSON.stringify(payload) });
      const id = r.body.id;
      if (!r.ok || (typeof id !== "number" && typeof id !== "string")) throw new Error(`Lulu submit failed (${r.status})`);
      return { externalId: String(id) };
    },
    async status(externalId): Promise<PrinterStatus> {
      const r = await api(`/print-jobs/${encodeURIComponent(externalId)}/`);
      if (!r.ok) throw new Error(`Lulu status failed (${r.status})`);
      const state = String((r.body.status as { name?: string } | undefined)?.name ?? "unknown");
      const li = (r.body.line_items as { tracking_id?: string; carrier_name?: string; tracking_urls?: string[] }[] | undefined)?.[0];
      return { state, trackingNumber: li?.tracking_id, carrier: li?.carrier_name, trackingUrl: li?.tracking_urls?.[0] };
    },
  };
}
