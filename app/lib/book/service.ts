import path from "node:path";
import { NewCartItemSchema, bookSpreads, type NewCartItem } from "@greethub/shared";
import { isPet, validateBriefForm, type FieldErrors } from "./briefForm";
import { buildConsentRecord, consentCovers, consentValid, evaluateConsentGate, requiredBoxesTicked } from "./consent";
import { moderatePhoto } from "./moderation";
import { screenFields } from "../safety/server";
import type { IpInput } from "../safety/types";
import { MAX_PHOTOS_PER_CHARACTER, MAX_PHOTO_BYTES, MIN_PHOTO_SHORT_EDGE, PHOTO_RETENTION_DAYS, REROLL_ALLOWANCE, SHEET_FREE_REDOS } from "./constants";
import { projectSpendCapUsd, spreadsOverride } from "./config";
import { artPlan } from "./engine/runner";
import { extFor, readImageInfo } from "./imageInfo";
import type { JobQueue } from "./queue";
import { newId, type JobStore, type ProjectStore } from "./store";
import type { LocalDiskStorage } from "./storage";
import { briefLocked, photosLocked, storyLocked } from "./stepper";
import type { BookProject, BriefForm, ConsentBoxes, Job, JobInput, JobKind, PagePlanLite, PhotoRecord, ProjectView, PublicJob } from "./types";

