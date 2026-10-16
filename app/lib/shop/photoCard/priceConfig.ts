/**
 * Photo card price config (USD cents). This is a verbatim copy of the CFO proposal in
 * docs/finance/photo-events-pricing.md section 10 (status: proposal_not_approved).
 * It lives here ONLY because app/packages/shared/src/pricing.ts is not in the shop lane. The CFO moves it to
 * PRICING.batch on owner approval; every function in this folder takes the config as a parameter, so the move is one import.
 * Logic must never hold a price: tests inject their own config to prove it.
 */
export type PhotoCardProduct = "holiday_flat_5x7";

export type PhotoCardPriceConfig = {
  version: string;
  status: "proposal_not_approved" | "approved";
  minQty: number;
  /** Band starts. A quantity belongs to the last band whose start is <= quantity. */
  bands: number[];
  /** Phase 1 allow-list of orderable quantities per product (PM roadmap: 25, 50, 100). */
  phase1Quantities: Record<PhotoCardProduct, number[]>;
  maxQty: Record<PhotoCardProduct, number>;
  pricingRule: "all_units_at_band_price";
  unitCentsByBand: Record<PhotoCardProduct, number[]>;
  envelopeIncluded: Record<PhotoCardProduct, boolean>;
  addOnUnitCents: { premium_paper: number; ai_background: number };
  delivery: { ship_to_me: { orderCents: number } };
  /** Stripe tax codes by line type (finance/ops/photo-events-tax-and-postage.md section 1). The accountant confirms them. */
  taxCodes: { print: string; shipping: string };
};

export const PHOTO_CARD_PRICE_CONFIG: PhotoCardPriceConfig = {
  version: "2026-10-14",
  status: "proposal_not_approved",
  minQty: 10,
  bands: [10, 25, 50, 100, 200],
  phase1Quantities: { holiday_flat_5x7: [25, 50, 100] },
  maxQty: { holiday_flat_5x7: 200 },
  pricingRule: "all_units_at_band_price",
  unitCentsByBand: { holiday_flat_5x7: [249, 199, 179, 159, 149] },
  envelopeIncluded: { holiday_flat_5x7: true },
  addOnUnitCents: { premium_paper: 40, ai_background: 0 },
  delivery: { ship_to_me: { orderCents: 699 } },
  // Same code as the folded card until the accountant answers question 25 (txcd_99999999 = General - Tangible Goods).
  taxCodes: { print: "txcd_99999999", shipping: "txcd_92010001" },
};
