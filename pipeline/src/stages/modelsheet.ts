import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cast, castPhotos, styleOf } from "./identity.js";
import type { ContentPart } from "../openrouter.js";
import type { Ctx } from "../types.js";

/** Stage 2: one character lineup that every later render copies. The user approves it before any page renders
 *  (this gate is the main cost guard: a bad character costs one render, not fourteen). Port of stage_modelsheet. */
export async function modelSheet(ctx: Ctx, identity: string): Promise<{ file: string; model: string }> {
  const names = cast(ctx.brief).map((c) => c.name);
  const text =
    `${styleOf(ctx.brief)}\n\nCHARACTER MODEL SHEET for a ${ctx.brief.product === "book" ? "picture book" : "greeting card"}. Square 1:1. ` +
    "Plain warm cream background, soft even light. " +
    (names.length > 1 ? "The characters stand side by side" : "The character stands") +
    ", full body head to toe, facing the viewer, smiling, arms relaxed, evenly spaced, nothing overlapping. " +
    `Left to right: ${names.join(", ")}. ` +
    "Draw each EXACTLY per the identity sheet below - hairstyle, face, relative height, smile and locked outfit. " +
    "No text, labels or letters.\n\n" +
    `Reference photos attached in order ${names.join(", ")} are for likeness only (ignore their clothes).\n\nIDENTITY SHEET:\n` +
    identity;
  const { parts } = await castPhotos(ctx, 1);
  const content: ContentPart[] = [{ type: "text", text }, ...parts];
  const img = await ctx.client.image({ content, stage: "modelsheet", label: "modelsheet", size: ctx.imageSize, aspectRatio: "1:1" });
  if (!img) throw new Error("Model sheet generation failed on every model");
  const dir = join(ctx.workDir, "images");
  mkdirSync(dir, { recursive: true });
  const n = readdirSync(dir).filter((f) => f.startsWith("modelsheet_v")).length + 1;
  const file = join(dir, `modelsheet_v${n}.png`);
  writeFileSync(file, img.data);
  return { file, model: img.model };
}