export class BookError extends Error {
  constructor(public status: number, public code: string, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

export type Deps = {
  projects: ProjectStore;
  jobs: JobStore;
  queue: JobQueue;
  storage: LocalDiskStorage;
  mock: boolean;
  now?: () => Date;
};
const nowOf = (d: Deps) => (d.now ?? (() => new Date()))();
const iso = (d: Deps) => nowOf(d).toISOString();

/** A queued job nobody picked up, or a running job that stopped heartbeating, is dead. */
export const QUEUED_STALE_MS = 45_000;
export const RUNNING_STALE_MS = 120_000;

/* ------------------------------------------------------------------ helpers */

async function mustOwn(d: Deps, userId: string, id: string): Promise<BookProject> {
  const p = await d.projects.get(id);
  if (!p || p.userId !== userId) throw new BookError(404, "not_found", "We couldn't find that book.");
  return p;
}

function emptyProject(d: Deps, userId: string, brief: BriefForm): BookProject {
  const t = iso(d);
  return {
    id: newId("bk"),
    userId,
    createdAt: t,
    updatedAt: t,
    brief,
    photos: [],
    photosConfirmed: false,
    sheet: { versions: [], freeRedosUsed: 0, approved: false, notes: {} },
    art: {},
    artOrder: [],
    rerollsUsed: 0,
    mergedJobIds: [],
    costUsd: 0,
    proof: { title: "", dedication: brief.dedication, digitalCopy: false, approved: false },
    mock: d.mock,
  };
}

function cleanBrief(b: BriefForm): BriefForm {
  const t = (s: string) => (s ?? "").trim();
  return {
    ...b,
    occasionOther: t(b.occasionOther),
    recipientName: t(b.recipientName),
    relationship: t(b.relationship),
    storyIdea: t(b.storyIdea),
    settingDetails: t(b.settingDetails),
    dedication: t(b.dedication),
    characters: b.characters.map((c) => ({ ...c, name: t(c.name), role: t(c.role), pronouns: t(c.pronouns) })),
  };
}

/* ------------------------------------------------------------------ IP screen (docs/legal/07) */

export type Screened<T> = { value: T; notes: string[] };

/** Screens named strings; rewrites are applied (original characters inspired by the idea), blocked text refuses with a friendly message. */
async function screenTexts(d: Deps, items: { key: string; text: string; field: IpInput["field"] }[], knownNames: string[]): Promise<{ out: Record<string, string>; notes: string[] }> {
  const live = items.filter((i) => i.text.trim());
  const res = live.length ? await screenFields(live.map((i) => ({ text: i.text, field: i.field, knownNames })), { mock: d.mock }) : [];
  const out: Record<string, string> = Object.fromEntries(items.map((i) => [i.key, i.text]));
  const notes: string[] = [];
  res.forEach((r, n) => {
    if (r.verdict === "blocked") throw new BookError(422, "ip_blocked", r.userNote, { field: live[n].key });
    if (r.verdict === "rewritten") {
      out[live[n].key] = r.safeText;
      if (r.userNote && !notes.includes(r.userNote)) notes.push(r.userNote);
    }
  });
  return { out, notes };
}

async function screenBrief(d: Deps, b: BriefForm): Promise<Screened<BriefForm>> {
  const known = [b.recipientName, ...b.characters.map((c) => c.name)].filter(Boolean);
  const items = [
    { key: "storyIdea", text: b.storyIdea, field: "story_idea" as const },
    { key: "settingDetails", text: b.settingDetails, field: "story_idea" as const },
    { key: "dedication", text: b.dedication, field: "story_text" as const },
    ...b.characters.map((c, i) => ({ key: `role.${i}`, text: c.role, field: "character_note" as const })),
  ];
  const { out, notes } = await screenTexts(d, items, known);
  return {
    value: { ...b, storyIdea: out.storyIdea, settingDetails: out.settingDetails, dedication: out.dedication, characters: b.characters.map((c, i) => ({ ...c, role: out[`role.${i}`] })) },
    notes,
  };
}

const withNotes = (v: ProjectView, notes: string[]): ProjectView => (notes.length ? { ...v, ipNotices: notes } : v);

function assertValidBrief(b: BriefForm) {
  const v = validateBriefForm(b);
  if (!v.ok) throw new BookError(422, "invalid_brief", "Some answers still need a look.", { errors: v.errors satisfies FieldErrors });
}

/* ------------------------------------------------------------------ job reconcile */

function mergeJob(d: Deps, p: BookProject, job: Job): BookProject {
  const terminal = job.status === "succeeded" || job.status === "failed" || job.status === "cancelled";
  const stamp = iso(d);

  if (job.kind === "story" && job.status === "succeeded" && job.result?.story) {
    const s = job.result.story;
    p.story = { title: s.title, blurb: s.blurb, dedication: p.brief.dedication, pages: s.pages, approved: false, generatedAt: stamp, editedIds: [] };
    const plan = artPlan(s);
    p.artOrder = plan.map((x) => x.id);
    p.art = Object.fromEntries(plan.map((x) => [x.id, { status: "pending" as const, versions: [], current: 0 }]));
    p.proof.title = s.title;
  }

  if (job.kind === "sheet" && job.status === "succeeded" && job.result?.sheet) {
    if (!p.sheet.versions.some((v) => v.file === job.result!.sheet!.file)) p.sheet.versions.push(job.result.sheet);
  }

  if (job.kind === "pages" || job.kind === "reroll") {
    for (const [id, st] of Object.entries(job.pages)) {
      const cur = p.art[id] ?? { status: "pending" as const, versions: [], current: 0 };
      for (const v of st.versions) {
        if (!cur.versions.some((x) => x.file === v.file)) {
          cur.versions.push(v);
          cur.current = cur.versions.length - 1;
        }
      }
      if (st.status === "failed" && job.kind === "reroll" && cur.versions.length) {
        cur.status = "done"; // the old art is still there; the failure is reported through lastJob
      } else if (st.status === "pending" && cur.versions.length) {
        cur.status = "done";
      } else {
        cur.status = st.status;
      }
      cur.error = st.status === "failed" ? st.error : undefined;
      p.art[id] = cur;
    }
    // a cancelled or dead job leaves untouched pages as pending/failed, never as "rendering"
    if (terminal) {
      for (const id of new Set([...Object.keys(job.pages), ...(job.input.pageIds ?? [])])) {
        const a = p.art[id];
        if (a && (a.status === "rendering" || a.status === "redrawing" || (a.status === "pending" && job.status === "failed"))) a.status = a.versions.length ? "done" : "failed";
      }
    }
  }

  if (job.kind === "layout" && job.status === "succeeded") {
    p.proof.pdfFiles = job.result?.pdfFiles ?? {};
    p.proof.approved = true;
    p.proof.approvedAt = stamp;
  }

  if (terminal) {
    if (job.status !== "succeeded" && job.charge === "reroll") p.rerollsUsed = Math.max(0, p.rerollsUsed - 1);
    if (job.status !== "succeeded" && job.charge === "free_redo") p.sheet.freeRedosUsed = Math.max(0, p.sheet.freeRedosUsed - 1);
    p.costUsd += job.costUsd;
    p.mergedJobIds.push(job.id);
    if (p.activeJobId === job.id) p.activeJobId = undefined;
    p.lastJob = {
      id: job.id,
      kind: job.kind,
      status: job.status,
      error: job.error,
      pageId: job.input.pageId,
      finishedAt: job.finishedAt ?? stamp,
    };
  }
  return p;
}

/** Brings the stored project in line with its jobs (the worker is the only writer of jobs). Idempotent. */
export async function syncProject(d: Deps, project: BookProject): Promise<BookProject> {
  const jobs = await d.jobs.listByProject(project.id);
  const pending = jobs.filter((j) => !project.mergedJobIds.includes(j.id));
  if (!pending.length) return project;

  // watchdog: fail jobs whose worker never started or stopped heartbeating
  for (let i = 0; i < pending.length; i++) {
    const j = pending[i];
    const age = nowOf(d).getTime() - new Date(j.updatedAt).getTime();
    const dead = (j.status === "queued" && age > QUEUED_STALE_MS) || (j.status === "running" && age > RUNNING_STALE_MS);
    if (dead) {
      const failed = await d.jobs.update(j.id, (x) =>
        x.status === "queued" || x.status === "running"
          ? { ...x, status: "failed", error: "The drawing worker stopped. Try again.", finishedAt: iso(d) }
          : x,
      );
      if (failed) pending[i] = failed;
    }
  }

  const updated = await d.projects.update(project.id, (p) => {
    for (const j of pending) {
      if (p.mergedJobIds.includes(j.id)) continue;
      mergeJob(d, p, j);
    }
    return p;
  });
  return updated ?? project;
}

/* ------------------------------------------------------------------ views */

const toPublicJob = (j: Job): PublicJob => ({ id: j.id, kind: j.kind, status: j.status, progress: j.progress, pages: j.pages, error: j.error, updatedAt: j.updatedAt, mock: j.mock });

export async function viewOf(d: Deps, p: BookProject): Promise<ProjectView> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId: _u, mergedJobIds: _m, photos, consent, ...rest } = p;
  const job = p.activeJobId ? await d.jobs.get(p.activeJobId) : null;
  return {
    ...rest,
    consent: consent ? (({ ip: _ip, userAgent: _ua, ...safe }) => safe)(consent) : undefined,
    photos: photos.map((x) => ({ id: x.id, characterId: x.characterId, width: x.width, height: x.height })),
    job: job ? toPublicJob(job) : undefined,
    rerollsLeft: Math.max(0, REROLL_ALLOWANCE - p.rerollsUsed),
    sheetFreeRedosLeft: Math.max(0, SHEET_FREE_REDOS - p.sheet.freeRedosUsed),
  };
}

