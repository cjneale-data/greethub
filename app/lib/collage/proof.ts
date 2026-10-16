import sharp from "sharp";
import { renderPage } from "./render";
import { PRINT_DPI } from "./sizes";
import type { CardPdfInput } from "./pdf";

/**
 * Proof JPEG: the same input as the print PDF (`CardPdfInput`) composed by the same `renderPage`, full size with bleed
 * (5x7 is 1575 x 2175 px at 300 DPI), with the trim line (red) and safe-area line (blue) drawn on. Guide lines are for the
 * customer only: this image is never sent to the printer. Text is drawn by librsvg, so line breaks and faces can differ
 * a little from the PDF's embedded fonts; the PDF is what prints.
 */
export type ProofJpeg = { side: "front" | "back"; jpeg: Buffer; width: number; height: number; dpi: number };

export async function renderProofJpegs(
  input: CardPdfInput,
  opts: { dpi?: number; quality?: number; guides?: boolean; fontFamilies?: Record<string, string> } = {},
): Promise<ProofJpeg[]> {
  const dpi = opts.dpi ?? PRINT_DPI;
  const sides: ["front" | "back", CardPdfInput["front"]][] = [["front", input.front]];
  if (input.back) sides.push(["back", input.back]);
  const out: ProofJpeg[] = [];
  for (const [side, data] of sides) {
    const r = await renderPage({ ...data, size: input.size }, { dpi, text: "svg", guides: opts.guides ?? true, fontFamilies: opts.fontFamilies });
    // No EXIF, no customer metadata: the raster was composed from decoded pixels.
    const jpeg = await sharp(r.png).removeAlpha().withDensity(dpi).jpeg({ quality: opts.quality ?? 88 }).toBuffer();
    out.push({ side, jpeg, width: r.width, height: r.height, dpi });
  }
  return out;
}
