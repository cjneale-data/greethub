import { connection } from "next/server";
import { adminAllowed } from "@/lib/safety/reports";
import { json } from "@/lib/shop/api";
import { docs } from "@/lib/store";
import { findFulfillmentExceptions, upcomingCutoffs } from "@/lib/shop/fulfillmentOps";

/** Internal, read-only: printed lines that need a person (stuck, late, rejected) plus the holiday order-by dates.
 *  Same gate as content reports (dev, or GREETHUB_ADMIN_TOKEN in x-admin-token). Returns ids and states only. */
export async function GET(req: Request) {
  await connection();
  if (!adminAllowed(req.headers)) return json({ error: "Not available." }, 404);
  const now = new Date();
  return json({ exceptions: findFulfillmentExceptions(await docs().all("orders"), now), cutoffs: upcomingCutoffs(now), at: now.toISOString() });
}
