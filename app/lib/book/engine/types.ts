import type { AssetVersion, Job, PagePlanLite } from "../types";

/** Thrown for failures that must stop the whole job (spend cap, missing key), not just one page. */
export class FatalJobError extends Error {}

export type EngineCtx = {
  job: Job;
  /** Per-project working directory (images, prompts, ledger). */
  workDir: string;
  imagesDir: string;
  log: (m: string) => void;
  /** Add the spend of one call (USD) to the job total. */
  reportCost: (usd: number) => void;
};

export type StoryOut = { title: string; blurb: string; pages: PagePlanLite[] };

/**
 * What a job needs from "the thing that makes things". `mock` makes placeholders for free; `live` calls the
 * pipeline stages (identity sheet, model sheet, story, prompts, render + QA, layout).
 */
export interface BookEngine {
  story(ctx: EngineCtx): Promise<StoryOut>;
  sheet(ctx: EngineCtx): Promise<AssetVersion>;
  /** One-off setup before a page loop (live: page prompts). */
  preparePages(ctx: EngineCtx, plan: PagePlanLite[]): Promise<void>;
  /** Returns the new version, or null when the page could not be drawn. */
  renderPage(ctx: EngineCtx, page: PagePlanLite, opts: { note?: string }): Promise<AssetVersion | null>;
  /** Print files from the current art. Returns role -> absolute path. */
  layout(ctx: EngineCtx, plan: PagePlanLite[], artFiles: Record<string, string>): Promise<Record<string, string>>;
}

export function nextVersionFile(existing: string[], base: string, ext: string): string {
  const n = existing.filter((f) => f.startsWith(`${base}_v`)).length + 1;
  return `${base}_v${n}.${ext}`;
}
