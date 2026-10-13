import { timingSafeEqual } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
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
    // Job documents carry the brief, names and story text, and job logs can too: remove them, and stop a running worker first.
    for (const j of await d.jobs.listByProject(p.id)) {
      if (j.status === "queued" || j.status === "running") await d.jobs.requestCancel(j.id);
      await d.jobs.delete(j.id);
      rmSync(path.join(d.root, "logs", `${j.id}.log`), { force: true });
    }
    rmSync(path.join(d.root, "work", p.id), { recursive: true, force: true });
    await d.projects.delete(p.id);
    logDeletion(d.root, { at: now.toISOString(), reason: "user_request", projectId: p.id, photoCount: p.photos.length });
  }
  return { projects: mine.length, photos };
}

/**
 * The book half of export-my-data (legal req 28, CCPA access). Everything the customer gave us or approved, plus
 * every consent record for their books. Photo and artwork files are listed, not embedded; storage paths and
 * internal ids for jobs and costs are left out.
 */
export async function exportUserBookData(d: Deps, userId: string) {
  const mine = await d.projects.listByUser(userId);
  return mine.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    brief: p.brief,
    story: p.story ?? null,
    proof: { title: p.proof.title, dedication: p.proof.dedication, digitalCopy: p.proof.digitalCopy, approved: p.proof.approved, approvedAt: p.proof.approvedAt ?? null },
    photos: p.photos.map((x) => ({ id: x.id, characterId: x.characterId, contentType: x.contentType, bytes: x.bytes, width: x.width, height: x.height, uploadedAt: x.createdAt, deleteBy: x.expiresAt, consentId: x.consentId })),
    characterSheetApproved: p.sheet.approved,
    artworkPages: p.artOrder.filter((id) => p.art[id]?.versions.length).length,
    consentRecords: [...(p.consentHistory ?? []), ...(p.consent ? [p.consent] : [])],
  }));
}

/**
 * Read-only purge verification (docs/privacy-ops/02). Counts photos past their delete date that are still on
 * record, photos kept only because of box C, and photo files in storage that no project points to. Ids only.
 */
export async function auditPhotoRetention(d: Deps & { root: string }, now: Date = new Date()) {
  const known = new Set<string>();
  const overdue: { projectId: string; photoId: string }[] = [];
  const keptByBoxC: { projectId: string; photos: number }[] = [];
  for (const p of await d.projects.listAll()) {
    for (const x of p.photos) known.add(d.storage.localPath(x.path));
    const expired = p.photos.filter((x) => new Date(x.expiresAt).getTime() <= now.getTime());
    if (!expired.length) continue;
    if (p.consent?.boxes.c) keptByBoxC.push({ projectId: p.id, photos: expired.length });
    else for (const x of expired) overdue.push({ projectId: p.id, photoId: x.id });
  }
  const orphanFiles: string[] = [];
  const base = path.join(d.root, "storage", "books");
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (path.basename(dir) === "photos" && !known.has(path.resolve(full))) orphanFiles.push(path.relative(base, full).split(path.sep).join("/"));
    }
  };
  if (existsSync(base)) walk(base);
  return { overdue, keptByBoxC, orphanFiles };
}

/**
 * Who may run the purge. Vercel Cron sends GET with `Authorization: Bearer $CRON_SECRET`; other schedulers can send
 * `x-cron-secret: $GREETHUB_CRON_SECRET`. With neither secret set, only local dev is allowed.
 */
export function cronAuthorized(headers: Headers, env: NodeJS.ProcessEnv = process.env): boolean {
  const same = (a: string | null, b: string | undefined) => {
    if (!a || !b) return false;
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  };
  if (!env.CRON_SECRET && !env.GREETHUB_CRON_SECRET) return env.NODE_ENV !== "production";
  return same(headers.get("authorization"), env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : undefined) || same(headers.get("x-cron-secret"), env.GREETHUB_CRON_SECRET);
}

function logDeletion(root: string, rec: Record<string, unknown>) {
  mkdirSync(path.join(root, "logs"), { recursive: true });
  appendFileSync(path.join(root, "logs", "deletions.jsonl"), JSON.stringify(rec) + "\n", "utf8");
}
