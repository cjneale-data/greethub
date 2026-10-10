import { timingSafeEqual } from "node:crypto";
import { applyPrinterWebhook } from "@/lib/shop/orderService";

/**
 * Printer status callbacks write order status and tracking back to the site.
 * Lulu sends { topic: "PRINT_JOB_STATUS_CHANGED", data: { id, status: { name }, line_items: [{ tracking_urls, tracking_id, carrier_name }] } }.
 * Prodigi posts a body whose data carries the order id and status stage.
 * Both providers need a shared secret in the URL query (?secret=) compared to PRINTER_WEBHOOK_SECRET. In local dev without a
 * secret, only the fake shape { externalId, state } is meaningful.
 */
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const secret = process.env.PRINTER_WEBHOOK_SECRET;
  const given = new URL(req.url).searchParams.get("secret") ?? "";
  if (secret) {
    const a = Buffer.from(secret);
    const b = Buffer.from(given);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ error: "unauthorized" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "webhook secret not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!body) return Response.json({ error: "bad body" }, { status: 400 });

  let externalId: string | undefined;
  let state: string | undefined;
  let tracking: { trackingUrl?: string; trackingNumber?: string; carrier?: string } = {};
  if (name === "lulu" && body.data) {
    externalId = String(body.data.id ?? "");
    state = body.data.status?.name;
    const li = body.data.line_items?.[0];
    tracking = { trackingUrl: li?.tracking_urls?.[0], trackingNumber: li?.tracking_id, carrier: li?.carrier_name };
  } else if (name === "prodigi" && body.data) {
    externalId = body.data.order?.id ?? body.data.id;
    state = body.data.order?.status?.stage ?? body.data.status?.stage ?? body.type;
  } else {
    externalId = body.externalId;
    state = body.state;
  }
  if (!externalId || !state) return Response.json({ error: "missing id or state" }, { status: 400 });
  const order = await applyPrinterWebhook(externalId, state, tracking);
  return Response.json({ received: true, matched: !!order });
}
