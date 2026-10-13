import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { getOrder } from "@/lib/shop/accountService";
import { refreshOrderIfStale } from "@/lib/shop/orderService";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await signedIn();
  if (!user) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  if (!await getOrder(user.userId, id)) return json({ error: "We couldn't find that order." }, 404);
  await refreshOrderIfStale(id);
  return json({ order: await getOrder(user.userId, id) });
}
