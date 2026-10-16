import { z } from "zod";
import { actor, json } from "@/lib/shop/api";
import { viewCart } from "@/lib/shop/cartService";
import { addStockCardToCart } from "@/lib/stock/service";
import { failure } from "../../../_shared";

const Body = z.object({ format: z.enum(["mailed", "digital"]), mailTo: z.enum(["buyer", "recipient"]).optional(), recipientName: z.string().trim().max(60).optional() });

/** Add the finished card to the cart. The server re-checks fit, wording and the handwriting plan, and prices from the SKU at checkout. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await actor();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Something went wrong on our side. Try again?" }, 400);
  const r = await addStockCardToCart(s.userId, { creationId: (await ctx.params).id, ...parsed.data });
  return r.ok ? json(viewCart(r.value, "standard"), 201) : failure(r);
}