export async function getProject(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const p = await syncProject(d, await mustOwn(d, userId, id));
  return viewOf(d, p);
}

export async function listProjects(d: Deps, userId: string) {
  const all = await d.projects.listByUser(userId);
  return all.map((p) => ({
    id: p.id,
    title: p.proof.title || p.story?.title || p.brief.recipientName || "Untitled book",
    updatedAt: p.updatedAt,
    approved: p.proof.approved,
    step: p.proof.approved ? "approved" : p.story?.approved ? (p.sheet.approved ? "pages" : "characters") : p.story ? "story" : p.photosConfirmed ? "story" : "photos",
  }));
}

/* ------------------------------------------------------------------ brief and photos */

export async function createProject(d: Deps, userId: string, brief: BriefForm): Promise<ProjectView> {
  const cleaned = cleanBrief(brief);
  assertValidBrief(cleaned);
  const { value: b, notes } = await screenBrief(d, cleaned);
  const p = emptyProject(d, userId, b);
  await d.projects.put(p);
  return withNotes(await viewOf(d, p), notes);
}

export async function updateBrief(d: Deps, userId: string, id: string, brief: BriefForm): Promise<ProjectView> {
  const cleaned = cleanBrief(brief);
  assertValidBrief(cleaned);
  const { value: b, notes } = await screenBrief(d, cleaned);
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  if (briefLocked(cur)) throw new BookError(409, "locked", "The idea is locked once the story is written. Start a new book to change it.");
  const removedPhotos: PhotoRecord[] = [];
  const next = await d.projects.update(id, (p) => {
    const keep = new Set(b.characters.map((c) => c.id));
    removedPhotos.push(...p.photos.filter((x) => !keep.has(x.characterId)));
    p.photos = p.photos.filter((x) => keep.has(x.characterId));
    // a changed cast means the photos need a fresh look at the Continue step
    const sameCast = JSON.stringify(p.brief.characters.map((c) => [c.id, c.name, c.ageBand])) === JSON.stringify(b.characters.map((c) => [c.id, c.name, c.ageBand]));
    if (!sameCast) p.photosConfirmed = false;
    p.brief = b;
    p.proof.dedication = b.dedication;
    return p;
  });
  for (const x of removedPhotos) await d.storage.remove(x.path);
  return withNotes(await viewOf(d, next!), notes);
}

