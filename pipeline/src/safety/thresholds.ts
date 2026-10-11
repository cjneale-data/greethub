/**
 * Output vision-check thresholds (legal 06 req 19). One place to tune and to show the attorney.
 */

/** character_lookalike_risk is a 0-10 score from the vision model: 0 = clearly original, 10 = clearly a known character.
 *  A page FAILS the IP check at or above this score. 6 is deliberately cautious: close look-alikes are the risky zone,
 *  not just exact copies. Lower it to be stricter; expect more re-rolls (each costs about one render). */
export const LOOKALIKE_RISK_FAIL_AT = 6;

/** Automatic re-rolls for an IP failure before the page is blocked. Spec: once. */
export const IP_MAX_AUTO_REROLLS = 1;

/** Boolean/name flags that fail a page on their own, whatever the score. */
export const IP_HARD_FLAGS = ["recognizable_protected_character", "logo_or_brand_mark", "slogan_or_trademarked_text", "licensed_merch_on_clothing"] as const;
