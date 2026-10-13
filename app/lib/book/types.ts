import type { ArtStyleId } from "@greethub/shared";

/* ---------------- brief form (step 1) ---------------- */

export type CharacterForm = {
  /** Stable client id; uploads attach to it. */
  id: string;
  name: string;
  ageBand: string;
  role: string;
  pronouns: string;
  isPet?: boolean;
};

export type BriefForm = {
  occasion: string;
  occasionOther: string;
  recipientName: string;
  relationship: string;
  tone: string;
  readingAge: string;
  pageCount: 24 | 32;
  artStyle: ArtStyleId | "";
  storyIdea: string;
  settingDetails: string;
  dedication: string;
  characters: CharacterForm[];
};

/* ---------------- project (single JSON document, written by the server only) ---------------- */

export type PhotoRecord = {
  id: string;
  characterId: string;
  /** Storage adapter path (private). */
  path: string;
  contentType: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  /** The consent record this upload was made under (legal req 4). */
  consentId: string;
  /** 90-day purge date. Not purged when the user ticked "keep my character" (box C). */
  expiresAt: string;
};

export type ConsentBoxes = { a: boolean; b: boolean; c: boolean; d: boolean };

/** Consent log entry (docs/legal/02 section 6). Photos themselves are never stored here. */
export type ConsentRecord = {
  id: string;
  userId: string;
  recordedAt: string;
  ip: string;
  userAgent: string;
  wordingVersion: string;
  wordingHash: string;
  boxes: ConsentBoxes;
  photoIds: string[];
  /** First names or labels as entered. */
  characterLabels: string[];
  withdrawnAt?: string;
};

export type PagePlanLite = {
  id: string;
  kind: "cover" | "spread" | "back";
  scene: string;
  characters: string[];
  text?: string;
  textZone?: string;
};

export type StoryState = {
  title: string;
  blurb: string;
  dedication: string;
  pages: PagePlanLite[];
  approved: boolean;
  generatedAt: string;
  /** Pages the user changed by hand. */
  editedIds: string[];
};

export type AssetVersion = { file: string; createdAt: string; model?: string; qaNote?: string };

export type SheetState = {
  versions: AssetVersion[];
  freeRedosUsed: number;
  approved: boolean;
  approvedFile?: string;
  /** Per-character feedback sent with the last redo. */
  notes: Record<string, string>;
};

export type PageArtState = {
  status: "pending" | "rendering" | "redrawing" | "done" | "failed";
  versions: AssetVersion[];
  /** Index into `versions` that the proof shows. */
  current: number;
  error?: string;
};

export type BookProject = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  brief: BriefForm;
  photos: PhotoRecord[];
  consent?: ConsentRecord;
  /** Earlier consent records for this book (re-consent after a withdrawal or a wording change), oldest first (legal req 4, 27). */
  consentHistory?: ConsentRecord[];
  photosConfirmed: boolean;
  story?: StoryState;
  sheet: SheetState;
  art: Record<string, PageArtState>;
  /** Order of art pages, e.g. cover, p1..pN, back. */
  artOrder: string[];
  rerollsUsed: number;
  /** Job ids already merged into this project. */
  mergedJobIds: string[];
  activeJobId?: string;
  /** Outcome of the most recent finished job, so the browser can report a failure after the job is merged. */
  lastJob?: { id: string; kind: JobKind; status: JobStatus; error?: string; pageId?: string; finishedAt: string };
  costUsd: number;
  proof: { title: string; dedication: string; digitalCopy: boolean; approved: boolean; approvedAt?: string; pdfFiles?: Record<string, string> };
  mock: boolean;
};

/* ---------------- jobs (single JSON document, written by the worker only) ---------------- */

export type JobKind = "story" | "sheet" | "pages" | "reroll" | "layout";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type JobInput = {
  brief: BriefForm;
  /** The consent record the photos in this job were uploaded under (legal req 4). */
  consentId?: string;
  /** Characters with the photo ids the pipeline reads. */
  photoPaths: Record<string, string>;
  characters: { id: string; name: string; ageBand: string; role: string; pronouns: string; isPet: boolean; photoIds: string[] }[];
  story?: { title: string; blurb: string; pages: PagePlanLite[] };
  sheetFile?: string;
  /** Layout job: page id -> file name in the project's images dir (current version of each page). */
  artFiles?: Record<string, string>;
  sheetNotes?: Record<string, string>;
  pageId?: string;
  note?: string;
  /** Pages to render (ids), in order. */
  pageIds?: string[];
  /** Total number of spreads to write; the live test run may shrink it. */
  spreads: number;
  proofTitle?: string;
  proofDedication?: string;
};

export type JobPageState = { status: PageArtState["status"]; versions: AssetVersion[]; error?: string };

export type JobResult = {
  story?: { title: string; blurb: string; pages: PagePlanLite[] };
  sheet?: AssetVersion;
  pdfFiles?: Record<string, string>;
};

export type Job = {
  id: string;
  projectId: string;
  userId: string;
  kind: JobKind;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  mock: boolean;
  /** What this job used from the book's allowances; refunded if the job fails. */
  charge?: "free_redo" | "reroll";
  input: JobInput;
  progress: { done: number; total: number; label: string };
  pages: Record<string, JobPageState>;
  result?: JobResult;
  error?: string;
  costUsd: number;
};

/* ---------------- what the browser sees ---------------- */

export type PublicJob = Pick<Job, "id" | "kind" | "status" | "progress" | "pages" | "error" | "updatedAt" | "mock">;

export type ProjectView = Omit<BookProject, "userId" | "photos" | "mergedJobIds" | "consent" | "consentHistory"> & {
  consent?: Omit<ConsentRecord, "ip" | "userAgent">;
  photos: Pick<PhotoRecord, "id" | "characterId" | "width" | "height">[];
  job?: PublicJob;
  rerollsLeft: number;
  sheetFreeRedosLeft: number;
  /** One-line notes when the IP screen rewrote customer text on this request (not stored). */
  ipNotices?: string[];
};
