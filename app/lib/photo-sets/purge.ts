import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { PURGE_REMINDER_DAYS, RETENTION_AFTER_FINAL_DAYS } from "./constants";
import type { SetDeps } from "./service";
import type { PhotoSet, StoredPhoto } from "./types";

/**
 * Retention for photo sets (docs/privacy-ops/photo-events-data.md, legal req 25).
 * - A set with any open order hold is never purged (the render step still needs the photos).
 * - Once every order is final, photos are kept until 90 days after the latest final date.
 * - A set nobody ordered keeps each photo for its own 90 days from upload.
 * - Derived files (proof JPEG, print PDF, event image) are full-resolution copies of the photos, so they are deleted
 *   whenever any photo of the set is purged, and always when the set empties.
 * The consent record stays on the set row (no photos inside) until the account is deleted.
 */
const DAY = 86_400_000;

/** When this photo must be gone, or null while an order holds it. */
export function deleteByFor(s: Pick<PhotoSet, "holds">, p: Pick<StoredPhoto, "expiresAt">): Date | null {
  if (s.holds.some((h) => !h.finalAt)) return null;
  const finals = s.holds.map((h) => new Date(h.finalAt!).getTime());
  const own = new Date(p.expiresAt).getTime();
  return new Date(finals.length ? Math.max(own, Math.max(...finals) + RETENTION_AFTER_FINAL_DAYS * DAY) : own);
}

type PurgeDeps = SetDeps & { root: string };

const logDeletion = (root: string, rec: Record<string, unknown>) => {
  mkdirSync(path.join(root, "logs"), { recursive: true });
  appendFileSync(path.join(root, "logs", "deletions.jsonl"), JSON.stringify(rec) + "\n", "utf8");
};

/** Daily job. Ids and counts only in the log. */
export async function purgeExpiredSets(d: PurgeDeps, now: Date = new Date()): Promise<{ photosDeleted: number; derivedDeleted: number; setsTouched: number }> {
  let photosDeleted = 0, derivedDeleted = 0, setsTouched = 0;
  for (const s of await d.sets.listAll()) {
    const expired = s.photos.filter((p) => {
      const by = deleteByFor(s, p);
      return by !== null && by.getTime() <= now.getTime();
    });
    if (!expired.length) continue;
    for (const p of expired) await Promise.all([d.storage.remove(p.path), d.storage.remove(p.previewPath)]);
    for (const f of s.derived) await d.storage.remove(f.path);
    const gone = new Set(expired.map((p) => p.id));
    const derivedIds = s.derived.map((f) => f.id);
    await d.sets.mutate(s.id, (cur) => {
      if (!cur) return cur;
      cur.photos = cur.photos.filter((p) => !gone.has(p.id));
      cur.derived = cur.derived.filter((f) => !derivedIds.includes(f.id));
      for (const c of [cur.consent, ...cur.consentHistory]) if (c) c.photoIds = c.photoIds.filter((x) => !gone.has(x));
      cur.updatedAt = now.toISOString();
      return cur;
    });
    photosDeleted += expired.length;
    derivedDeleted += derivedIds.length;
    setsTouched++;
    logDeletion(d.root, { at: now.toISOString(), reason: "retention_photo_set", setId: s.id, photoIds: [...gone], derivedCount: derivedIds.length });
  }
  return { photosDeleted, derivedDeleted, setsTouched };
}

/** Sets with photos due within the reminder window ("reorder or download before [date]"). */
export async function setsExpiringSoon(d: SetDeps, now: Date = new Date()): Promise<{ userId: string; setId: string; deleteBy: string }[]> {
  const horizon = now.getTime() + PURGE_REMINDER_DAYS * DAY;
  const out: { userId: string; setId: string; deleteBy: string }[] = [];
  for (const s of await d.sets.listAll()) {
    const dates = s.photos.map((p) => deleteByFor(s, p)).filter((x): x is Date => x !== null).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length && dates[0].getTime() <= horizon) out.push({ userId: s.userId, setId: s.id, deleteBy: dates[0].toISOString() });
  }
  return out;
}

/** Delete-my-data (legal req 28): every set, photo, preview and print file of the user, then the rows (consent records included). */
export async function deleteUserPhotoSets(d: PurgeDeps, userId: string, now: Date = new Date()): Promise<{ sets: number; photos: number; derived: number }> {
  let photos = 0, derived = 0;
  const mine = await d.sets.listByUser(userId);
  for (const s of mine) {
    for (const p of s.photos) {
      await Promise.all([d.storage.remove(p.path), d.storage.remove(p.previewPath)]);
      photos++;
    }
    for (const f of s.derived) {
      await d.storage.remove(f.path);
      derived++;
    }
    await d.sets.remove(s.id);
    logDeletion(d.root, { at: now.toISOString(), reason: "user_request", setId: s.id, photoCount: s.photos.length, derivedCount: s.derived.length });
  }
  return { sets: mine.length, photos, derived };
}

/** Export-my-data: metadata and consent records. No storage paths, no files. */
export async function exportUserPhotoSets(d: SetDeps, userId: string) {
  return (await d.sets.listByUser(userId)).map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    designIds: s.designIds,
    photos: s.photos.map((p) => ({ id: p.id, bytes: p.bytes, width: p.width, height: p.height, uploadedAt: p.createdAt, consentId: p.consentId })),
    printFiles: s.derived.map((f) => ({ kind: f.kind, createdAt: f.createdAt })),
    consentRecords: [...s.consentHistory, ...(s.consent ? [s.consent] : [])],
  }));
}

/** Read-only purge verification: photos and print files past their date, and files in storage that no set points to. Ids only. */
export async function auditSetRetention(d: PurgeDeps, now: Date = new Date()) {
  const known = new Set<string>();
  const overdue: { setId: string; photoId: string }[] = [];
  for (const s of await d.sets.listAll()) {
    for (const p of s.photos) {
      known.add(path.resolve(d.root, "storage", p.path));
      known.add(path.resolve(d.root, "storage", p.previewPath));
      const by = deleteByFor(s, p);
      if (by && by.getTime() <= now.getTime()) overdue.push({ setId: s.id, photoId: p.id });
    }
    for (const f of s.derived) known.add(path.resolve(d.root, "storage", f.path));
  }
  const orphanFiles: string[] = [];
  const base = path.join(d.root, "storage", "photo-sets");
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (!known.has(path.resolve(full))) orphanFiles.push(path.relative(base, full).split(path.sep).join("/"));
    }
  };
  if (existsSync(base)) walk(base);
  return { overdue, orphanFiles };
}
