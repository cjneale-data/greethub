import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractJson } from "../imageutil";
import { GUIDELINES } from "../guidelines";
import { cast, styleOf } from "./identity";
import { IMAGE_HARDENING_LINES, sanitizeImagePrompt } from "../safety/index";
import type { Ctx, PagePlan } from "../types";

/** Lines that code (not the LLM) appends to every page prompt. These are the Eye Story lessons: image models
 *  ignore soft requests, so every page restates them identically. */
export function guardLines(page: PagePlan): string {
  const n = page.characters.length;
  const count =
    n === 0
      ? "COUNT: no people or animals appear in this image."
      : `COUNT: EXACTLY ${n} cast member${n === 1 ? "" : "s"} appear${n === 1 ? "s" : ""}: ${page.characters.join(", ")}. No extra people, no duplicates, no background figures, no cropped or partial bodies. Animals appear only if the scene describes them.`;
  const zone = page.textZone ? ` Keep this region calm and uncluttered: ${page.textZone}.` : "";
  return [
    "FULL-BLEED: the illustration runs edge to edge on all four sides. No white border, no frame, no margin, no vignette fading to white or paper.",
    `FRAMING: pull the camera back so every character is fully inside the frame with at least 12% empty background between them and every edge. Nothing important (faces, hands, props) sits in the outer 12%.${zone}`,
    count,
    "OUTFIT: each character wears exactly their locked outfit from the model sheet, identical to every other page - same colours, same cut, no added stripes, patterns, buttons or pockets. Smiles show the same teeth as the model sheet (a full row of teeth stays a full row, never a gap).",
    "No text, letters, numbers or words anywhere in the image.",
    ...IMAGE_HARDENING_LINES,
  ].join("\n");
}

/** Lead paragraph for a render call: the model sheet is attached FIRST and is the authority. */
export function renderLead(names: string[], photoNames: string[]): string {
  let lead =
    `The FIRST attached image is the approved character model sheet (left to right: ${names.join(", ")}). ` +
    "It is the authority: copy each character's face, hair and outfit from it exactly - same colours, same cut, no added stripes, patterns, buttons or pockets. ";
  if (photoNames.length) {
    lead +=
      `Further reference photos, in order: ${photoNames.join(", ")}. Use them ONLY for likeness (hair, face shape, colouring) - ` +
      "translate into the illustrated style, never photorealistic, and ignore the clothing in the photos.";
  }
  return lead;
}

/** Stage 4: Sonnet writes one self-contained scene prompt per page; code then appends the guard lines. */
export async function pagePrompts(ctx: Ctx, identity: string, pages: PagePlan[]): Promise<Record<string, string>> {
  const aspect = ctx.brief.product === "book" ? "1:1 square" : "3:4 portrait";
  const list = pages.map((p) => ({ id: p.id, kind: p.kind, scene: p.scene, characters: p.characters, text_zone: p.textZone ?? null }));
  const instr =
    "Write one image-generation prompt per page id below. Each prompt is self-contained (the image model sees nothing else except the model sheet and reference photos), 90-160 words, and must: " +
    "restate the global style string verbatim; restate every visible character's anchors and locked outfit from the identity sheet; use exaggerated cartoon expressions; keep subjects centered; " +
    `state ${aspect}; describe the scene concretely. Do not write any text, letters or words into the scene. Do not add the framing/count lines (they are appended for you). ` +
    "Return ONLY a JSON object {page_id: prompt}.\n\n" +
    `GLOBAL STYLE: ${styleOf(ctx.brief)}\n\nIDENTITY SHEET:\n${identity}\n\nPAGES:\n${JSON.stringify(list, null, 1)}`;
  const raw = await ctx.client.text({ content: [{ type: "text", text: instr }], system: GUIDELINES, stage: "prompts", label: "page_prompts" });
  if (!raw) throw new Error("Prompt call failed");
  const body = extractJson<Record<string, string>>(raw);
  const out: Record<string, string> = {};
  for (const p of pages) {
    const base = body[p.id];
    if (!base) throw new Error(`No prompt returned for page ${p.id}`);
    // Last-mile sanitiser: nothing the model wrote reaches the image model with a protected name, brand or slogan in it.
    const safeBase = sanitizeImagePrompt(base.trim(), [...cast(ctx.brief).map((c) => c.name), ctx.brief.recipient.name]).text;
    out[p.id] = `${safeBase}\n\n${guardLines(p)}`;
  }
  writeFileSync(join(ctx.workDir, "prompts.json"), JSON.stringify(out, null, 2), "utf8");
  return out;
}

export { cast };
