import { z } from "zod";
import { PHOTO_CARD_PRICE_CONFIG, type PhotoCardPriceConfig, type PhotoCardProduct } from "./priceConfig";

/**
 * Pure cart logic for the `photo_card` line (Phase 1: holiday card, ship to me). It sits beside the shared card/book
 * cart instead of inside it, so existing card and book behaviour (MAX_QUANTITY 10, priceLine) is untouched.
 * Prices come from a PhotoCardPriceConfig argument, never from literals here.
 */
export const PHOTO_CARD_PRODUCTS = ["holiday_flat_5x7"] as const satisfies readonly PhotoCardProduct[];

export const NewPhotoCardItemSchema = z.object({
  kind: z.literal("photo_card"),
  creationId: z.string().min(1).max(120),
  designVersion: z.number().int().min(1),
  title: z.string().trim().min(1).max(160),
  product: z.enum(PHOTO_CARD_PRODUCTS),
  sizeId: z.literal("flat_5x7"),
  quantity: z.number().int().min(1).max(10_000),
  paper: z.enum(["matte", "pearl", "recycled"]).default("matte"),
  /** Phase 1: blank envelopes only (printing doc section 1, item 4). Addressing arrives in Phase 2. */
  envelopes: z.literal("blank").default("blank"),
  delivery: z.object({ mode: z.literal("ship_to_me") }).default({ mode: "ship_to_me" }),
  thumbnail: z.string().max(500).optional(),
  needsAttention: z.string().max(300).optional(),
});
export type NewPhotoCardItem = z.input<typeof NewPhotoCardItemSchema>;
export type PhotoCardItem = z.infer<typeof NewPhotoCardItemSchema> & { id: string; addedAt: string };

/** Paper that costs extra. Matte is the base stock the band price covers. */
const PREMIUM_PAPER = new Set(["pearl"]);

export class PhotoCardQuantityError extends Error {
  constructor(public allowed: number[]) {
    super(`Choose ${allowed.join(", ")} cards.`);
  }
}

export function allowedQuantities(product: PhotoCardProduct, cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): number[] {
  return cfg.phase1Quantities[product].filter((q) => q >= cfg.minQty && q <= cfg.maxQty[product]);
}

export function isAllowedQuantity(product: PhotoCardProduct, q: number, cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): boolean {
  return Number.isInteger(q) && allowedQuantities(product, cfg).includes(q);
}

/** Index of the band a quantity falls in (last band whose start <= quantity). Below the minimum is -1. */
export function bandIndex(qty: number, cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): number {
  let found = -1;
  cfg.bands.forEach((start, i) => {
    if (qty >= start) found = i;
  });
  return found;
}

export type PhotoCardLinePrice = {
  bandIndex: number;
  unitCents: number;
  addonUnitCents: number;
  /** Cards x band price. Taxed as printed goods; envelopes are included, never a separate line. */
  productCents: number;
  paperCents: number;
  envelopesIncluded: boolean;
};

export function priceBatchLine(item: Pick<PhotoCardItem, "product" | "quantity" | "paper">, cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): PhotoCardLinePrice {
  const band = bandIndex(item.quantity, cfg);
  if (band < 0 || item.quantity > cfg.maxQty[item.product]) throw new PhotoCardQuantityError(allowedQuantities(item.product, cfg));
  const unitCents = cfg.unitCentsByBand[item.product][band];
  const addonUnitCents = PREMIUM_PAPER.has(item.paper) ? cfg.addOnUnitCents.premium_paper : 0;
  return {
    bandIndex: band,
    unitCents,
    addonUnitCents,
    productCents: unitCents * item.quantity,
    paperCents: addonUnitCents * item.quantity,
    envelopesIncluded: cfg.envelopeIncluded[item.product],
  };
}

export type PhotoCardTotals = {
  cardCount: number;
  productCents: number;
  paperCents: number;
  /** Ship-to-me is charged once per ORDER, not per line. */
  shippingCents: number;
  /** Cart tax stays a placeholder like the shared cart; Stripe Tax computes the real figure at payment. */
  taxCents: 0;
  taxEstimated: true;
  totalCents: number;
};

export function computePhotoCardTotals(items: PhotoCardItem[], cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): PhotoCardTotals {
  let productCents = 0;
  let paperCents = 0;
  let cardCount = 0;
  for (const it of items) {
    const p = priceBatchLine(it, cfg);
    productCents += p.productCents;
    paperCents += p.paperCents;
    cardCount += it.quantity;
  }
  const shippingCents = items.length > 0 ? cfg.delivery.ship_to_me.orderCents : 0;
  return { cardCount, productCents, paperCents, shippingCents, taxCents: 0, taxEstimated: true, totalCents: productCents + paperCents + shippingCents };
}

/** Same design version, size, paper, envelopes and delivery merge into one line. */
export function sameBatchLine(a: PhotoCardItem, b: z.infer<typeof NewPhotoCardItemSchema>): boolean {
  return a.creationId === b.creationId && a.designVersion === b.designVersion && a.product === b.product && a.sizeId === b.sizeId && a.paper === b.paper && a.envelopes === b.envelopes && a.delivery.mode === b.delivery.mode;
}

export function addPhotoCardToCart(
  items: PhotoCardItem[],
  input: NewPhotoCardItem,
  cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG,
  now: Date = new Date(),
  newId: () => string = () => crypto.randomUUID(),
): PhotoCardItem[] {
  const parsed = NewPhotoCardItemSchema.parse(input);
  const existing = items.find((i) => sameBatchLine(i, parsed));
  const quantity = (existing?.quantity ?? 0) + parsed.quantity;
  if (!isAllowedQuantity(parsed.product, quantity, cfg)) throw new PhotoCardQuantityError(allowedQuantities(parsed.product, cfg));
  if (existing) return items.map((i) => (i === existing ? { ...i, quantity } : i));
  return [...items, { ...parsed, id: newId(), addedAt: now.toISOString() }];
}

/** Sets a line to an allowed quantity. Anything else is refused: the cart comes back unchanged with the error. */
export function setPhotoCardQuantity(items: PhotoCardItem[], id: string, quantity: number, cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): { items: PhotoCardItem[]; error?: PhotoCardQuantityError } {
  const line = items.find((i) => i.id === id);
  if (!line) return { items };
  if (!isAllowedQuantity(line.product, quantity, cfg)) return { items, error: new PhotoCardQuantityError(allowedQuantities(line.product, cfg)) };
  return { items: items.map((i) => (i.id === id ? { ...i, quantity } : i)) };
}

export const removePhotoCard = (items: PhotoCardItem[], id: string): PhotoCardItem[] => items.filter((i) => i.id !== id);

export const describePhotoCard = (item: PhotoCardItem): string =>
  `${item.quantity} holiday photo cards, 5x7, blank envelopes included${item.paper === "pearl" ? ", pearl paper" : ""}`;
