import { PRICING } from "@greethub/shared";

/** Free full-page redraws per book (the CMO spec shows "Re-roll this page (3 left)"). */
export const REROLL_ALLOWANCE = 3;
/** Free redos of the character model sheet; further redos use a re-roll. */
export const SHEET_FREE_REDOS = 2;
export const MAX_PHOTOS_PER_CHARACTER = 4;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MIN_PHOTO_SHORT_EDGE = 600;
export const CONSENT_WORDING_VERSION = "2026-10-v2";
export const PHOTO_RETENTION_DAYS = 90;
/** USD hard cap on model spend per book project (all jobs). Override with GREETHUB_BOOK_SPEND_CAP_USD. */
export const DEFAULT_PROJECT_SPEND_CAP_USD = 4;

export const PAGE_ID = { cover: "cover", back: "back" } as const;

export const BOOK_PRICE_CENTS = { 24: PRICING.skus.book_24.cents, 32: PRICING.skus.book_32.cents } as const;

export const OCCASION_LABELS: Record<string, string> = {
  birthday: "Birthday",
  new_baby: "New baby",
  christmas: "Christmas",
  graduation: "Graduation",
  anniversary: "Anniversary",
  thank_you: "Thank you",
  get_well: "Get well",
  congratulations: "Congratulations",
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  valentines: "Valentine's Day",
  wedding: "Wedding",
  just_because: "Just because",
  other: "Something else",
};
/** Occasions offered for books (intake-questions.md section 3.1), mapped onto the schema enum. */
export const BOOK_OCCASIONS = ["birthday", "new_baby", "christmas", "graduation", "anniversary", "thank_you", "just_because", "other"] as const;

export const TONE_LABELS = { funny: "Funny", heartfelt: "Heartfelt", adventurous: "Adventurous" } as const;
export const AGE_BAND_LABELS = { baby: "Baby", toddler: "Toddler", child: "Child", teen: "Teen", adult: "Adult", senior: "Older adult", pet: "Pet" } as const;

/** Words per page the reading age should land in (intake-questions.md section 5). */
export const WORDS_PER_PAGE: Record<string, [number, number]> = { "0-2": [8, 15], "3-5": [20, 35], "6-8": [40, 70] };
export const READING_AGE_LABELS: Record<string, string> = { "0-2": "0 to 2", "3-5": "3 to 5", "6-8": "6 to 8" };