export async function addPhoto(d: Deps, userId: string, id: string, input: { characterId: string; data: Uint8Array }): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  if (photosLocked(cur)) throw new BookError(409, "locked", "Photos are locked once the characters have been drawn.");
  if (!consentValid(cur.consent)) throw new BookError(403, "consent_required", "Tick both boxes before adding photos.");
  if (!cur.brief.characters.some((c) => c.id === input.characterId)) throw new BookError(404, "no_character", "That character isn't in this book.");
  if (input.data.byteLength > MAX_PHOTO_BYTES) throw new BookError(413, "too_big", "That photo is over 10 MB. Try a smaller one.");
  const info = readImageInfo(input.data);
  if (!info) throw new BookError(415, "bad_type", "We can only use JPG, PNG or HEIC photos.");
  if (Math.min(info.width, info.height) < MIN_PHOTO_SHORT_EDGE) {
    throw new BookError(422, "too_small", "This one is too small. Try a bigger photo with one clear face.");
  }
  if (cur.photos.filter((x) => x.characterId === input.characterId).length >= MAX_PHOTOS_PER_CHARACTER) {
    throw new BookError(422, "too_many", `Up to ${MAX_PHOTOS_PER_CHARACTER} photos each.`);
  }
  const mod = await moderatePhoto(input.data, { contentType: info.type, userId, projectId: id, mock: d.mock });
  if (mod.halt) {
    // Suspected CSAM: stop here. Nothing is stored, displayed or forwarded (hook already called with metadata only).
    throw new BookError(422, "photo_blocked", "We can't use that photo. Try another where the person is clearly the one in it.");
  }
  if (mod.unavailable) throw new BookError(503, "photo_check_unavailable", "We couldn't check that photo just now. Try again in a moment.");
  if (!mod.ok) throw new BookError(422, "photo_blocked", "We can't use that photo. Try another where the person is clearly the one in it.");
  const photoId = newId("ph");
  const rel = `books/${userId}/${id}/photos/${photoId}.${extFor(info.type)}`;
  await d.storage.putPrivate(rel, input.data, info.type);
  const next = await d.projects.update(id, (p) => {
    p.photos.push({ id: photoId, characterId: input.characterId, path: rel, contentType: info.type, bytes: input.data.byteLength, width: info.width, height: info.height, createdAt: iso(d), consentId: p.consent!.id, expiresAt: new Date(nowOf(d).getTime() + PHOTO_RETENTION_DAYS * 86_400_000).toISOString() });
    p.consent!.photoIds.push(photoId);
    p.photosConfirmed = false;
    return p;
  });
  const warn = mod.warnings.length ? ["Heads up: we'll draw the clothing plain, without any logo or character print."] : [];
  return withNotes(await viewOf(d, next!), warn);
}

export async function removePhoto(d: Deps, userId: string, id: string, photoId: string): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  if (photosLocked(cur)) throw new BookError(409, "locked", "Photos are locked once the characters have been drawn.");
  const photo = cur.photos.find((x) => x.id === photoId);
  if (!photo) throw new BookError(404, "not_found", "We couldn't find that photo.");
  await d.storage.remove(photo.path);
  const next = await d.projects.update(id, (p) => {
    p.photos = p.photos.filter((x) => x.id !== photoId);
    p.photosConfirmed = false;
    return p;
  });
  return viewOf(d, next!);
}

export async function readPhoto(d: Deps, userId: string, id: string, photoId: string): Promise<{ data: Buffer; contentType: string }> {
  const p = await mustOwn(d, userId, id);
  const photo = p.photos.find((x) => x.id === photoId);
  if (!photo) throw new BookError(404, "not_found", "We couldn't find that photo.");
  return { data: await d.storage.read(photo.path), contentType: photo.contentType };
}

