import sharp from "sharp";
import { extractJson, photoPart } from "../imageutil";
import type { OpenRouterClient } from "../openrouter";
import { LOOKALIKE_RISK_FAIL_AT } from "../safety/thresholds";
import type { Ctx, IpVisionResult, PagePlan, QaVerdict } from "../types";

/** Free local check: do any of the four edges look like a flat white/cream border? */
export async function hasWhiteBorder(png: Buffer): Promise<boolean> {
  const N = 128;
  const { data } = await sharp(png).resize(N, N, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const strip = 3;
  const edges: number[][] = [[], [], [], []];
  for (let i = 0; i < N; i++) {
    for (let s = 0; s < strip; s++) {
      edges[0].push(data[s * N + i]); // top
      edges[1].push(data[(N - 1 - s) * N + i]); // bottom
      edges[2].push(data[i * N + s]); // left
      edges[3].push(data[i * N + (N - 1 - s)]); // right
    }
  }
  return edges.some((e) => {
    const mean = e.reduce((a, b) => a + b, 0) / e.length;
    const sd = Math.sqrt(e.reduce((a, b) => a + (b - mean) ** 2, 0) / e.length);
    return mean >= 250 && sd < 5; // near-pure white band; cream paper and pale skies are legitimate
  });
}

type RawVision = {
  character_count?: number;
  text_in_image?: boolean;
  recognizable_protected_character?: string | null;
  logo_or_brand_mark?: boolean;
  slogan_or_trademarked_text?: boolean;
  licensed_merch_on_clothing?: boolean;
  character_lookalike_risk?: number;
  notes?: string;
};

const NONE = /^\s*(none|null|no|n\/a|nobody|no one|unknown|original)?\s*$/i;

/** Turns the model's raw IP fields into flags. Missing fields count as "not flagged" so old replies stay valid.
 *  Pure and unit-tested. Threshold: LOOKALIKE_RISK_FAIL_AT in ../safety/thresholds.ts. */
export function ipFromVision(j: RawVision): IpVisionResult {
  const guess = typeof j.recognizable_protected_character === "string" && !NONE.test(j.recognizable_protected_character) ? j.recognizable_protected_character.trim().slice(0, 80) : null;
  const risk = Math.max(0, Math.min(10, Math.round(Number(j.character_lookalike_risk) || 0)));
  const flags: IpVisionResult["flags"] = [];
  if (guess) flags.push("protected_character");
  if (j.logo_or_brand_mark === true) flags.push("logo");
  if (j.slogan_or_trademarked_text === true) flags.push("slogan");
  if (j.licensed_merch_on_clothing === true) flags.push("licensed_merch");
  if (risk >= LOOKALIKE_RISK_FAIL_AT) flags.push("lookalike_risk");
  return { recognizableProtectedCharacter: guess, logoOrBrandMark: j.logo_or_brand_mark === true, slogan: j.slogan_or_trademarked_text === true, licensedMerchOnClothing: j.licensed_merch_on_clothing === true, lookalikeRisk: risk, flags };
}

/** The vision question. Starts with "Picture-book illustration QA" (the test mock routes on that prefix). */
export function visionQuestion(expected: number, names: string[]): string {
  return (
    `Picture-book illustration QA. The cast that must appear: ${expected}${expected ? ` (${names.join(", ")})` : ""}. ` +
    "Count ONLY cast members (the people, and any pet named in the cast). Ignore other animals, creatures and decorative details that belong to the scene. " +
    "Is any readable text, letters or numbers visible in the image? " +
    "Also check for intellectual-property problems. recognizable_protected_character: if ANY figure, creature, costume or prop resembles an existing cartoon, film, game, toy or comic character (even partly, even a close look-alike), give your best-guess name, otherwise null. " +
    "logo_or_brand_mark: true if any logo, brand mark, emblem or trademark is visible (including on clothing, bags, toys or products). " +
    "slogan_or_trademarked_text: true if any slogan, catchphrase or trademarked wording is visible. " +
    "licensed_merch_on_clothing: true if clothing or objects carry a printed or licensed character. " +
    "character_lookalike_risk: integer 0-10, 0 = clearly original design, 10 = clearly a known character. " +
    'Reply ONLY JSON: {"character_count": int, "text_in_image": bool, "recognizable_protected_character": str|null, "logo_or_brand_mark": bool, "slogan_or_trademarked_text": bool, "licensed_merch_on_clothing": bool, "character_lookalike_risk": int, "notes": str (max 15 words)}'
  );
}

/** One vision call on a rendered image. Returns null when the call failed or the reply was unreadable (callers do not block on that). */
export async function visionCheck(client: OpenRouterClient, png: Buffer, label: string, expected: number, names: string[]): Promise<{ raw: RawVision; ip: IpVisionResult } | null> {
  const raw = await client.text({ content: [{ type: "text", text: visionQuestion(expected, names) }, await photoPart(png, 768)], stage: "qa", label });
  if (!raw) return null;
  try {
    const j = extractJson<RawVision>(raw);
    return { raw: j, ip: ipFromVision(j) };
  } catch {
    return null;
  }
}

/** Stage 6: automatic QA. Free local check (white border) plus, unless disabled, one vision call for count, stray text and the
 *  IP checks (protected character, logo, slogan, licensed merchandise, look-alike risk). `label` suffixes the ledger label for re-rolls. */
export async function qaPage(ctx: Ctx, page: PagePlan, png: Buffer, opts: { vision?: boolean; labelSuffix?: string } = {}): Promise<QaVerdict> {
  const expected = page.characters.length;
  const whiteBorder = await hasWhiteBorder(png);
  if (opts.vision === false) {
    return whiteBorder
      ? { pass: false, expectedCount: expected, whiteBorder, notes: "white border detected on an edge", source: "local" }
      : { pass: true, expectedCount: expected, whiteBorder, notes: "vision QA skipped", source: "skipped" };
  }
  // The vision call runs even when the local check failed, so the IP check is never skipped on a page that may be kept.
  const v = await visionCheck(ctx.client, png, `qa_${page.id}${opts.labelSuffix ?? ""}`, expected, page.characters);
  if (!v) {
    return { pass: !whiteBorder, expectedCount: expected, whiteBorder, notes: whiteBorder ? "white border detected on an edge" : "QA call failed; not blocking", source: "local" };
  }
  const j = v.raw;
  const countOk = j.character_count === expected;
  const pass = !whiteBorder && countOk && !j.text_in_image && v.ip.flags.length === 0;
  const notes = whiteBorder ? "white border detected on an edge" : v.ip.flags.length ? `${j.notes ?? ""} [IP: ${v.ip.flags.join(", ")}]`.trim() : (j.notes ?? "");
  return { pass, characterCount: j.character_count, expectedCount: expected, whiteBorder, textInImage: j.text_in_image, ip: v.ip, notes, source: "local+vision" };
}
