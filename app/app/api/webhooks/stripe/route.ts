import { handlePaymentWebhook } from "@/lib/shop/orderService";

/** Stripe calls this. Needs the raw body for signature verification, so read text(), never json(). */
export async function POST(req: Request) {
  const raw = await req.text();
  const r = await handlePaymentWebhook(raw, req.headers.get("stripe-signature"));
  return Response.json(r.body, { status: r.status });
}