/**
 * Records the consent log entry (boxes A and B required) before any upload. Re-recording after a wording change
 * moves the existing photos under the new record.
 */
export async function recordConsent(d: Deps, userId: string, id: string, input: { boxes: ConsentBoxes; ip: string; userAgent: string }): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  if (photosLocked(cur)) throw new BookError(409, "locked", "Photos are locked once the characters have been drawn.");
  if (!requiredBoxesTicked(input.boxes)) throw new BookError(403, "consent_required", "Tick both boxes to add photos.");
  const next = await d.projects.update(id, (p) => {
    const rec = buildConsentRecord({
      id: newId("cn"),
      userId,
      boxes: { a: true, b: true, c: !!input.boxes.c, d: !!input.boxes.d },
      now: nowOf(d),
      ip: input.ip,
      userAgent: input.userAgent,
      photoIds: p.photos.map((x) => x.id),
      characterLabels: p.brief.characters.map((c) => c.name),
    });
    for (const x of p.photos) x.consentId = rec.id;
    p.consent = rec;
    p.photosConfirmed = false;
    return p;
  });
  return viewOf(d, next!);
}

/** Withdrawal: stops processing and deletes every photo for this book. Pages already drawn stay; orders in print cannot be recalled. */
export async function withdrawConsent(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  for (const x of cur.photos) await d.storage.remove(x.path);
  const next = await d.projects.update(id, (p) => {
    if (p.consent) p.consent.withdrawnAt = iso(d);
    p.photos = [];
    p.photosConfirmed = false;
    return p;
  });
  return viewOf(d, next!);
}

/** The gate for leaving the photo step: valid consent on record and a photo of every human. */
export async function confirmPhotos(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  if (photosLocked(cur)) throw new BookError(409, "locked", "Photos are locked once the characters have been drawn.");
  const gate = evaluateConsentGate(cur.brief, cur.photos, consentValid(cur.consent) ? cur.consent.boxes : null);
  if (!gate.ok) throw new BookError(403, gate.problems[0].code === "no_consent" ? "consent_required" : "photos_required", gate.problems[0].message, { problems: gate.problems });
  const next = await d.projects.update(id, (p) => {
    p.photosConfirmed = true;
    return p;
  });
  return viewOf(d, next!);
}

/* ------------------------------------------------------------------ jobs */

function jobInput(d: Deps, p: BookProject, extra: Partial<JobInput> = {}): JobInput {
  const photoPaths: Record<string, string> = {};
  const characters = p.brief.characters.map((c) => {
    const photos = p.photos.filter((x) => x.characterId === c.id);
    for (const x of photos) photoPaths[x.id] = d.storage.localPath(x.path);
    return { id: c.id, name: c.name, ageBand: isPet(c) ? "pet" : c.ageBand, role: c.role, pronouns: c.pronouns, isPet: isPet(c), photoIds: photos.map((x) => x.id) };
  });
  return {
    brief: p.brief,
    photoPaths,
    characters,
    story: p.story ? { title: p.story.title, blurb: p.story.blurb, pages: p.story.pages } : undefined,
    sheetFile: p.sheet.approvedFile,
    spreads: spreadsOverride() ?? bookSpreads(p.brief.pageCount),
    proofTitle: p.proof.title,
    proofDedication: p.proof.dedication,
    ...extra,
  };
}

async function startJob(
  d: Deps,
  userId: string,
  id: string,
  kind: JobKind,
  build: (p: BookProject) => { input: Partial<JobInput>; charge?: Job["charge"]; mutate?: (p: BookProject) => void },
): Promise<ProjectView> {
  const synced = await syncProject(d, await mustOwn(d, userId, id));
  if (synced.activeJobId) throw new BookError(409, "busy", "Hang on, we're still working on the last step.");
  if (synced.costUsd >= projectSpendCapUsd()) throw new BookError(402, "spend_cap", "This book has reached its drawing budget.");

  const jobId = newId("jb");
  let created!: Job;
  const next = await d.projects.update(id, (p) => {
    if (p.activeJobId) throw new BookError(409, "busy", "Hang on, we're still working on the last step.");
    const b = build(p);
    b.mutate?.(p);
    const t = iso(d);
    created = {
      id: jobId,
      projectId: p.id,
      userId,
      kind,
      status: "queued",
      createdAt: t,
      updatedAt: t,
      mock: d.mock,
      charge: b.charge,
      input: jobInput(d, p, b.input),
      progress: { done: 0, total: 1, label: "Waiting for a worker" },
      pages: {},
      costUsd: 0,
    };
    p.activeJobId = jobId;
    return p;
  });
  if (!next) throw new BookError(404, "not_found", "We couldn't find that book.");
  await d.jobs.create(created);
  try {
    await d.queue.enqueue(jobId);
  } catch {
    await d.jobs.update(jobId, (j) => ({ ...j, status: "failed", error: "We couldn't start the drawing worker. Try again.", finishedAt: iso(d) }));
  }
  return viewOf(d, (await syncProject(d, next)) ?? next);
}

