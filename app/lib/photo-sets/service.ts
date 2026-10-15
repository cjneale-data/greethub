import { buildSetConsentRecord, requiredSetBoxesTicked, setConsentValid } from "./consent";
import { MAX_PHOTOS_PER_SET, MAX_SETS_PER_USER, PHOTO_CARD_LIMITS } from "./constants";
import { ingestPhoto, newSetId, safeSegment, type SetStorage } from "./ingest";
import type { SetStore } from "./store";
import { SetError, type DerivedFile, type PhotoSet, type PhotoSetView, type StoredPhoto } from "./types";

export type SetDeps = { sets: SetStore; storage: SetStorage; mock: boolean; now?: () => Date };
const nowOf = (d: SetDeps) => (d.now ?? (() => new Date()))();
const iso = (d: SetDeps) => nowOf(d).toISOString();

async function mustOwn(d: SetDeps, userId: string, id: string): Promise<PhotoSet> {
  const s = await d.sets.get(id);
  if (!s || s.userId !== userId) throw new SetError(404, "not_found", "We couldn't find those photos.");
  return s;
}

export function viewOf(s: PhotoSet): PhotoSetView {
  return {
    id: s.id,
    designIds: s.designIds,
    photos: s.photos.map((p) => ({ id: p.id, width: p.width, height: p.height, deleteBy: p.expiresAt, focus: p.focus })),
    consent: s.consent ? { recordedAt: s.consent.recordedAt, boxes: s.consent.boxes, withdrawnAt: s.consent.withdrawnAt } : undefined,
    consentOk: setConsentValid(s.consent),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export async function createPhotoSet(d: SetDeps, userId: string): Promise<PhotoSetView> {
  safeSegment(userId);
  if ((await d.sets.listByUser(userId)).length >= MAX_SETS_PER_USER) throw new SetError(429, "too_many_sets", "You have the most photo sets we keep at once. Finish or delete one first.");
  const t = iso(d);
  const id = newSetId("ps");
  const row = await d.sets.mutate(id, () => ({ id, userId, designIds: [], photos: [], derived: [], consentHistory: [], holds: [], createdAt: t, updatedAt: t }));
  return viewOf(row!);
}

export async function getPhotoSet(d: SetDeps, userId: string, id: string): Promise<PhotoSetView> {
  return viewOf(await mustOwn(d, userId, id));
}

/** Consent comes first: A and B ticked, logged with the wording hash, before any upload. Re-recording moves the photos under the new record. */
export async function recordSetConsent(d: SetDeps, userId: string, id: string, input: { boxes: { a: boolean; b: boolean; bAi?: boolean }; ip: string; userAgent: string }): Promise<PhotoSetView> {
  await mustOwn(d, userId, id);
  if (!requiredSetBoxesTicked(input.boxes)) throw new SetError(403, "consent_required", "Tick both boxes to add photos.");
  const next = await d.sets.mutate(id, (s) => {
    if (!s) return s;
    const rec = buildSetConsentRecord({ id: newSetId("cn"), userId, boxes: input.boxes, now: nowOf(d), ip: input.ip, userAgent: input.userAgent, photoIds: s.photos.map((p) => p.id) });
    for (const p of s.photos) p.consentId = rec.id;
    if (s.consent && !s.consentHistory.some((h) => h.id === s.consent!.id)) s.consentHistory.push(s.consent);
    s.consent = rec;
    s.updatedAt = iso(d);
    return s;
  });
  return viewOf(next!);
}

/** Deletes every file of one photo. */
const removeFiles = (d: SetDeps, p: Pick<StoredPhoto, "path" | "previewPath">) => Promise.all([d.storage.remove(p.path), d.storage.remove(p.previewPath)]);

/**
 * Adds one photo (1 to MAX_PHOTOS_PER_SET per set). Safe to run several uploads at once and safe for the store to
 * re-run the updater: the push is skipped when the id is already there, and the cap and consent are re-checked
 * inside the updater, so a parallel upload or a withdrawal cannot slip past.
 */
export async function addSetPhoto(d: SetDeps, userId: string, id: string, data: Uint8Array): Promise<PhotoSetView> {
  const cur = await mustOwn(d, userId, id);
  if (!setConsentValid(cur.consent)) throw new SetError(403, "consent_required", "Tick both boxes before adding photos.");
  if (cur.photos.length >= MAX_PHOTOS_PER_SET) throw new SetError(422, "too_many", `Up to ${MAX_PHOTOS_PER_SET} photos per card.`);
  // Logo and costume warnings are dropped: a photo card prints them as is (IP safety decides, docs/book/photo-intake-reuse.md section 6).
  const { photo } = await ingestPhoto(d, { userId, setId: id, data, consentId: cur.consent.id, limits: PHOTO_CARD_LIMITS });

  const res: { err?: SetError } = {};
  const next = await d.sets.mutate(id, (s) => {
    res.err = undefined;
    if (!s) return s;
    if (s.photos.some((p) => p.id === photo.id)) return s;
    if (!setConsentValid(s.consent)) { res.err = new SetError(403, "consent_required", "Tick both boxes before adding photos."); return s; }
    if (s.photos.length >= MAX_PHOTOS_PER_SET) { res.err = new SetError(422, "too_many", `Up to ${MAX_PHOTOS_PER_SET} photos per card.`); return s; }
    s.photos.push({ ...photo, consentId: s.consent!.id });
    if (!s.consent!.photoIds.includes(photo.id)) s.consent!.photoIds.push(photo.id);
    s.updatedAt = iso(d);
    return s;
  });
  if (res.err || !next) {
    await removeFiles(d, photo);
    throw res.err ?? new SetError(404, "not_found", "We couldn't find those photos.");
  }
  return viewOf(next);
}

export async function removeSetPhoto(d: SetDeps, userId: string, id: string, photoId: string): Promise<PhotoSetView> {
  const cur = await mustOwn(d, userId, id);
  const photo = cur.photos.find((p) => p.id === photoId);
  if (!photo) throw new SetError(404, "not_found", "We couldn't find that photo.");
  await removeFiles(d, photo);
  // Print files built from this photo contain it, so they go too.
  const derived = cur.derived;
  await Promise.all(derived.map((f) => d.storage.remove(f.path)));
  const next = await d.sets.mutate(id, (s) => {
    if (!s) return s;
    s.photos = s.photos.filter((p) => p.id !== photoId);
    s.derived = s.derived.filter((f) => !derived.some((x) => x.id === f.id));
    for (const c of [s.consent, ...s.consentHistory]) if (c) c.photoIds = c.photoIds.filter((x) => x !== photoId);
    s.updatedAt = iso(d);
    return s;
  });
  return viewOf(next!);
}

export async function readSetPhoto(d: SetDeps, userId: string, id: string, photoId: string, variant: "original" | "preview" = "original"): Promise<{ data: Buffer; contentType: string }> {
  const s = await mustOwn(d, userId, id);
  const p = s.photos.find((x) => x.id === photoId);
  if (!p) throw new SetError(404, "not_found", "We couldn't find that photo.");
  return { data: await d.storage.read(variant === "preview" ? p.previewPath : p.path), contentType: p.contentType };
}

/** Withdrawal deletes every photo, preview and print file now. Orders already sent to print cannot be recalled. */
export async function withdrawSetConsent(d: SetDeps, userId: string, id: string): Promise<PhotoSetView> {
  const cur = await mustOwn(d, userId, id);
  for (const p of cur.photos) await removeFiles(d, p);
  for (const f of cur.derived) await d.storage.remove(f.path);
  const next = await d.sets.mutate(id, (s) => {
    if (!s) return s;
    if (s.consent && !s.consent.withdrawnAt) s.consent.withdrawnAt = iso(d);
    s.photos = [];
    s.derived = [];
    s.updatedAt = iso(d);
    return s;
  });
  return viewOf(next!);
}

export async function attachDesign(d: SetDeps, userId: string, id: string, designId: string): Promise<PhotoSetView> {
  await mustOwn(d, userId, id);
  const next = await d.sets.mutate(id, (s) => {
    if (!s) return s;
    if (!s.designIds.includes(designId)) s.designIds.push(designId);
    s.updatedAt = iso(d);
    return s;
  });
  return viewOf(next!);
}

export type SetGateProblem = { code: "no_consent" | "no_photo" | "too_many"; message: string };

/** The photo step is done when consent is valid and there are 1 to MAX_PHOTOS_PER_SET photos. Placement and DPI belong to the collage engine. */
export function evaluateSetGate(s: Pick<PhotoSet, "consent" | "photos">): { ok: boolean; problems: SetGateProblem[] } {
  const problems: SetGateProblem[] = [];
  if (!setConsentValid(s.consent)) problems.push({ code: "no_consent", message: "Tick both boxes to add photos." });
  if (s.photos.length === 0) problems.push({ code: "no_photo", message: "Add at least one photo." });
  if (s.photos.length > MAX_PHOTOS_PER_SET) problems.push({ code: "too_many", message: `Up to ${MAX_PHOTOS_PER_SET} photos per card.` });
  return { ok: problems.length === 0, problems };
}

/** Render step: record a file built from the photos so the purge deletes it with them. Idempotent on path. */
export async function registerDerivedFile(d: SetDeps, id: string, f: Omit<DerivedFile, "id" | "createdAt">): Promise<void> {
  await d.sets.mutate(id, (s) => {
    if (!s) return s;
    if (!s.derived.some((x) => x.path === f.path)) s.derived.push({ ...f, id: newSetId("df"), createdAt: iso(d) });
    return s;
  });
}

/** Add-to-cart: hold the photos for this order so the purge cannot delete them before the print file exists. Idempotent. */
export async function placeOrderHold(d: SetDeps, id: string, orderId: string): Promise<void> {
  await d.sets.mutate(id, (s) => {
    if (!s) return s;
    if (!s.holds.some((h) => h.orderId === orderId)) s.holds.push({ orderId, placedAt: iso(d) });
    return s;
  });
}

/** Order final (delivered, cancelled or refunded): the 90-day clock starts. Idempotent. */
export async function markOrderFinal(d: SetDeps, id: string, orderId: string, at: Date = nowOf(d)): Promise<void> {
  await d.sets.mutate(id, (s) => {
    if (!s) return s;
    const h = s.holds.find((x) => x.orderId === orderId);
    if (h && !h.finalAt) h.finalAt = at.toISOString();
    return s;
  });
}
