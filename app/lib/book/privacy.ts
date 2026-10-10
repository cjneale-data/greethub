import { appendFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import type { Deps } from "./service";

/** 14 days before purge the owner gets a reminder with a "save as Person" action (legal req 26). */
export const PURGE_REMINDER_DAYS = 14;

/**
 * Daily 90-day purge (legal req 25). Deletes the original photos; a project whose consent ticked box C
 * ("keep my character") keeps them. Writes a deletion record with counts and ids only, no personal data.
 */
export async function purgeExpiredPhotos(d: Deps & { root: string }, now: Date = new Date()): Promise<{ photosDeleted: number; projectsTouched: number }> {
  let photosDeleted = 0;
  let projectsTouched = 0;
  for (const proj of await d.projects.listAll()) {
    if (proj.consent?.boxes.c) continue;
    const expired = proj.photos.filter((x) => new Date(x.expiresAt).getTime() <= now.getTime());
    if (!expired.length) continue;
    for (const x of expired) await d.storage.remove(x.path);
    const ids = new Set(expired.map((x) => x.id));
    await d.projects.update(proj.id, (p) => {
      p.photos = p.photos.filter((x) => !ids.has(x.id));
      p.photosConfirmed = false;
      return p;
    });
    photosDeleted += expired.length;
    projectsTouched++;
    logDeletion(d.root, { at: now.toISOString(), reason: "retention_90_days", projectId: proj.id, photoIds: [...ids] });
  }
  return { photosDeleted, projectsTouched };
}

/** Photos that will be purged within the reminder window, for the reminder email job. */
export async function photosExpiringSoon(d: Deps, now: Date = new Date()): Promise<{ userId: string; projectId: string; expiresAt: string }[]> {
  const horizon = now.getTime() + PURGE_REMINDER_DAYS * 86_400_000;
  const out: { userId: string; projectId: string; expiresAt: string }[] = [];
  for (const p of await d.projects.listAll()) {
    if (p.consent?.boxes.c || !p.photos.length) continue;
    const soonest = p.photos.map((x) => x.expiresAt).sort()[0];
    if (new Date(soonest).getTime() <= horizon) out.push({ userId: p.userId, projectId: p.id, expiresAt: soonest });
  }
  return out;
}

/**
 * Delete-my-data hook (legal req 28). Removes every book, photo, render and job for the user. The account
 * deletion flow calls this (POST /api/book/privacy/delete-my-data, or import it). The consent log entries go with
 * the project here; the production consent table keeps its 5-year log without photos (legal req 27).
 */
export async function deleteUserBookData(d: Deps & { root: string }, userId: string, now: Date = new Date()): Promise<{ projects: number; photos: number }> {
  let photos = 0;
  const mine = await d.projects.listByUser(userId);
  for (const p of mine) {
    for (const x of p.photos) {
      await d.storage.remove(x.path);
      photos++;
    }
    for (const j of await d.jobs.listByProject(p.id)) await d.jobs.update(j.id, (x) => ({ ...x, input: { ...x.input, photoPaths: {} } }));
    rmSync(path.join(d.root, "work", p.id), { recursive: true, force: true });
    await d.projects.delete(p.id);
    logDeletion(d.root, { at: now.toISOString(), reason: "user_request", projectId: p.id, photoCount: p.photos.length });
  }
  return { projects: mine.length, photos };
}

function logDeletion(root: string, rec: Record<string, unknown>) {
  mkdirSync(path.join(root, "logs"), { recursive: true });
  appendFileSync(path.join(root, "logs", "deletions.jsonl"), JSON.stringify(rec) + "\n", "utf8");
}
