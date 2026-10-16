import { PRICING, priceLine, type CardCartItem, type LinePrice, type Sku } from "@greethub/shared";
import { STOCK_SKU } from "./config";
import type { StockFormat } from "./types";

/** The SKU a stock card sells under. Numbers live in PRICING.skus, never here. */
export const stockSku = (format: StockFormat): Sku => STOCK_SKU[format];

/** Price one stock card line through the shared cart math (the same rule checkout uses). */
export function quoteStockCard(format: StockFormat, quantity = 1): LinePrice {
  const item: CardCartItem = { id: "quote", addedAt: "", kind: "card", source: "stock", creationId: "quote", title: "quote", format, mailTo: "buyer", quantity };
  return priceLine(item);
}

/** For the editor's price line: merchandise, postage and all-in cents, straight from PRICING. */
export function stockPriceInfo(format: StockFormat) {
  const def = PRICING.skus[stockSku(format)];
  return { sku: stockSku(format), merchandiseCents: def.cents, postageCents: def.postageCents, printed: def.printed, allInCents: def.cents + def.postageCents };
}
