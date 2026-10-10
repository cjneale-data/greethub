import { PDFDocument, PDFFont, PDFPage, rgb, type Color } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

export const IN = 72; // PDF points per inch
export const DPI = 300;

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "fonts");

export type Fonts = { body: PDFFont; bold: PDFFont; display: PDFFont };

/** Embed the print fonts (full TTF subsets are embedded by pdf-lib/fontkit, so printers never substitute). */
export async function newDoc(title: string): Promise<{ doc: PDFDocument; fonts: Fonts }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(title);
  doc.setAuthor("GreetHub");
  doc.setProducer("GreetHub pipeline");
  const load = (f: string) => readFileSync(join(FONT_DIR, f));
  const fonts: Fonts = {
    body: await doc.embedFont(load("Andika-Regular.ttf"), { subset: true }),
    bold: await doc.embedFont(load("Andika-Bold.ttf"), { subset: true }),
    display: await doc.embedFont(load("Chewy-Regular.ttf"), { subset: true }),
  };
  return { doc, fonts };
}

export type PageGeom = {
  /** Page size including bleed, in points */
  w: number;
  h: number;
  bleed: number;
  /** Safe-zone inset from the trim edge */
  safe: number;
};

export const trimBox = (g: PageGeom) => ({ x: g.bleed, y: g.bleed, w: g.w - 2 * g.bleed, h: g.h - 2 * g.bleed });
/** Inset from the PAGE edge inside which all type must stay (bleed + safe). */
export const edge = (g: PageGeom) => g.bleed + g.safe;

export function addPage(doc: PDFDocument, g: PageGeom): PDFPage {
  const p = doc.addPage([g.w, g.h]);
  p.setBleedBox(0, 0, g.w, g.h);
  const t = trimBox(g);
  p.setTrimBox(t.x, t.y, t.w, t.h);
  return p;
}

/** Resample to exactly bleed-size pixels at 300 DPI (cover-crop), as JPEG q95 with density metadata. */
export async function artJpeg(src: Buffer, g: PageGeom): Promise<Buffer> {
  const pxW = Math.round((g.w / IN) * DPI);
  const pxH = Math.round((g.h / IN) * DPI);
  return sharp(src).resize(pxW, pxH, { fit: "cover", position: "centre" }).jpeg({ quality: 95 }).withMetadata({ density: DPI }).toBuffer();
}

export async function drawArt(doc: PDFDocument, page: PDFPage, src: Buffer, g: PageGeom) {
  const img = await doc.embedJpg(await artJpeg(src, g));
  page.drawImage(img, { x: 0, y: 0, width: g.w, height: g.h });
}

/* ---------------- text fitting ---------------- */

export function wrapLines(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxW || !line) line = test;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export type Fit = { size: number; leading: number; lines: string[]; height: number; fitted: boolean };

/** Largest font size (stepping down by 0.5pt) at which the wrapped text fits in maxH. Never below minSize. */
export function fitText(text: string, font: PDFFont, maxW: number, maxH: number, startSize: number, minSize: number, leadingRatio = 1.4): Fit {
  let size = startSize;
  for (;;) {
    const lines = wrapLines(text, font, size, maxW);
    const leading = size * leadingRatio;
    const height = lines.length * leading;
    if (height <= maxH) return { size, leading, lines, height, fitted: true };
    if (size <= minSize) return { size, leading, lines, height, fitted: false };
    size = Math.max(minSize, size - 0.5);
  }
}

export function drawLines(page: PDFPage, fit: Fit, font: PDFFont, x: number, topY: number, color: Color, align: "left" | "center" = "left", boxW = 0) {
  fit.lines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, fit.size);
    const lx = align === "center" ? x + (boxW - w) / 2 : x;
    page.drawText(line, { x: lx, y: topY - (i + 1) * fit.leading + (fit.leading - fit.size) * 0.5 + fit.size * 0.1, size: fit.size, font, color });
  });
}

export function roundedRectPath(w: number, h: number, r: number): string {
  return `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
}

/** Rounded panel whose TOP-LEFT is (x, topY) in PDF coordinates. */
export function panel(page: PDFPage, x: number, topY: number, w: number, h: number, r: number, color: Color, opacity = 1) {
  page.drawSvgPath(roundedRectPath(w, h, r), { x, y: topY, color, opacity, borderWidth: 0 });
}

export function star(page: PDFPage, cx: number, cy: number, r: number, color: Color) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (i * Math.PI) / 5;
    pts.push(`${(rr * Math.sin(a)).toFixed(2)} ${(-rr * Math.cos(a)).toFixed(2)}`);
  }
  page.drawSvgPath(`M${pts.join("L")}Z`, { x: cx, y: cy, color, borderWidth: 0 });
}

/** Title with a dark outline (stamped around the fill) in the display font, centred on cx. */
export function outlinedText(page: PDFPage, text: string, cx: number, y: number, font: PDFFont, size: number, fill: Color, outline: Color, width: number) {
  const w = font.widthOfTextAtSize(text, size);
  const x = cx - w / 2;
  for (let i = 0; i < 16; i++) {
    const a = (i * 2 * Math.PI) / 16;
    page.drawText(text, { x: x + Math.cos(a) * width, y: y + Math.sin(a) * width, size, font, color: outline });
  }
  page.drawText(text, { x, y, size, font, color: fill });
}

export const hex = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
