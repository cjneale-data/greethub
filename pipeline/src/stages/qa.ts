import sharp from "sharp";
import { extractJson, photoPart } from "../imageutil.js";
import type { Ctx, PagePlan, QaVerdict } from "../types.js";

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

/** Stage 6: cheap automatic QA. Local border check first (free); vision check only if that passes, for count and stray text. */
export async function qaPage(ctx: Ctx, page: PagePlan, png: Buffer, opts: { vision?: boolean } = {}): Promise<QaVerdict> {
  const expected = page.characters.length;
  const whiteBorder = await hasWhiteBorder(png);
  if (whiteBorder) {
    return { pass: false, expectedCount: expected, whiteBorder, notes: "white border detected on an edge", source: "local" };
  }
  if (opts.vision === false) {
    return { pass: true, expectedCount: expected, whiteBorder, notes: "vision QA skipped", source: "skipped" };
  }
  const q =
    `Picture-book illustration QA. The cast that must appear: ${expected}${expected ? ` (${page.characters.join(", ")})` : ""}. ` +
    "Count ONLY cast members (the people, and any pet named in the cast). Ignore other animals, creatures and decorative details that belong to the scene. " +
    "Is any readable text, letters or numbers visible in the image? " +
    'Reply ONLY JSON: {"character_count": int, "text_in_image": bool, "notes": str (max 15 words)}';
  const raw = await ctx.client.text({
    content: [{ type: "text", text: q }, await photoPart(png, 768)],
    stage: "qa",
    label: `qa_${page.id}`,
  });
  if (!raw) return { pass: true, expectedCount: expected, whiteBorder, notes: "QA call failed; not blocking", source: "local" };
  try {
    const j = extractJson<{ character_count: number; text_in_image: boolean; notes: string }>(raw);
    const pass = j.character_count === expected && !j.text_in_image;
    return {
      pass,
      characterCount: j.character_count,
      expectedCount: expected,
      whiteBorder,
      textInImage: j.text_in_image,
      notes: j.notes,
      source: "local+vision",
    };
  } catch {
    return { pass: true, expectedCount: expected, whiteBorder, notes: "QA reply unparseable; not blocking", source: "local" };
  }
}
