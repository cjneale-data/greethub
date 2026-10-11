import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cast } from "./identity.js";
import { renderLead } from "./prompts.js";
import { qaPage } from "./qa.js";
import { photoPart } from "../imageutil.js";
import type { ContentPart } from "../openrouter.js";
import { IP_MAX_AUTO_REROLLS, logOutputFlagged, logOutputRerolled, rerollAddendum, sanitizeImagePrompt, type OutputProblem } from "../safety/index.js";
import type { Ctx, PagePlan, QaVerdict, RenderResult } from "../types.js";

export const aspectFor = (ctx: Ctx) => (ctx.brief.product === "book" ? "1:1" : "3:4");

const problemsOf = (qa: QaVerdict | null): OutputProblem[] => (qa?.ip?.flags ?? []) as OutputProblem[];

/** Stage 5 + 6: render one page with the model sheet attached first, run QA, auto re-roll at most once.
 *  If the IP check (protected character, logo, slogan, licensed merchandise, look-alike risk) fails, the single re-roll uses a
 *  hardened prompt that names the specific problem. If it fails again the page is BLOCKED: the file is deleted and the result
 *  carries ipBlocked so the caller can show a friendly message and offer a different direction (docs/legal/07). */
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
  // Last-mile sanitiser on the exact prompt text (covers buyer notes appended after the prompts were written).
  prompt = sanitizeImagePrompt(prompt, [...people.map((c) => c.name), ctx.brief.recipient.name]).text;
  const lead = renderLead(people.map((c) => c.name), photoNames);
  const contentFor = (extra: string): ContentPart[] => [{ type: "text", text: `${lead}\n\n${prompt}${extra ? `\n\n${extra}` : ""}` }, sheetPart, ...photoParts];

  const dir = join(ctx.workDir, "images");
  mkdirSync(dir, { recursive: true });
  const maxRolls = 1 + Math.max(1, IP_MAX_AUTO_REROLLS); // first render + at most one automatic re-roll
  let last: RenderResult | null = null;
  let addendum = "";
  let flaggedFirst: OutputProblem[] = [];
  let costBeforeReroll = 0;
  for (let roll = 1; roll <= maxRolls; roll++) {
    if (roll === 2) costBeforeReroll = ctx.client.ledger.totalUsd();
    const img = await ctx.client.image({
      content: contentFor(addendum),
      stage: "render",
      label: roll === 1 ? page.id : `${page.id}#reroll`,
      size: ctx.imageSize,
      aspectRatio: aspectFor(ctx),
    });
    if (!img) return last;
    const n = readdirSync(dir).filter((f) => f.startsWith(`${page.id}_v`)).length + 1;
    const file = join(dir, `${page.id}_v${n}.png`);
    writeFileSync(file, img.data);
    const qa = opts.qa === false ? null : await qaPage(ctx, page, img.data, { vision: opts.visionQa, labelSuffix: roll === 1 ? "" : "#reroll" });
    last = { id: page.id, file, model: img.model, size: img.size, attempts: roll, qa };
    ctx.log(`  saved ${page.id}_v${n}.png (${img.model} @ ${img.size}) qa=${qa ? (qa.pass ? "pass" : "FAIL: " + qa.notes) : "off"}`);
    const problems = problemsOf(qa);

    if (roll === 2 && flaggedFirst.length) {
      logOutputRerolled({ pageId: page.id, flags: flaggedFirst, passedAfterReroll: problems.length === 0, costUsd: Number((ctx.client.ledger.totalUsd() - costBeforeReroll).toFixed(5)) });
    }
    if (!qa || qa.pass) return last;
    if (problems.length) {
      logOutputFlagged({ pageId: page.id, flags: problems, lookalikeRisk: qa?.ip?.lookalikeRisk, isFinal: roll === maxRolls });
      if (roll === 1) flaggedFirst = problems;
      if (roll === maxRolls) {
        // Blocked: never hand a flagged picture to the customer, the proof or the printer.
        try {
          unlinkSync(file);
        } catch {
          /* already gone */
        }
        return { ...last, file: "", ipBlocked: true, ipFlags: problems };
      }
      addendum = rerollAddendum(problems, qa?.ip?.recognizableProtectedCharacter);
    } else {
      addendum = "";
    }
  }
  return last; // second attempt kept even if (non-IP) QA still fails; the user can re-roll from their allowance
}
