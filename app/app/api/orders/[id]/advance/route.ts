import { getAdapters } from "@/lib/adapters";
import { advanceFakeJob } from "@/lib/adapters/fake/printer";
import { fakeAllowed, json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { getOrder } from "@/lib/shop/accountService";
import { refreshOrder } from "@/lib/shop/orderService";

/** Local only: pushes the fake printers one step along (printing, shipped, delivered) so the whole timeline can be walked. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!fakeAllowed() || !getAdapters().bookPrinter.fake) return json({ error: "Not available." }, 404);
  const user = await signedIn();
  if (!user) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  const order = getOrder(user.userId, id);
  if (!order) return json({ error: "We couldn't find that order." }, 404);
  for (const i of order.items) if (i.fulfillment) advanceFakeJob(i.fulfillment.externalId);
  await refreshOrder(id);
  return json({ order: getOrder(user.userId, id) });
}
