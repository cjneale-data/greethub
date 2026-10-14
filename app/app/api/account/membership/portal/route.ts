import { json, originOf } from "@/lib/shop/api";
import { billingPortalUrl } from "@/lib/membership/service";
import { memberRoute } from "../_lib";

/** Stripe's hosted page for the card on file and invoices. */
export const POST = memberRoute(async (req, u) => json({ url: await billingPortalUrl(u.userId, `${originOf(req)}/account/membership`) }));
