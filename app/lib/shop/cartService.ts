import { addToCart, computeTotals, describeItem, priceLine, removeItem, setQuantity, type CartItem, type NewCartItem, type ShippingMethodId } from "@greethub/shared";
import { readDB, updateDB } from "./store";

export type CartView = {
  items: (CartItem & { description: string; unitCents: number; lineCents: number; postageCents: number })[];
  totals: ReturnType<typeof computeTotals>;
};

export function viewCart(items: CartItem[], method: ShippingMethodId = "standard"): CartView {
  return {
    items: items.map((i) => {
      const p = priceLine(i);
      return { ...i, description: describeItem(i), unitCents: p.unitCents + p.addonCents, lineCents: p.productCents, postageCents: p.postageCents };
    }),
    totals: computeTotals(items, method),
  };
}

export const getCartItems = (userId: string): CartItem[] => readDB().carts[userId] ?? [];

export function addItem(userId: string, input: NewCartItem): CartItem[] {
  return updateDB((db) => (db.carts[userId] = addToCart(db.carts[userId] ?? [], input)));
}

export function changeQuantity(userId: string, id: string, quantity: number): CartItem[] {
  return updateDB((db) => (db.carts[userId] = setQuantity(db.carts[userId] ?? [], id, quantity)));
}

export function removeLine(userId: string, id: string): CartItem[] {
  return updateDB((db) => (db.carts[userId] = removeItem(db.carts[userId] ?? [], id)));
}

/** Puts a removed line back (the Undo on the "Removed." toast). */
export function restoreLine(userId: string, item: CartItem): CartItem[] {
  return updateDB((db) => {
    const cart = db.carts[userId] ?? [];
    if (!cart.some((i) => i.id === item.id)) cart.push(item);
    return (db.carts[userId] = cart);
  });
}

export function setMailTo(userId: string, id: string, mailTo: "buyer" | "recipient"): CartItem[] {
  return updateDB((db) => (db.carts[userId] = (db.carts[userId] ?? []).map((i) => (i.id === id ? { ...i, mailTo } : i))));
}
