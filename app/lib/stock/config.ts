import catalog from "./catalog.json";

/**
 * Stock card settings. Message limits come from the catalog file (product.insideMessageMaxChars, 110 today), so the
 * designer and the app cannot disagree. NOTE: docs/cx says "up to 180" and docs/cto says "about 420"; the Head of Design's
 * 110 is used because the placeholder art and default lines were written against it. Change it in the catalog.
 * No prices here: they live in packages/shared/src/pricing.ts (PRICING.skus.stock_card_*).
 */
export const STOCK_LIMITS = {
  maxChars: catalog.product.insideMessageMaxChars as number,
  /** Hard line cap for a typed inside; the layout shrinks text first, this is the budget that still reads. */
  maxLines: 8,
  maxWordChars: 24,
  signOffMaxChars: 40,
};

/** Which SKU each format uses. SKU keys are looked up in PRICING; no numbers here. */
export const STOCK_SKU = { mailed: "stock_card_mailed", digital: "stock_card_digital" } as const;

export const STOCK_PLACEHOLDER_ART = "/stock/placeholder";