const requireConsent = (p: BookProject) => {
  if (!p.photosConfirmed || !consentCovers(p.consent, p.photos)) {
    throw new BookError(403, "consent_required", "Photos need the consent box ticked before we can use them.");
  }
};

/* ---- story ---- */

export async function generateStory(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  requireConsent(cur);
  if (storyLocked(cur)) throw new BookError(409, "locked", "The story is already approved.");
  return startJob(d, userId, id, "story", () => ({ input: {} }));
}

const MAX_PAGE_CHARS = 1200;

export async function saveStory(d: Deps, userId: string, id: string, edit: { title?: string; dedication?: string; texts?: Record<string, string> }): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  if (!cur.story) throw new BookError(409, "no_story", "There's no story yet.");
  if (cur.story.approved) throw new BookError(409, "locked", "The story is approved. Changing it now would mean redrawing the pages.");
  // Printed text: the customer's edits are screened too (slogans, characters, brands, public figures).
  const known = [cur.brief.recipientName, ...cur.brief.characters.map((c) => c.name)];
  const sc = await screenTexts(
    d,
    [
      { key: "title", text: edit.title ?? "", field: "story_text" },
      { key: "dedication", text: edit.dedication ?? "", field: "story_text" },
      ...Object.entries(edit.texts ?? {}).map(([k, v]) => ({ key: `t.${k}`, text: String(v), field: "story_text" as const })),
    ],
    known,
  );
  const notes = sc.notes;
  if (typeof edit.title === "string") edit = { ...edit, title: sc.out.title };
  if (typeof edit.dedication === "string") edit = { ...edit, dedication: sc.out.dedication };
  if (edit.texts) edit = { ...edit, texts: Object.fromEntries(Object.keys(edit.texts).map((k) => [k, sc.out[`t.${k}`]])) };
  const next = await d.projects.update(id, (p) => {
    const s = p.story!;
    if (typeof edit.title === "string") {
      s.title = edit.title.trim().slice(0, 80);
      p.proof.title = s.title;
    }
    if (typeof edit.dedication === "string") {
      s.dedication = edit.dedication.trim().slice(0, 300);
      p.proof.dedication = s.dedication;
    }
    for (const [pid, text] of Object.entries(edit.texts ?? {})) {
      const page = s.pages.find((x) => x.id === pid && x.kind === "spread");
      if (!page) continue;
      const clean = String(text).replace(/\r\n/g, "\n").slice(0, MAX_PAGE_CHARS);
      if (clean !== page.text) {
        page.text = clean;
        if (!s.editedIds.includes(pid)) s.editedIds.push(pid);
      }
    }
    return p;
  });
  return withNotes(await viewOf(d, next!), notes);
}

export async function approveStory(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  if (!cur.story) throw new BookError(409, "no_story", "There's no story yet.");
  if (cur.activeJobId) throw new BookError(409, "busy", "Hang on, we're still working on the last step.");
  const empty = cur.story.pages.find((x) => x.kind === "spread" && !x.text?.trim());
  if (empty) throw new BookError(422, "empty_page", `Page ${empty.id.slice(1)} has no words yet.`, { pageId: empty.id });
  if (!cur.story.title.trim()) throw new BookError(422, "no_title", "Give the book a title.");
  // Last check on everything that will be printed. If anything still needs changing, apply it and let the customer look before approving.
  const known = [cur.brief.recipientName, ...cur.brief.characters.map((c) => c.name)];
  const spreads = cur.story.pages.filter((x) => x.kind === "spread");
  const last = await screenTexts(d, [{ key: "title", text: cur.story.title, field: "story_text" }, ...spreads.map((x) => ({ key: x.id, text: x.text ?? "", field: "story_text" as const }))], known);
  if (last.notes.length) {
    await d.projects.update(id, (p) => {
      p.story!.title = last.out.title;
      for (const pg of p.story!.pages) if (pg.kind === "spread") pg.text = last.out[pg.id];
      return p;
    });
    throw new BookError(422, "ip_rewritten", last.notes[0], { notices: last.notes });
  }
  const next = await d.projects.update(id, (p) => {
    p.story!.approved = true;
    return p;
  });
  return viewOf(d, next!);
}

