import type { SetConsentBoxes, SetConsentRecord } from "./types";

/**
 * Photo-card consent variant (docs/book/photo-intake-reuse.md section 5). DRAFT wording for the attorney.
 * Separate text and version from the book's CONSENT_TEXT, so changing one never re-prompts the other.
 * No box C (saved library) and no box D (marketing examples) for real family photos. Browser-safe.
 */
export const PHOTO_CARD_CONSENT_VERSION = "2026-10-pc1";
export const PHOTO_CARD_CONSENT_TEXT = {
  a: "I am the parent or legal guardian of every child in these photos, or I have written permission from their parent or legal guardian, and I have the permission of every adult shown. I am at least 18 years old.",
  b: "I understand GreetHub keeps these photos private, runs an automated safety check on each one (a service that looks at the photo), and prints them on the cards I order. The print partner receives them inside the print file. If I choose mail-for-me or an event page, the people on my list will see them. Photos are deleted 90 days after my order is complete.",
  bAi: "Send my photos to AI services to help with this card.",
} as const;

export function photoCardConsentHash(): string {
  const s = JSON.stringify(PHOTO_CARD_CONSENT_TEXT) + PHOTO_CARD_CONSENT_VERSION;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export const requiredSetBoxesTicked = (b: { a?: boolean; b?: boolean } | null | undefined): boolean => !!b && b.a === true && b.b === true;

/** A usable consent: current photo-card wording, A and B ticked, not withdrawn. */
export function setConsentValid<T extends Pick<SetConsentRecord, "withdrawnAt" | "wordingVersion" | "boxes">>(c: T | undefined | null): c is T {
  return !!c && !c.withdrawnAt && c.wordingVersion === PHOTO_CARD_CONSENT_VERSION && requiredSetBoxesTicked(c.boxes);
}

export function buildSetConsentRecord(i: {
  id: string;
  userId: string;
  boxes: { a: boolean; b: boolean; bAi?: boolean };
  now: Date;
  ip: string;
  userAgent: string;
  photoIds: string[];
}): SetConsentRecord {
  const boxes: SetConsentBoxes = { a: i.boxes.a, b: i.boxes.b, bAi: !!i.boxes.bAi };
  return {
    id: i.id,
    userId: i.userId,
    recordedAt: i.now.toISOString(),
    ip: i.ip,
    userAgent: i.userAgent.slice(0, 300),
    variant: "photo_card",
    wordingVersion: PHOTO_CARD_CONSENT_VERSION,
    wordingHash: photoCardConsentHash(),
    boxes,
    photoIds: i.photoIds,
  };
}
