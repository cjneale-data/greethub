import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ART_STYLES, type Character } from "@greethub/shared";
import type { ContentPart } from "../openrouter.js";
import { photoPart } from "../imageutil.js";
import type { Ctx } from "../types.js";

/** Everyone who must look the same across renders: main characters then the optional pet. */
export function cast(brief: Ctx["brief"]): Character[] {
  return [...brief.characters, ...(brief.pet ? [brief.pet] : [])];
}

/** Photos in cast order (first `perPerson` per character) plus the matching text index. */
export async function castPhotos(ctx: Ctx, perPerson = 1): Promise<{ parts: ContentPart[]; index: string }> {
  const parts: ContentPart[] = [];
  const names: string[] = [];
  for (const c of cast(ctx.brief)) {
    for (const id of c.photoIds.slice(0, perPerson)) {
      parts.push(await photoPart(await ctx.photos.get(id)));
      names.push(c.name);
    }
  }
  return { parts, index: names.join(", ") };
}

/** Stage 1: vision over the photos -> locked identity sheet (plain text). Port of stage_sheet. */
export async function identitySheet(ctx: Ctx): Promise<string> {
  const people = cast(ctx.brief);
  const roster = people
    .map((c) => `${c.name} (${c.ageBand}${c.pronouns ? `, ${c.pronouns}` : ""}, ${c.role})`)
    .join("; ");
  const { parts, index } = await castPhotos(ctx, 2);
  const text =
    "You are the art director for a personalized illustrated " +
    (ctx.brief.product === "book" ? "children's picture book" : "greeting card") +
    ". From these reference photos write a concise IDENTITY SHEET for cartoon translation.\n" +
    `Cast: ${roster}.\n` +
    "For each cast member give 3-4 physical anchors (age look, hair colour/length/style, face shape, eye colour) that distinguish them from each other, " +
    "and one line on their smile (are teeth showing; a full row of teeth, or closed). " +
    "Lock one 'uniform' for each: a distinct, colour-coded outfit plus shoes, with clearly different colours per person. " +
    "Use ONLY the clothing you choose, never the clothing in the photos. Describe pets by coat, markings and size. " +
    (ctx.brief.settingDetails ? `Setting notes from the buyer: ${ctx.brief.settingDetails}\n` : "") +
    "Output plain text, no preamble. Images attached in order (one per line of this list): " +
    index +
    ".";
  const content: ContentPart[] = [{ type: "text", text }, ...parts];
  const sheet = await ctx.client.text({ content, stage: "identity", label: "identity_sheet" });
  if (!sheet) throw new Error("Identity sheet call failed");
  mkdirSync(ctx.workDir, { recursive: true });
  writeFileSync(join(ctx.workDir, "identity_sheet.txt"), sheet, "utf8");
  return sheet;
}

export const styleOf = (brief: Ctx["brief"]) => ART_STYLES[brief.artStyle].prompt;