/* ---- model sheet ---- */

export async function generateSheet(d: Deps, userId: string, id: string, opts: { redo?: boolean; notes?: Record<string, string> } = {}): Promise<ProjectView> {
  const cur = await mustOwn(d, userId, id);
  requireConsent(cur);
  if (!cur.story?.approved) throw new BookError(409, "story_not_approved", "Approve the story first.");
  if (cur.sheet.approved) throw new BookError(409, "locked", "The characters are approved. Changing them now would mean redrawing the pages.");
  const noteKeys = Object.keys(opts.notes ?? {});
  const sn = await screenTexts(d, noteKeys.map((k) => ({ key: k, text: opts.notes![k], field: "character_note" as const })), [cur.brief.recipientName, ...cur.brief.characters.map((c) => c.name)]);
  opts = { ...opts, notes: noteKeys.length ? sn.out : opts.notes };
  const redo = !!opts.redo && cur.sheet.versions.length > 0;
  return startJob(d, userId, id, "sheet", (p) => {
    let charge: Job["charge"];
    if (redo) {
      if (p.sheet.freeRedosUsed < SHEET_FREE_REDOS) charge = "free_redo";
      else if (p.rerollsUsed < REROLL_ALLOWANCE) charge = "reroll";
      else throw new BookError(402, "no_rerolls", "No redraws left on this book.");
    }
    return {
      input: { sheetNotes: opts.notes ?? {} },
      charge,
      mutate: (q) => {
        q.sheet.notes = opts.notes ?? {};
        if (charge === "free_redo") q.sheet.freeRedosUsed += 1;
        if (charge === "reroll") q.rerollsUsed += 1;
      },
    };
  });
}

export async function approveSheet(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  if (cur.activeJobId) throw new BookError(409, "busy", "Hang on, we're still working on the last step.");
  const last = cur.sheet.versions.at(-1);
  if (!last) throw new BookError(409, "no_sheet", "There's no character sheet yet.");
  const next = await d.projects.update(id, (p) => {
    p.sheet.approved = true;
    p.sheet.approvedFile = last.file;
    return p;
  });
  return viewOf(d, next!);
}

/* ---- pages ---- */

export async function startRender(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  requireConsent(cur);
  if (!cur.story?.approved) throw new BookError(409, "story_not_approved", "Approve the story first.");
  if (!cur.sheet.approved) throw new BookError(409, "sheet_not_approved", "Approve the characters before we draw the pages.");
  const todo = cur.artOrder.filter((pid) => cur.art[pid]?.status !== "done");
  if (!todo.length) throw new BookError(409, "nothing_to_draw", "Every page is already drawn.");
  return startJob(d, userId, id, "pages", (p) => ({
    input: { pageIds: todo, sheetFile: p.sheet.approvedFile },
    mutate: (q) => {
      for (const pid of todo) q.art[pid] = { ...(q.art[pid] ?? { versions: [], current: 0 }), status: "pending", error: undefined };
    },
  }));
}

