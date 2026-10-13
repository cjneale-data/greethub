import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { listOrders } from "@/lib/shop/accountService";
import { refreshOrderIfStale } from "@/lib/shop/orderService";

export async function GET() {
  const user = await signedIn();
  if (!user) return json(NOT_SIGNED_IN, 401);
  // Poll open orders so statuses are fresh even if a printer webhook was missed.
  await Promise.all((await listOrders(user.userId)).filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).map((o) => refreshOrderIfStale(o.id)));
  return json({ orders: await listOrders(user.userId) });
}
