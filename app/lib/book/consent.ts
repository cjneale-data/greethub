import { CONSENT_WORDING_VERSION, MAX_PHOTOS_PER_CHARACTER } from "./constants";
import type { BriefForm, CharacterForm, ConsentBoxes, ConsentRecord, PhotoRecord } from "./types";

/**
 * Photo consent, per docs/legal/02-children-photos-privacy.md section 6 and docs/legal/06-product-requirements.md A.
 * Wording is a draft for the attorney to finalise; changing it bumps CONSENT_WORDING_VERSION, which re-prompts everyone.
 * Boxes A and B are required, C and D are optional, all start unticked.
 * This module is browser-safe (no node imports).
 */
export const CONSENT_TEXT = {
  a: "I am the parent or legal guardian of every child in these photos, or I have written permission from their parent or legal guardian, and I have the permission of every adult shown. I am at least 18 years old.",
  // The "we do not train on photos" sentence ships only once zero-data-retention is confirmed for every route (06 req 8, 14).
  b: "I understand GreetHub will send these photos to AI image and language services (OpenRouter, Google, Anthropic) to create illustrations, and to print partners (Lulu, Prodigi) only as finished artwork. We do not identify anyone by face, and do not sell or share photos for advertising. Photos are deleted after 90 days unless I choose to keep a saved Person.",
  c: "Keep my approved character for reuse until I delete it.",
  d: "GreetHub may show my finished pages as an example on its website or ads.",
} as const;

export const PHOTO_PRIVACY_LINE = "Your photos are private, used only to draw this book, and deleted after 90 days unless you save the person.";

/** Short, stable fingerprint of the wording a user saw (FNV-1a), stored with the consent log. */
export function consentHash(): string {
  const s = JSON.stringify(CONSENT_TEXT) + CONSENT_WORDING_VERSION;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export const emptyBoxes = (): ConsentBoxes => ({ a: false, b: false, c: false, d: false });

/** Uploads are allowed only once A and B are both ticked. */
export const requiredBoxesTicked = (b: Pick<ConsentBoxes, "a" | "b">): boolean => b.a === true && b.b === true;

/** Humans need a photo; pets are optional. */
export function needsPhoto(c: Pick<CharacterForm, "isPet" | "ageBand">): boolean {
  return !c.isPet && c.ageBand !== "pet";
}

/** A usable consent: current wording, A and B ticked, not withdrawn. */
export function consentValid<T extends Pick<ConsentRecord, "withdrawnAt" | "wordingVersion" | "boxes">>(c: T | undefined | null): c is T {
  return !!c && !c.withdrawnAt && c.wordingVersion === CONSENT_WORDING_VERSION && requiredBoxesTicked(c.boxes);
}

export type GateProblem = { characterId?: string; code: "no_consent" | "no_photo" | "too_many"; message: string };

/**
 * The consent gate for the photo step: consent first (A and B), then every human has a photo.
 * `boxes` is what is recorded (or, in the browser, currently ticked).
 */
export function evaluateConsentGate(
  brief: Pick<BriefForm, "characters">,
  photos: Pick<PhotoRecord, "characterId">[],
  boxes: Pick<ConsentBoxes, "a" | "b"> | null | undefined,
): { ok: boolean; problems: GateProblem[] } {
  const problems: GateProblem[] = [];
  if (!boxes || !requiredBoxesTicked(boxes)) problems.push({ code: "no_consent", message: "Tick both boxes to add photos." });
  for (const c of brief.characters) {
    const count = photos.filter((p) => p.characterId === c.id).length;
    const who = c.name || "this person";
    if (count === 0 && needsPhoto(c)) problems.push({ characterId: c.id, code: "no_photo", message: `Add a photo of ${who}.` });
    if (count > MAX_PHOTOS_PER_CHARACTER) problems.push({ characterId: c.id, code: "too_many", message: `Up to ${MAX_PHOTOS_PER_CHARACTER} photos of ${who}.` });
  }
  return { ok: problems.length === 0, problems };
}

export function buildConsentRecord(input: {
  id: string;
  userId: string;
  boxes: ConsentBoxes;
  now: Date;
  ip: string;
  userAgent: string;
  photoIds: string[];
  characterLabels: string[];
}): ConsentRecord {
  return {
    id: input.id,
    userId: input.userId,
    recordedAt: input.now.toISOString(),
    ip: input.ip,
    userAgent: input.userAgent.slice(0, 300),
    wordingVersion: CONSENT_WORDING_VERSION,
    wordingHash: consentHash(),
    boxes: input.boxes,
    photoIds: input.photoIds,
    characterLabels: input.characterLabels,
  };
}

/** Every current photo was uploaded under this consent record. */
export function consentCovers(consent: Pick<ConsentRecord, "id" | "withdrawnAt" | "wordingVersion" | "boxes"> | undefined, photos: Pick<PhotoRecord, "consentId">[]): boolean {
  return consentValid(consent) && photos.every((p) => p.consentId === consent.id);
}