export async function rerollPage(d: Deps, userId: string, id: string, pageId: string, note?: string): Promise<ProjectView> {
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  const art = cur.art[pageId];
  if (!art) throw new BookError(404, "no_page", "That page isn't in this book.");
  if (cur.proof.approved) throw new BookError(409, "locked", "This book is approved.");
  const free = art.status === "failed" && art.versions.length === 0; // retry of a page that never drew costs nothing
  if (!free && art.status !== "done") throw new BookError(409, "busy", "That page is still being drawn.");
  if (!free && cur.rerollsUsed >= REROLL_ALLOWANCE) throw new BookError(402, "no_rerolls", "No redraws left on this book.");
  const rn = await screenTexts(d, [{ key: "note", text: (note ?? "").trim().slice(0, 300), field: "reroll_note" }], [cur.brief.recipientName, ...cur.brief.characters.map((c) => c.name)]);
  const cleanNote = rn.out.note;
  return startJob(d, userId, id, free ? "pages" : "reroll", (p) => ({
    input: { pageIds: [pageId], pageId, note: cleanNote || undefined, sheetFile: p.sheet.approvedFile },
    charge: free ? undefined : "reroll",
    mutate: (q) => {
      q.art[pageId].status = free ? "pending" : "redrawing";
      if (!free) q.rerollsUsed += 1;
    },
  }));
}

export async function cancelJob(d: Deps, userId: string, id: string): Promise<ProjectView> {
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  if (cur.activeJobId) await d.jobs.requestCancel(cur.activeJobId);
  return viewOf(d, cur);
}

/* ---- proof ---- */

export async function approveProof(
  d: Deps,
  userId: string,
  id: string,
  input: { title: string; dedication: string; digitalCopy: boolean; acknowledged: boolean },
): Promise<ProjectView> {
  const cur = await syncProject(d, await mustOwn(d, userId, id));
  if (!input.acknowledged) throw new BookError(422, "not_acknowledged", "Tick the box once you've looked at every page.");
  if (!cur.sheet.approved || !cur.artOrder.length || !cur.artOrder.every((pid) => cur.art[pid]?.status === "done")) {
    throw new BookError(409, "not_ready", "Every page needs to be drawn first.");
  }
  if (cur.proof.approved) return viewOf(d, cur);
  const pt = await screenTexts(d, [{ key: "title", text: input.title.trim().slice(0, 80), field: "story_text" }, { key: "ded", text: input.dedication.trim().slice(0, 300), field: "story_text" }], [cur.brief.recipientName, ...cur.brief.characters.map((c) => c.name)]);
  const title = pt.out.title;
  input = { ...input, dedication: pt.out.ded };
  if (!title) throw new BookError(422, "no_title", "Give the book a title.");
  return startJob(d, userId, id, "layout", (p) => ({
    input: {
      proofTitle: title,
      proofDedication: input.dedication.trim().slice(0, 300),
      artFiles: Object.fromEntries(p.artOrder.map((pid) => [pid, p.art[pid].versions[p.art[pid].current].file])),
    },
    mutate: (q) => {
      q.proof.title = title;
      q.proof.dedication = input.dedication.trim().slice(0, 300);
      q.proof.digitalCopy = !!input.digitalCopy;
    },
  }));
}

/** The approved book as the cart engineer's NewCartItem (packages/shared/src/cart.ts). */
export async function getCartItem(d: Deps, userId: string, id: string): Promise<NewCartItem> {
  const p = await syncProject(d, await mustOwn(d, userId, id));
  if (!p.proof.approved) throw new BookError(409, "not_approved", "Approve the proof first.");
  const cover = p.art.cover?.versions[p.art.cover.current]?.file;
  return NewCartItemSchema.parse({
    kind: "book",
    creationId: p.id,
    title: p.proof.title,
    recipientName: p.brief.recipientName,
    quantity: 1,
    pageCount: p.brief.pageCount,
    mailTo: "buyer",
    digitalCopy: p.proof.digitalCopy,
    thumbnail: cover ? `/api/book/projects/${p.id}/assets/${cover}` : undefined,
  });
}

/* ---- assets ---- */

const ASSET_NAME = /^[A-Za-z0-9_.-]+$/;
export const ASSET_TYPES: Record<string, string> = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", pdf: "application/pdf" };

/** Absolute path of a rendered image if (and only if) this user owns the project. */
export async function resolveAsset(d: Deps, userId: string, id: string, name: string, root: string): Promise<{ file: string; contentType: string }> {
  await mustOwn(d, userId, id);
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!ASSET_NAME.test(name) || name.startsWith(".") || !ASSET_TYPES[ext]) throw new BookError(404, "not_found", "Not found.");
  return { file: path.join(root, "work", id, "images", name), contentType: ASSET_TYPES[ext] };
}

export function pageText(story: { pages: PagePlanLite[] } | undefined, id: string): string {
  return story?.pages.find((p) => p.id === id)?.text ?? "";
}
