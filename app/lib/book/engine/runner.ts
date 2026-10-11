import { mkdirSync } from "node:fs";
import path from "node:path";
import { PAGE_ID } from "../constants";
import type { JobStore } from "../store/types";
import type { Job, JobPageState, PagePlanLite } from "../types";
import { FatalJobError, PageBlockedError, type BookEngine, type EngineCtx } from "./types";

export const HEARTBEAT_MS = 8_000;

const redact = (s: string) => s.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");

export function backCoverPage(characters: string[]): PagePlanLite {
  return {
    id: PAGE_ID.back,
    kind: "back",
    scene: "Back cover: a calm, charming closing scene of the cast waving goodbye in the story's setting, with open space in the middle.",
    characters,
  };
}

/** Art pages in print order: cover, spreads, back cover. */
export function artPlan(story: { pages: PagePlanLite[] }): PagePlanLite[] {
  const first = story.pages.find((p) => p.kind === "cover")?.characters ?? story.pages[0]?.characters ?? [];
  return [...story.pages.filter((p) => p.kind !== "back"), backCoverPage(first)];
}

export type RunnerDeps = {
  jobs: JobStore;
  /** Data root; the project work dir is <root>/work/<projectId>. */
  root: string;
  engine: BookEngine;
  log?: (m: string) => void;
};

/** Executes one job document to a terminal state. Safe to call from a worker process or inline in tests. */
export async function runJob(jobId: string, deps: RunnerDeps): Promise<Job | null> {
  const { jobs, engine } = deps;
  const log = deps.log ?? (() => undefined);
  const start = await jobs.get(jobId);
  if (!start || start.status !== "queued") return start;
  if (await jobs.isCancelRequested(jobId)) {
    return jobs.update(jobId, (j) => ({ ...j, status: "cancelled", finishedAt: new Date().toISOString() }));
  }

  const workDir = path.join(deps.root, "work", start.projectId);
  const imagesDir = path.join(workDir, "images");
  mkdirSync(imagesDir, { recursive: true });

  await jobs.update(jobId, (j) => ({ ...j, status: "running", startedAt: new Date().toISOString() }));
  const beat = setInterval(() => void jobs.update(jobId, (j) => j), HEARTBEAT_MS);

  let cost = 0;
  const patch = (fn: (j: Job) => void) => jobs.update(jobId, (j) => (fn(j), j));
  const ectx: EngineCtx = {
    job: start,
    workDir,
    imagesDir,
    log: (m) => log(redact(m)),
    // engines report the spend of each call; the job keeps the running total, even when a later step throws
    reportCost: (usd) => {
      cost += usd;
      void patch((j) => void (j.costUsd = cost));
    },
  };

  try {
    switch (start.kind) {
      case "story": {
        const story = await engine.story(ectx);
        await patch((j) => {
          j.result = { story };
          j.progress = { done: 1, total: 1, label: "Story written" };
          j.status = "succeeded";
        });
        break;
      }
      case "sheet": {
        const sheet = await engine.sheet(ectx);
        await patch((j) => {
          j.result = { sheet };
          j.progress = { done: 1, total: 1, label: "Characters drawn" };
          j.status = "succeeded";
        });
        break;
      }
      case "pages":
      case "reroll":
        await runPages(start, ectx, deps);
        break;
      case "layout": {
        const input = start.input;
        const plan = artPlan({ pages: input.story?.pages ?? [] });
        const art = Object.fromEntries(Object.entries(input.artFiles ?? {}));
        const pdfFiles = await engine.layout(ectx, plan, art);
        await patch((j) => {
          j.result = { pdfFiles };
          j.progress = { done: 1, total: 1, label: "Print files ready" };
          j.status = "succeeded";
        });
        break;
      }
    }
  } catch (e) {
    const message = e instanceof FatalJobError ? e.message : "Something went wrong while drawing. Try again.";
    log(`job ${jobId} failed: ${redact(String((e as Error).stack ?? e))}`);
    await patch((j) => {
      j.status = "failed";
      j.error = message;
    });
  } finally {
    clearInterval(beat);
  }
  return jobs.update(jobId, (j) => ({ ...j, finishedAt: new Date().toISOString() }));
}

async function runPages(start: Job, ectx: EngineCtx, deps: RunnerDeps) {
  const { jobs, engine } = deps;
  const input = start.input;
  const plan = artPlan({ pages: input.story?.pages ?? [] });
  const ids = input.pageIds ?? plan.map((p) => p.id);
  const targets = ids.map((id) => plan.find((p) => p.id === id)).filter((p): p is PagePlanLite => !!p);
  if (!targets.length) throw new Error("No pages to draw");

  await jobs.update(start.id, (j) => ({
    ...j,
    progress: { done: 0, total: targets.length, label: "Getting ready" },
    pages: Object.fromEntries(targets.map((p) => [p.id, { status: "pending", versions: [] } as JobPageState])),
  }));
  await engine.preparePages(ectx, plan);

  let done = 0;
  let failed = 0;
  for (const page of targets) {
    if (await jobs.isCancelRequested(start.id)) {
      await jobs.update(start.id, (j) => ({ ...j, status: "cancelled" }));
      return;
    }
    const isRedraw = start.kind === "reroll";
    await jobs.update(start.id, (j) => ({
      ...j,
      progress: { ...j.progress, label: `Drawing ${labelFor(page)}` },
      pages: { ...j.pages, [page.id]: { status: isRedraw ? "redrawing" : "rendering", versions: [] } },
    }));
    let version: Awaited<ReturnType<BookEngine["renderPage"]>> = null;
    let blockedMessage = "";
    try {
      version = await engine.renderPage(ectx, page, { note: input.note });
    } catch (e) {
      if (!(e instanceof PageBlockedError)) throw e;
      blockedMessage = e.userMessage; // blocked after its one automatic re-roll: no further retry, offer a different direction
    }
    if (!version && !blockedMessage) {
      // one automatic retry, shown as "Redrawing"
      await jobs.update(start.id, (j) => ({ ...j, pages: { ...j.pages, [page.id]: { status: "redrawing", versions: [] } } }));
      try {
        version = await engine.renderPage(ectx, page, { note: input.note });
      } catch (e) {
        if (!(e instanceof PageBlockedError)) throw e;
        blockedMessage = e.userMessage;
      }
    }
    done++;
    if (!version) failed++;
    await jobs.update(start.id, (j) => ({
      ...j,
      progress: { ...j.progress, done },
      pages: {
        ...j.pages,
        [page.id]: version
          ? { status: "done", versions: [version] }
          : { status: "failed", versions: [], error: blockedMessage || "We couldn't draw this one. Try again." },
      },
    }));
  }
  await jobs.update(start.id, (j) => ({
    ...j,
    status: failed ? "failed" : "succeeded",
    error: failed ? `${failed} ${failed === 1 ? "page" : "pages"} didn't draw.` : undefined,
    progress: { ...j.progress, label: failed ? "Some pages need another try" : "All pages drawn" },
  }));
}

function labelFor(p: PagePlanLite): string {
  if (p.kind === "cover") return "the cover";
  if (p.kind === "back") return "the back cover";
  return `page ${p.id.replace(/^p/, "")}`;
}
