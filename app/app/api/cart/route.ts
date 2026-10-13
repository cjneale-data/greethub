import { NewCartItemSchema, type CartItem, type ShippingMethodId } from "@greethub/shared";
import { actor, json } from "@/lib/shop/api";
import { addItem, changeQuantity, getCartItems, removeLine, restoreLine, setMailTo, viewCart } from "@/lib/shop/cartService";

const view = async (userId: string, method?: string) => viewCart(await getCartItems(userId), (method === "express" ? "express" : "standard") as ShippingMethodId);

export async function GET(req: Request) {
  const s = await actor();
  return json({ ...(await view(s.userId, new URL(req.url).searchParams.get("method") ?? undefined)), isGuest: s.isGuest });
}

/** Add a line. Body is a NewCartItem (card or book). The creators call this from "Add to cart". */
export async function POST(req: Request) {
  const s = await actor();
  const body = (await req.json().catch(() => null)) as { restore?: CartItem } | null;
  if (body?.restore) {
    await restoreLine(s.userId, body.restore);
    return json(await view(s.userId));
  }
  const parsed = NewCartItemSchema.safeParse(body);
  if (!parsed.success) return json({ error: "That item can't go in the cart.", issues: parsed.error.issues.map((i) => i.message) }, 400);
  await addItem(s.userId, parsed.data);
  return json(await view(s.userId), 201);
}

export async function PATCH(req: Request) {
  const s = await actor();
  const b = (await req.json().catch(() => ({}))) as { id?: string; quantity?: number; mailTo?: "buyer" | "recipient" };
  if (!b.id) return json({ error: "Missing id" }, 400);
  if (typeof b.quantity === "number") await changeQuantity(s.userId, b.id, b.quantity);
  if (b.mailTo === "buyer" || b.mailTo === "recipient") await setMailTo(s.userId, b.id, b.mailTo);
  return json(await view(s.userId));
}

export async function DELETE(req: Request) {
  const s = await actor();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const removed = (await getCartItems(s.userId)).find((i) => i.id === id);
  await removeLine(s.userId, id);
  return json({ ...(await view(s.userId)), removed });
}
