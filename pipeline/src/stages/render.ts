import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cast } from "./identity.js";
import { renderLead } from "./prompts.js";
import { qaPage } from "./qa.js";
import { photoPart } from "../imageutil.js";
import type { ContentPart } from "../openrouter.js";
import type { Ctx, PagePlan, RenderResult } from "../types.js";
import { readFileSync } from "node:fs";

export const aspectFor = (ctx: Ctx) => (ctx.brief.product === "book" ? "1:1" : "3:4");

/** Stage 5 + 6: render one page with the model sheet attached first, run QA, auto re-roll at most once. */
export async function renderPage(
  ctx: Ctx,
  page: PagePlan,
  prompt: string,
  modelSheetFile: string,
  opts: { qa?: boolean; visionQa?: boolean } = {},
): Promise<RenderResult | null> {
  const people = cast(ctx.brief);
  const present = people.filter((c) => page.characters.includes(c.name));
  const photoParts: ContentPart[] = [];
  const photoNames: string[] = [];
  for (const c of present) {
    if (c.photoIds[0]) {
      photoParts.push(await photoPart(await ctx.photos.get(c.photoIds[0]), 768));
      photoNames.push(c.name);
    }
  }
  const sheetPart = await photoPart(readFileSync(modelSheetFile), 1280);
  const text = `${renderLead(people.map((c) => c.name), photoNames)}\n\n${prompt}`;
  const content: ContentPart[] = [{ type: "text", text }, sheetPart, ...photoParts];

  const dir = join(ctx.workDir, "images");
  mkdirSync(dir, { recursive: true });
  const maxRolls = 2; // first render + at most one automatic re-roll
  let last: RenderResult | null = null;
  for (let roll = 1; roll <= maxRolls; roll++) {
    const img = await ctx.client.image({
      content,
      stage: "render",
      label: roll === 1 ? page.id : `${page.id}#reroll`,
      size: ctx.imageSize,
      aspectRatio: aspectFor(ctx),
    });
    if (!img) return last;
    const n = readdirSync(dir).filter((f) => f.startsWith(`${page.id}_v`)).length + 1;
    const file = join(dir, `${page.id}_v${n}.png`);
    writeFileSync(file, img.data);
    const qa = opts.qa === false ? null : await qaPage(ctx, page, img.data, { vision: opts.visionQa });
    last = { id: page.id, file, model: img.model, size: img.size, attempts: roll, qa };
    ctx.log(`  saved ${page.id}_v${n}.png (${img.model} @ ${img.size}) qa=${qa ? (qa.pass ? "pass" : "FAIL: " + qa.notes) : "off"}`);
    if (!qa || qa.pass) return last;
  }
  return last; // second attempt kept even if QA still fails; the user can re-roll from their allowance
}
