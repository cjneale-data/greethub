import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bookSpreads, type BookBrief, type CardBrief } from "@greethub/shared";
import { identitySheet } from "./stages/identity";
import { modelSheet } from "./stages/modelsheet";
import { writeCardCopy, writeStory } from "./stages/copy";
import { pagePrompts } from "./stages/prompts";
import { renderPage } from "./stages/render";
import { IpBlockedError, PAGE_BLOCKED_MESSAGE } from "./safety/index";
import { layoutBook, type BookLayoutReport } from "./layout/book";
import { layoutCard, type CardLayoutReport } from "./layout/card";
import type { Ctx, PagePlan, RenderResult } from "./types";

export type RunOptions = {
  /** Called with the model sheet file. Return false to stop before any page render (the user-approval gate). */
  approveModelSheet?: (file: string) => Promise<boolean> | boolean;
  /** Test builds: render only this many story spreads (plus the cover). */
  spreads?: number;
  /** Render a back cover too (full books). */
  backCover?: boolean;
  visionQa?: boolean;
};

export type RunSummary = {
  product: "card" | "book";
  modelSheet: string;
  renders: RenderResult[];
  layout: CardLayoutReport | BookLayoutReport;
  costUsd: number;
};

/** Re-roll-free ordered render loop. Failures return null for the page; the caller decides what to do. */
async function renderAll(ctx: Ctx, pages: PagePlan[], prompts: Record<string, string>, sheet: string, opts: RunOptions) {
  const out: RenderResult[] = [];
  for (const p of pages) {
    const r = await renderPage(ctx, p, prompts[p.id], sheet, { visionQa: opts.visionQa });
    if (!r) throw new Error(`Render failed for ${p.id} on every model`);
    if (r.ipBlocked) throw new IpBlockedError(PAGE_BLOCKED_MESSAGE);
    out.push(r);
  }
  return out;
}

export async function runCard(ctx: Ctx, opts: RunOptions = {}): Promise<RunSummary> {
  const brief = ctx.brief as CardBrief;
  mkdirSync(ctx.workDir, { recursive: true });
  const identity = await identitySheet(ctx);
  const sheet = await modelSheet(ctx, identity);
  ctx.log(`model sheet: ${sheet.file}`);
  if (opts.approveModelSheet && !(await opts.approveModelSheet(sheet.file))) throw new Error("Model sheet not approved; no pages rendered");

  const copy = await writeCardCopy(ctx);
  const prompts = await pagePrompts(ctx, identity, copy.pages);
  const renders = await renderAll(ctx, copy.pages, prompts, sheet.file, opts);
  const byId = Object.fromEntries(renders.map((r) => [r.id, readFileSync(r.file)]));
  const layout = await layoutCard(
    { title: copy.title, message: copy.message, frontArt: byId.front, insideArt: brief.insideIllustration ? byId.inside : undefined },
    join(ctx.workDir, "print"),
    "card",
  );
  return { product: "card", modelSheet: sheet.file, renders, layout, costUsd: ctx.client.ledger.totalUsd() };
}

export async function runBook(ctx: Ctx, opts: RunOptions = {}): Promise<RunSummary> {
  const brief = ctx.brief as BookBrief;
  mkdirSync(ctx.workDir, { recursive: true });
  const identity = await identitySheet(ctx);
  const sheet = await modelSheet(ctx, identity);
  ctx.log(`model sheet: ${sheet.file}`);
  if (opts.approveModelSheet && !(await opts.approveModelSheet(sheet.file))) throw new Error("Model sheet not approved; no pages rendered");

  const spreads = opts.spreads ?? bookSpreads(brief.pageCount);
  const story = await writeStory(ctx, spreads);
  writeFileSync(join(ctx.workDir, "story.json"), JSON.stringify(story, null, 2), "utf8");
  const plan: PagePlan[] = [...story.pages];
  if (opts.backCover) plan.push({ id: "back", kind: "back", scene: "Back cover: a calm, charming closing scene of the cast waving goodbye in the story's setting, with open space in the middle.", characters: story.pages[0].characters });
  const prompts = await pagePrompts(ctx, identity, plan);
  const renders = await renderAll(ctx, plan, prompts, sheet.file, opts);
  const art = Object.fromEntries(renders.map((r) => [r.id, readFileSync(r.file)]));
  const layout = await layoutBook(
    {
      title: story.title,
      blurb: story.blurb,
      coverArt: art.cover,
      backArt: art.back,
      spreads: story.pages.filter((p) => p.kind === "spread").map((p) => ({ text: p.text ?? "", art: art[p.id] })),
    },
    join(ctx.workDir, "print"),
    "book",
  );
  return { product: "book", modelSheet: sheet.file, renders, layout, costUsd: ctx.client.ledger.totalUsd() };
}
