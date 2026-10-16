import type { CheckoutLine } from "../../adapters/types";
import { describePhotoCard, priceBatchLine, type PhotoCardItem } from "./cart";
import { PHOTO_CARD_PRICE_CONFIG, type PhotoCardPriceConfig } from "./priceConfig";

/**
 * Stripe lines for photo card items (finance/ops/photo-events-tax-and-postage.md section 1 and 8):
 * - each print product line carries the print tax code, exclusive; envelopes are included in the card price, no line;
 * - premium paper is its own line (refunds and reprints split cleanly) with the same print code;
 * - ship-to-me is one line per ORDER with the shipping code (finance ops prefers a Checkout shipping rate; the fake and
 *   the current adapter only take lines, so it is a line until the shop moves to shipping_options);
 * - no $0 lines are sent (AI background, blank envelopes).
 * Built from the server's cart and the config, never from client prices. No Stripe call is made here.
 */
export function buildPhotoCardCheckoutLines(items: PhotoCardItem[], cfg: PhotoCardPriceConfig = PHOTO_CARD_PRICE_CONFIG): CheckoutLine[] {
  const lines: CheckoutLine[] = [];
  for (const it of items) {
    const p = priceBatchLine(it, cfg);
    lines.push({ sku: "photo_card", description: `${it.title} (${describePhotoCard(it)})`, unitAmountCents: p.unitCents, quantity: it.quantity, creationId: it.creationId, taxCode: cfg.taxCodes.print });
    if (p.addonUnitCents > 0) lines.push({ sku: "photo_card_paper", description: `Premium paper for ${it.title}`, unitAmountCents: p.addonUnitCents, quantity: it.quantity, taxCode: cfg.taxCodes.print });
  }
  if (items.length > 0 && cfg.delivery.ship_to_me.orderCents > 0) {
    lines.push({ sku: "shipping_ship_to_me", description: "Shipping to you", unitAmountCents: cfg.delivery.ship_to_me.orderCents, quantity: 1, taxCode: cfg.taxCodes.shipping });
  }
  return lines;
}
