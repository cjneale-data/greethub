import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { findCheckoutBySession } from "@/lib/shop/checkoutService";

/** The success page polls this: the webhook may land a moment after the browser returns from payment. */
export async function GET(req: Request) {
  const user = await signedIn();
  if (!user) return json(NOT_SIGNED_IN, 401);
  const sid = new URL(req.url).searchParams.get("session_id") ?? "";
  const c = findCheckoutBySession(sid);
  if (!c || c.userId !== user.userId) return json({ error: "We couldn't find that payment." }, 404);
  return json({ status: c.status, orderId: c.orderId ?? null });
}
