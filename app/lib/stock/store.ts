import { docs } from "../store";
import { isValidGuestId } from "../shop/session";
import type { StockCreation } from "./types";

/** Docs-backed store for `stock_creations`. Rows carry customer text: never log them. */
export const newStockCreationId = () => `sc_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

export const getStockCreation = (id: string) => docs().get("stock_creations", id);

/** A creation, only if `userId` owns it. Everything user-facing goes through this so user B cannot touch user A's card. */
export async function getOwnedStockCreation(userId: string, id: string): Promise<StockCreation | undefined> {
  const c = await docs().get("stock_creations", id);
  return c && c.userId === userId ? c : undefined;
}

export const listStockCreations = (userId: string) => docs().find("stock_creations", { owner: userId });

export async function saveStockCreation(c: StockCreation): Promise<StockCreation> {
  return (await docs().mutate("stock_creations", c.id, () => c))!;
}

/** Edits one owned creation atomically. Returns undefined when it is missing or not the user's. */
export async function updateStockCreation(userId: string, id: string, fn: (cur: StockCreation) => StockCreation): Promise<StockCreation | undefined> {
  return docs().mutate("stock_creations", id, (cur) => (cur && cur.userId === userId ? { ...fn(cur), updatedAt: new Date().toISOString() } : cur));
}

/** Payment landed: the creation is now ordered. Called by order handling later; safe to call twice. */
export const markStockOrdered = (creationId: string) =>
  docs().mutate("stock_creations", creationId, (cur) => (cur ? { ...cur, status: "ordered", updatedAt: new Date().toISOString() } : cur));

/** Sign-in: cards a guest edited move to the account, like the cart does. */
export async function adoptGuestStockCreations(guestId: string, userId: string): Promise<void> {
  if (!isValidGuestId(guestId) || guestId === userId) return;
  for (const c of await docs().find("stock_creations", { owner: guestId })) {
    await docs().mutate("stock_creations", c.id, (cur) => (cur && cur.userId === guestId ? { ...cur, userId } : cur));
  }
}
