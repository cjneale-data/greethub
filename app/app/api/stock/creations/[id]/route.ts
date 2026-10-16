import { z } from "zod";
import { CardWritingSchema } from "@greethub/shared";
import { actor, json } from "@/lib/shop/api";
import { getOwnedStockCreation } from "@/lib/stock/store";
import { editStockCreation } from "@/lib/stock/service";
import { creationView, failure } from "../../_shared";

const Patch = z.object({ message: z.string().max(2000).optional(), signOff: z.string().max(200).nullable().optional(), writing: CardWritingSchema.nullable().optional() });

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await actor();
  const c = await getOwnedStockCreation(s.userId, (await ctx.params).id);
  return c ? json(creationView(c)) : json({ error: "We couldn't find that card." }, 404);
}

/** Change the words, sign-off or handwriting. null clears signOff or writing. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await actor();
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Something went wrong on our side. Try again?" }, 400);
  const p = parsed.data;
  const patch: Parameters<typeof editStockCreation>[2] = {};
  if (p.message !== undefined) patch.message = p.message;
  if (p.signOff !== undefined) patch.signOff = p.signOff ?? undefined;
  if (p.writing !== undefined) patch.writing = p.writing ?? undefined;
  const r = await editStockCreation(s.userId, (await ctx.params).id, patch);
  return r.ok ? json(creationView(r.value)) : failure(r);
}
