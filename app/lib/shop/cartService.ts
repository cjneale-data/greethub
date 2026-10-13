import { addToCart, computeTotals, describeItem, priceLine, removeItem, setQuantity, type CartItem, type NewCartItem, type ShippingMethodId } from "@greethub/shared";
import { docs } from "../store";

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

export const getCartItems = async (userId: string): Promise<CartItem[]> => (await docs().get("carts", userId)) ?? [];

const editCart = async (userId: string, fn: (cart: CartItem[]) => CartItem[]): Promise<CartItem[]> =>
  (await docs().mutate("carts", userId, (cur) => fn(cur ?? []))) ?? [];

export const addItem = (userId: string, input: NewCartItem) => editCart(userId, (cart) => addToCart(cart, input));

export const changeQuantity = (userId: string, id: string, quantity: number) => editCart(userId, (cart) => setQuantity(cart, id, quantity));

export const removeLine = (userId: string, id: string) => editCart(userId, (cart) => removeItem(cart, id));

/** Puts a removed line back (the Undo on the "Removed." toast). */
export const restoreLine = (userId: string, item: CartItem) => editCart(userId, (cart) => (cart.some((i) => i.id === item.id) ? cart : [...cart, item]));

export const setMailTo = (userId: string, id: string, mailTo: "buyer" | "recipient") =>
  editCart(userId, (cart) => cart.map((i) => (i.id === id ? { ...i, mailTo } : i)));
