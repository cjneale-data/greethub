import { json, NOT_SIGNED_IN, originOf, signedIn } from "@/lib/shop/api";
import { startCheckout } from "@/lib/shop/checkoutService";

export async function POST(req: Request) {
  const user = await signedIn();
  if (!user) return json({ ...NOT_SIGNED_IN, error: "Make a free account to check out and track your order." }, 401);
  const body = await req.json().catch(() => ({}));
  const r = await startCheckout(user, body, originOf(req));
  if (!r.ok) return json({ error: r.error, fieldErrors: r.fieldErrors, earliest: r.earliest }, r.status);
  return json({ url: r.url });
}
