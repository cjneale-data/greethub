import { z } from "zod";
import { PRICING, type ShippingMethodId, type Sku } from "./pricing";

/* ---------- cart item types (cards and books) ---------- */

export const MAX_QUANTITY = 10;

const BaseShape = {
  /** The saved creation (approved proof) this line prints. */
  creationId: z.string().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  recipientName: z.string().trim().max(80).optional(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY).default(1),
  thumbnail: z.string().max(500).optional(),
  /** Set when the item cannot print yet (e.g. print validation failed). Blocks checkout. */
  needsAttention: z.string().max(300).optional(),
};

export const NewCardItemSchema = z.object({
  ...BaseShape,
  kind: z.literal("card"),
  format: z.enum(["mailed", "digital"]),
  mailTo: z.enum(["buyer", "recipient"]).default("buyer"),
  /** Where the card came from. Absent means an AI card ("ai"); "stock" is a Ready Card (creationId = a stock_creations id). */
  source: z.enum(["ai", "stock"]).optional(),
});

export const NewBookItemSchema = z.object({
  ...BaseShape,
  kind: z.literal("book"),
  pageCount: z.union([z.literal(24), z.literal(32)]),
  mailTo: z.enum(["buyer", "recipient"]).default("buyer"),
  /** Extra digital copy on top of the hardcover. */
  digitalCopy: z.boolean().default(false),
});

export const NewCartItemSchema = z.discriminatedUnion("kind", [NewCardItemSchema, NewBookItemSchema]);
export type NewCartItem = z.input<typeof NewCartItemSchema>;

export type CardCartItem = z.infer<typeof NewCardItemSchema> & { id: string; addedAt: string };
export type BookCartItem = z.infer<typeof NewBookItemSchema> & { id: string; addedAt: string };
export type CartItem = CardCartItem | BookCartItem;

/* ---------- pricing math ---------- */

export function itemSku(item: CartItem): Sku {
  if (item.kind === "card" && item.source === "stock") return item.format === "mailed" ? "stock_card_mailed" : "stock_card_digital";
  if (item.kind === "card") return item.format === "mailed" ? "card_mailed" : "card_digital";
  return item.pageCount === 24 ? "book_24" : "book_32";
}

/** Does this line need a postal address? Digital cards do not. Books always print. */
export function isPrinted(item: CartItem): boolean {
  return PRICING.skus[itemSku(item)].printed;
}

export type LinePrice = {
  sku: Sku;
  unitCents: number;
  /** Optional digital copy of a book, per unit. */
  addonCents: number;
  postageUnitCents: number;
  productCents: number;
  postageCents: number;
  totalCents: number;
};

export function priceLine(item: CartItem): LinePrice {
  const sku = itemSku(item);
  const def = PRICING.skus[sku];
  const addonCents = item.kind === "book" && item.digitalCopy ? PRICING.skus.book_digital.cents : 0;
  const q = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(item.quantity)));
  const productCents = (def.cents + addonCents) * q;
  const postageCents = def.postageCents * q;
  return { sku, unitCents: def.cents, addonCents, postageUnitCents: def.postageCents, productCents, postageCents, totalCents: productCents + postageCents };
}

export type CartTotals = {
  itemCount: number;
  subtotalCents: number;
  postageCents: number;
  /** Surcharge for the chosen shipping method (once per order with printed items). */
  methodCents: number;
  taxCents: number;
  /** True while tax is a placeholder and the real figure is set at payment. */
  taxEstimated: boolean;
  totalCents: number;
  hasPrinted: boolean;
};

export function computeTotals(items: CartItem[], method: ShippingMethodId = "standard"): CartTotals {
  let subtotal = 0;
  let postage = 0;
  let count = 0;
  let hasPrinted = false;
  for (const it of items) {
    const l = priceLine(it);
    subtotal += l.productCents;
    postage += l.postageCents;
    count += Math.max(1, Math.floor(it.quantity));
    if (isPrinted(it)) hasPrinted = true;
  }
  const m = PRICING.shippingMethods[method];
  const methodCents = hasPrinted && m.enabled ? m.extraCents : 0;
  const taxable = subtotal + postage + methodCents;
  const taxCents = Math.round(taxable * PRICING.taxRate);
  return {
    itemCount: count,
    subtotalCents: subtotal,
    postageCents: postage,
    methodCents,
    taxCents,
    taxEstimated: true,
    totalCents: taxable + taxCents,
    hasPrinted,
  };
}

/** Merge rule when the same creation+options is added twice: bump quantity instead of duplicating the line. */
type CartItemInput = Omit<CardCartItem, "id" | "addedAt"> | Omit<BookCartItem, "id" | "addedAt">;

export function sameLine(a: CartItem, b: CartItemInput): boolean {
  if (a.kind !== b.kind || a.creationId !== b.creationId || a.mailTo !== b.mailTo) return false;
  if (a.kind === "card" && b.kind === "card") return a.format === b.format && (a.source ?? "ai") === (b.source ?? "ai");
  if (a.kind === "book" && b.kind === "book") return a.pageCount === b.pageCount && a.digitalCopy === b.digitalCopy;
  return false;
}

export function addToCart(items: CartItem[], input: NewCartItem, now: Date = new Date(), newId: () => string = () => crypto.randomUUID()): CartItem[] {
  const parsed = NewCartItemSchema.parse(input);
  const existing = items.find((i) => sameLine(i, parsed));
  if (existing) {
    return items.map((i) => (i === existing ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + parsed.quantity) } : i));
  }
  return [...items, { ...parsed, id: newId(), addedAt: now.toISOString() } as CartItem];
}

export function setQuantity(items: CartItem[], id: string, quantity: number): CartItem[] {
  if (!Number.isFinite(quantity)) return items;
  const q = Math.floor(quantity);
  if (q < 1) return items.filter((i) => i.id !== id);
  return items.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_QUANTITY, q) } : i));
}

export function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id !== id);
}

export function blockedItems(items: CartItem[]): CartItem[] {
  return items.filter((i) => !!i.needsAttention);
}

export function describeItem(item: CartItem): string {
  if (item.kind === "card") {
    const kind = item.format === "mailed" ? "mailed card" : "digital card";
    return item.source === "stock" ? `Ready-made ${kind}` : kind === "mailed card" ? "Mailed card" : "Digital card";
  }
  return `Hardcover, ${item.pageCount} pages${item.digitalCopy ? ", plus digital copy" : ""}`;
}
