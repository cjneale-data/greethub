import { json, originOf } from "@/lib/shop/api";
import { startMembershipCheckout } from "@/lib/membership/service";
import { memberRoute } from "../_lib";

/** { tier, interval: "month" | "year" } -> { url } (Stripe Checkout, or the local fake page). */
export const POST = memberRoute(async (req, u) => {
  const b = (await req.json().catch(() => ({}))) as { tier?: string; interval?: string };
  return json(await startMembershipCheckout(u, { tier: b.tier ?? "", interval: b.interval ?? "month" }, originOf(req)));
});
