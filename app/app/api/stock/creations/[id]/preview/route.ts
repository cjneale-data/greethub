import { actor, json } from "@/lib/shop/api";
import { renderStockPreview } from "@/lib/stock/render";
import { getOwnedStockCreation } from "@/lib/stock/store";

export const maxDuration = 60;

/** PNG preview of the card inside, for the owner. Guests get the watermark. Customer words: never logged. */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const s = await actor();
  const c = await getOwnedStockCreation(s.userId, (await ctx.params).id);
  if (!c) return json({ error: "We couldn't find that card." }, 404);
  try {
    const guest = s.isGuest;
    const png = await renderStockPreview(c, { watermark: guest });
    return new Response(Buffer.from(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });
  } catch {
    return json({ error: "The preview didn't load. Your words are saved." }, 502);
  }
}
