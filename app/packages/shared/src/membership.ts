/**
 * Membership tiers and what each unlocks. The tier data is the CFO's entitlements spec copied verbatim from
 * docs/finance/membership-plan.md (version 2026-10-14); change prices or limits there first, then here.
 * Numbers are monthly quotas unless the key says otherwise; -1 = unlimited.
 */
export const MEMBERSHIP_SPEC = {
  version: "2026-10-14",
  tiers: [
    { id: "free", name: "Free", monthlyCents: 0, annualCents: 0, trialDays: 0,
      features: { preset_handwriting: true, typed_signature_on_card: true, own_handwriting_styles: 1, own_handwriting_print: false, saved_signatures: 0, apply_to_new_cards: false, ai_message_writes_per_month: 10, card_redraws_per_month: 5, book_page_redraws_per_book: 3, drafts_retention_days: 90, digital_card_credits_per_month: 0, mailed_card_credits_per_month: 0, mailed_card_credit_bank_max: 0, printed_card_discount_pct: 0 } },
    { id: "plus", name: "Plus", monthlyCents: 399, annualCents: 3599, trialDays: 14,
      features: { preset_handwriting: true, typed_signature_on_card: true, own_handwriting_styles: 3, own_handwriting_print: true, saved_signatures: 5, apply_to_new_cards: true, ai_message_writes_per_month: 100, card_redraws_per_month: 30, book_page_redraws_per_book: 6, drafts_retention_days: 365, digital_card_credits_per_month: 1, mailed_card_credits_per_month: 0, mailed_card_credit_bank_max: 0, printed_card_discount_pct: 0 } },
    { id: "card_club", name: "Card Club", monthlyCents: 999, annualCents: 9900, trialDays: 0,
      features: { preset_handwriting: true, typed_signature_on_card: true, own_handwriting_styles: 3, own_handwriting_print: true, saved_signatures: 5, apply_to_new_cards: true, ai_message_writes_per_month: 100, card_redraws_per_month: 30, book_page_redraws_per_book: 6, drafts_retention_days: 365, digital_card_credits_per_month: 1, mailed_card_credits_per_month: 1, mailed_card_credit_bank_max: 3, printed_card_discount_pct: 10 } },
  ],
  rules: { quotaPeriod: "Paid tiers: the Stripe billing period (monthly slices for annual plans). Free: calendar month, UTC.", unlimited: -1, pastDueGraceDays: 7 },
} as const;

export type MembershipTier = (typeof MEMBERSHIP_SPEC.tiers)[number];
export type TierId = MembershipTier["id"];
export type Features = { -readonly [K in keyof MembershipTier["features"]]: MembershipTier["features"][K] extends boolean ? boolean : number };
export type FeatureKey = keyof Features;

export const TIER_IDS = MEMBERSHIP_SPEC.tiers.map((t) => t.id) as TierId[];
export const tierById = (id: string): MembershipTier => MEMBERSHIP_SPEC.tiers.find((t) => t.id === id) ?? MEMBERSHIP_SPEC.tiers[0];

/**
 * Tiers that can be bought today. Card Club's included mailed cards and member discount are applied at card checkout,
 * which arrives with the signed-in card flow (docs/PLAN.md B4); until then it is shown as coming soon, never sold.
 */
export const PURCHASABLE_TIERS: readonly TierId[] = ["plus"];

/**
 * What everyone gets while memberships are switched off (production until the owner sets GREETHUB_MEMBERSHIP=1):
 * today's behaviour, so turning the feature off never takes anything away.
 */
export const LAUNCH_FEATURES: Features = {
  preset_handwriting: true,
  typed_signature_on_card: true,
  own_handwriting_styles: 3,
  own_handwriting_print: true,
  saved_signatures: 5,
  apply_to_new_cards: true,
  ai_message_writes_per_month: -1,
  card_redraws_per_month: -1,
  book_page_redraws_per_book: 3,
  drafts_retention_days: 90,
  digital_card_credits_per_month: 0,
  mailed_card_credits_per_month: 0,
  mailed_card_credit_bank_max: 0,
  printed_card_discount_pct: 0,
};

/** Monthly price as shown on a plan card: annual plans quote their per-month equivalent too. */
export const perMonthCents = (t: MembershipTier, interval: "month" | "year") => (interval === "year" ? Math.round(t.annualCents / 12) : t.monthlyCents);
export const annualSavingsPct = (t: MembershipTier) => (t.monthlyCents ? Math.round((1 - t.annualCents / (t.monthlyCents * 12)) * 100) : 0);
