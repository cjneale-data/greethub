import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { PDFFont } from "pdf-lib";

/**
 * Font access for the stock renderer without a PDF document: widths for fitting (the same numbers pdf-lib's embedded
 * fonts report, both come from fontkit's layout) and glyph outlines as SVG paths, so the PNG preview never depends on
 * system fonts (Vercel has none; same reason the watermark is a path).
 */
type FkFont = { unitsPerEm: number; layout: (s: string) => { glyphs: { path: { toSVG: () => string } }[]; positions: { xAdvance: number; xOffset: number; yOffset: number }[] } };

export type MeasureFont = { widthOfTextAtSize: (text: string, size: number) => number; asPdfFont: PDFFont; fk: FkFont };

const cache = new Map<string, MeasureFont>();

/** Print fonts live in pipeline/fonts (brand), public/fonts/handwriting (presets and signatures). cwd is app/. */
export const pipelineFontPath = (file: string) => path.join(process.cwd(), "..", "pipeline", "fonts", file);
export const handwritingFontPath = (file: string) => path.join(process.cwd(), "public", "fonts", "handwriting", path.basename(file));

export function measureFontFromBuffer(buf: Buffer): MeasureFont {
  const fk = (fontkit as unknown as { create: (b: Buffer) => FkFont }).create(buf);
  // Width at 1 unit of size is memoised: fitting asks for the same strings at many sizes.
  const unit = new Map<string, number>();
  const widthOfTextAtSize = (text: string, size: number) => {
    let u = unit.get(text);
    if (u === undefined) {
      u = fk.layout(text).positions.reduce((n, p) => n + p.xAdvance, 0) / fk.unitsPerEm;
      if (unit.size > 20000) unit.clear();
      unit.set(text, u);
    }
    return u * size;
  };
  // fitText only calls widthOfTextAtSize, so this stands in for a PDFFont.
  return { widthOfTextAtSize, asPdfFont: { widthOfTextAtSize } as unknown as PDFFont, fk };
}

export function loadMeasureFont(file: string, resolve: (f: string) => string): MeasureFont {
  const p = resolve(file);
  let f = cache.get(p);
  if (!f) {
    f = measureFontFromBuffer(readFileSync(p));
    cache.set(p, f);
  }
  return f;
}

/** One line of text as an SVG fragment of filled paths. (x, baselineY) in output px; size in output px. */
export function textPaths(font: MeasureFont, text: string, x: number, baselineY: number, size: number, fill: string): string {
  const run = font.fk.layout(text);
  const k = size / font.fk.unitsPerEm;
  let pen = 0;
  const out: string[] = [];
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const d = g.path.toSVG();
    if (d) out.push(`<path d="${d}" transform="translate(${(x + (pen + pos.xOffset) * k).toFixed(2)} ${(baselineY - pos.yOffset * k).toFixed(2)}) scale(${k.toFixed(5)} ${(-k).toFixed(5)})"/>`);
    pen += pos.xAdvance;
  });
  return `<g fill="${fill}">${out.join("")}</g>`;
}
