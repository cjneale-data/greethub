import { z } from "zod";
import { CardWritingSchema } from "@greethub/shared";
import { actor, json } from "@/lib/shop/api";
import { allow } from "@/lib/intake/rate-limit";
import { createStockCreation } from "@/lib/stock/service";
import { creationView, failure } from "../_shared";

const Body = z.object({ stockId: z.string().min(1).max(120), message: z.string().max(2000).optional(), signOff: z.string().max(200).optional(), writing: CardWritingSchema.optional() });

/** Start a Ready Card from a catalog card. Guests may start one (they cannot pay without an account). */
export async function POST(req: Request) {
  const s = await actor();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Something went wrong on our side. Try again?" }, 400);
  if (!allow(`stock-create:${s.userId}`, 30, 10 * 60_000)) return json({ error: "A lot of cards are being made right now. Try again in a minute." }, 429);
  const { stockId, ...custom } = parsed.data;
  const r = await createStockCreation(s.userId, stockId, custom);
  return r.ok ? json(creationView(r.value), 201) : failure(r);
}
