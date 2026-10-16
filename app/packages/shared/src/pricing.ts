/**
 * THE ONE PLACE launch prices live. The CFO changes numbers here and nowhere else.
 * Source: finance/README.md "Launch prices (inputs)". All amounts are integer US cents.
 * Prices exclude tax; tax is worked out at payment.
 */
export const PRICING = {
  currency: "usd",
  /** Items sold. `postageCents` is charged per printed unit and covers shipping. */
  skus: {
    card_digital: { label: "Digital card", cents: 399, postageCents: 0, printed: false },
    card_mailed: { label: "Mailed card", cents: 799, postageCents: 299, printed: true },
    // Ready Cards (stock cards). CFO proposal docs/finance/stock-cards-pricing.md, NOT owner-approved. Postage unchanged.
    stock_card_digital: { label: "Ready-made digital card", cents: 349, postageCents: 0, printed: false },
    stock_card_mailed: { label: "Ready-made mailed card", cents: 749, postageCents: 299, printed: true },
    book_digital: { label: "Digital book", cents: 1999, postageCents: 0, printed: false },
    book_24: { label: "Picture book, 24 pages", cents: 3900, postageCents: 599, printed: true },
    book_32: { label: "Picture book, 32 pages", cents: 4900, postageCents: 599, printed: true },
  },
  /** Shipping methods offered at checkout. Standard postage is already inside each SKU's postageCents. */
  shippingMethods: {
    standard: { label: "Standard", blurb: "Postage included. Usually a few days after we print it.", extraCents: 0, enabled: true },
    // PLACEHOLDER: not in the CFO model. Flat surcharge once per order that contains printed items. CFO to confirm or switch off.
    express: { label: "Express", blurb: "Faster courier service.", extraCents: 899, enabled: true },
  },
  /** PLACEHOLDER until Stripe Tax is on. 0 means "worked out at payment". */
  taxRate: 0,
  /** Earliest "arrive by" date, in days from today. Printer lead time estimate; confirm with printer sandbox data. */
  earliestDeliveryDays: 7,
  /** Countries we ship to at launch (site-copy FAQ: "We ship to the US to start"). */
  shipCountries: ["US"],
} as const;

export type Sku = keyof typeof PRICING.skus;
export type ShippingMethodId = keyof typeof PRICING.shippingMethods;

export const SKUS = Object.keys(PRICING.skus) as Sku[];

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${String(rem).padStart(2, "0")}`;
}

/** Whole-dollar friendly: $39 instead of $39.00. */
export function formatMoneyShort(cents: number): string {
  return cents % 100 === 0 ? `$${(cents / 100).toLocaleString("en-US")}` : formatMoney(cents);
}

/** Values for the {card_digital}-style tokens in docs/cmo/site-copy.md. */
export function priceTokens(): Record<string, string> {
  const s = PRICING.skus;
  return {
    card_digital: formatMoneyShort(s.card_digital.cents),
    card_mailed: formatMoneyShort(s.card_mailed.cents),
    book_24: formatMoneyShort(s.book_24.cents),
    book_32: formatMoneyShort(s.book_32.cents),
    shipping_card: formatMoneyShort(s.card_mailed.postageCents),
    shipping_book: formatMoneyShort(s.book_24.postageCents),
  };
}

export function enabledShippingMethods(): { id: ShippingMethodId; label: string; blurb: string; extraCents: number }[] {
  return (Object.keys(PRICING.shippingMethods) as ShippingMethodId[])
    .filter((id) => PRICING.shippingMethods[id].enabled)
    .map((id) => ({ id, ...PRICING.shippingMethods[id] }));
}
