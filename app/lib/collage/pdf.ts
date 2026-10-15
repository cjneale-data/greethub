import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { HANDWRITING_PRESETS, SIGNATURE_FONTS } from "@greethub/shared";
import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import { fitTemplate, paintOrder, rotatePoint, slotCenter } from "./geometry";
import { renderPage, slotText, type RenderInput } from "./render";
import { PRINT_DPI, pageInches } from "./sizes";
import type { PrintSize, TextSlot } from "./types";

/**
 * Print PDF for a flat card: one page per side (front, then back), page = trim plus 0.125 in bleed on every edge,
 * TrimBox and BleedBox set. Photos and art are composed at 300 DPI by `renderPage` (EXIF never carried over: the
 * raster is re-encoded without metadata). Text is set as vector text with the fonts embedded, auto-fitted from
 * `sizePt` down to `minPt` and never smaller; text that still overflows is reported, not shrunk.
 */

/** Returns the TTF bytes for a font key and weight, or undefined to use the fallback face. */
export type FontLoader = (font: string, weight: number) => Uint8Array | undefined;

const cache = new Map<string, Uint8Array>();
const readCached = (file: string): Uint8Array | undefined => {
  if (cache.has(file)) return cache.get(file);
  try {
    const b = fs.readFileSync(file);
    cache.set(file, b);
    return b;
  } catch {
    return undefined;
  }
};

/**
 * Default loader: the handwriting and signature faces from app/public/fonts/handwriting ("hw:<id>", "sig:<id>"), and
 * any .ttf dropped into app/public/fonts/brand as `<font>-<weight>.ttf` (e.g. figtree-700.ttf). Everything else is
 * undefined, so the PDF step uses its fallback. Bricolage Grotesque, Figtree and Cormorant TTFs are not in the repo yet.
 */
export const nodeFontLoader: FontLoader = (font, weight) => {
  const root = process.cwd();
  const [kind, id] = font.split(":");
  if (kind === "hw" || kind === "sig") {
    const file = [...HANDWRITING_PRESETS, ...SIGNATURE_FONTS].find((f) => f.id === id)?.file;
    return file ? readCached(path.join(root, "public", "fonts", "handwriting", file)) : undefined;
  }
  const dir = path.join(root, "public", "fonts", "brand");
  for (const w of [weight, 400, 700]) {
    const b = readCached(path.join(dir, `${font}-${w}.ttf`));
    if (b) return b;
  }
  return undefined;
};

/** Plain stand-in faces (Andika, already used by the book and card PDFs) when a brand face is missing. */
const fallbackFace = (weight: number): Uint8Array => {
  const dir = path.resolve(process.cwd(), "..", "pipeline", "fonts");
  const b = readCached(path.join(dir, weight >= 600 ? "Andika-Bold.ttf" : "Andika-Regular.ttf"));
  if (!b) throw new Error("No fallback font available (pipeline/fonts)");
  return b;
};

export type CardSideInput = Omit<RenderInput, "size">;
export type CardPdfInput = { size: PrintSize; front: CardSideInput; back?: CardSideInput };
export type TextFit = { side: "front" | "back"; slotId: string; sizePt: number; overflow: boolean; lines: number };
export type CardPdfResult = {
  pdf: Uint8Array;
  pages: number;
  /** Page size in points, including bleed. */
  pagePt: { w: number; h: number };
  textFit: TextFit[];
  /** Font keys that fell back to a stand-in face. */
  fontFallbacks: string[];
};

export const hexToRgb = (c: string) => {
  const h = c.replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return rgb(parseInt(f.slice(0, 2), 16) / 255, parseInt(f.slice(2, 4), 16) / 255, parseInt(f.slice(4, 6), 16) / 255);
};

/** Keep only characters the font can encode, so one odd character never fails an order. */
export function safeText(font: PDFFont, text: string): string {
  const set = new Set(font.getCharacterSet());
  return [...text].map((ch) => (set.has(ch.codePointAt(0)!) || ch === " " ? ch : "?")).join("");
}

export type WrapMeasure = (s: string, size: number) => number;

/** Greedy wrap by measured width. A single word wider than the line still takes a line (and overflows). */
export function wrapMeasured(text: string, maxW: number, size: number, measure: WrapMeasure): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    let cur = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && measure(next, size) > maxW) { lines.push(cur); cur = word; } else cur = next;
    }
    lines.push(cur);
  }
  return lines;
}

type Laid = { lines: string[]; size: number; overflow: boolean };

/** Largest size from `sizePt` down to `minPt` (0.25 pt steps) where the text fits the box. */
export function fitText(text: string, slot: TextSlot, measure: WrapMeasure, indentIn = 0): Laid {
  const maxW = (slot.w - indentIn) * 72, maxH = slot.h * 72;
  const lh = slot.lineHeight ?? 1.2;
  const min = Math.min(slot.minPt ?? slot.sizePt, slot.sizePt);
  let last: Laid = { lines: [], size: slot.sizePt, overflow: false };
  for (let size = slot.sizePt; ; size -= 0.25) {
    const sz = Math.max(min, size);
    const lines = wrapMeasured(text, maxW, sz, measure);
    const widest = Math.max(0, ...lines.map((l) => measure(l, sz)));
    const tooMany = slot.maxLines ? lines.length > slot.maxLines : false;
    const overflow = lines.length * sz * lh > maxH + 0.01 || widest > maxW + 0.01 || tooMany;
    last = { lines, size: sz, overflow };
    if (!overflow || sz <= min) return last;
  }
}

export async function loadFace(doc: PDFDocument, key: string, weight: number, load: FontLoader, fallbacks: Set<string>, faces: Map<string, PDFFont>) {
  const id = `${key}@${weight}`;
  const have = faces.get(id);
  if (have) return have;
  let bytes = load(key, weight);
  if (!bytes) { fallbacks.add(key); bytes = fallbackFace(weight); }
  const font = await doc.embedFont(bytes, { subset: true });
  faces.set(id, font);
  return font;
}

export async function renderCardPdf(input: CardPdfInput, opts: { loadFont?: FontLoader } = {}): Promise<CardPdfResult> {
  const { size } = input;
  const load = opts.loadFont ?? nodeFontLoader;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("GreetHub card");
  doc.setProducer("GreetHub");
  doc.setCreator("GreetHub");
  const inch = pageInches(size);
  const pw = inch.w * 72, ph = inch.h * 72, b = size.bleed * 72;
  const textFit: TextFit[] = [];
  const fallbacks = new Set<string>();
  const faces = new Map<string, PDFFont>();

  const sides: ["front" | "back", CardSideInput][] = [["front", input.front]];
  if (input.back) sides.push(["back", input.back]);

  for (const [side, data] of sides) {
    const page = doc.addPage([pw, ph]);
    page.setBleedBox(0, 0, pw, ph);
    page.setTrimBox(b, b, size.trim.w * 72, size.trim.h * 72);
    const raster = await renderPage({ ...data, size }, { text: "none", dpi: PRINT_DPI });
    // JPEG at 95 keeps the file small and carries no metadata.
    const jpeg = await sharp(raster.png).removeAlpha().jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toBuffer();
    const img = await doc.embedJpg(jpeg);
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });

    const template = fitTemplate(data.template, size);
    const carry = new Map<string, { lines: string[]; size: number }>();
    for (const slot of paintOrder(template.slots)) {
      if (slot.kind !== "text") continue;
      const own = carry.get(slot.id);
      const raw = slotText(slot, data.design);
      const weight = typeof slot.weight === "number" ? slot.weight : slot.weight === "bold" ? 700 : 400;
      const font = await loadFace(doc, slot.font, weight, load, fallbacks, faces);
      const track = (slot.letterSpacing ?? 0);
      const measureAt = (s: string, sz: number) => font.widthOfTextAtSize(safeText(font, s), sz) + track * sz * Math.max(0, s.length);
      const shown = (slot.uppercase ? raw.toUpperCase() : raw).trim();
      if (!own && !shown) continue;
      const indent = slot.checkbox ? 0.25 : 0;
      let laid: Laid;
      if (own) {
        laid = { lines: own.lines, size: own.size, overflow: own.lines.length * own.size * (slot.lineHeight ?? 1.2) > slot.h * 72 + 0.01 };
      } else if (slot.flowTo) {
        // Fill this box at full size (shrinking to minPt only if both boxes together would overflow), spill the rest.
        const target = template.slots.find((s) => s.id === slot.flowTo && s.kind === "text") as TextSlot | undefined;
        const lh = slot.lineHeight ?? 1.2;
        let sz = slot.sizePt;
        const min = slot.minPt ?? sz;
        let lines = wrapMeasured(shown, slot.w * 72, sz, measureAt);
        const capacity = (s: number) => Math.floor((slot.h * 72) / (s * lh)) + (target ? Math.floor((target.h * 72) / (s * lh)) : 0);
        while (lines.length > capacity(sz) && sz > min) { sz = Math.max(min, sz - 0.25); lines = wrapMeasured(shown, slot.w * 72, sz, measureAt); }
        const cap = Math.floor((slot.h * 72) / (sz * lh));
        laid = { lines: lines.slice(0, cap), size: sz, overflow: !target && lines.length > cap };
        if (target && lines.length > cap) carry.set(target.id, { lines: lines.slice(cap), size: sz });
      } else {
        laid = fitText(shown, slot, measureAt, indent);
      }
      textFit.push({ side, slotId: slot.id, sizePt: laid.size, overflow: laid.overflow, lines: laid.lines.length });
      drawSlotText(page, slot, laid, font, measureAt, size, ph, indent);
    }
  }
  const pdf = await doc.save();
  return { pdf, pages: sides.length, pagePt: { w: pw, h: ph }, textFit, fontFallbacks: [...fallbacks].sort() };
}

function drawSlotText(page: PDFPage, slot: TextSlot, laid: Laid, font: PDFFont, measure: WrapMeasure, size: PrintSize, pageH: number, indentIn: number) {
  const lh = slot.lineHeight ?? 1.2;
  const lineH = laid.size * lh;
  const blockH = laid.lines.length * lineH;
  const boxH = slot.h * 72;
  const top = slot.valign === "middle" ? (boxH - blockH) / 2 : slot.valign === "bottom" ? boxH - blockH : 0;
  const ink = hexToRgb(slot.color);
  const pivot = slot.pivot ?? slotCenter(slot);
  const angle = slot.rotate ?? 0;
  const bleed = size.bleed;
  // Point in trim inches (y down) to PDF points (y up, origin bottom-left of the bled page).
  const toPdf = (p: { x: number; y: number }) => {
    const q = angle ? rotatePoint(p, pivot, angle) : p;
    return { x: (q.x + bleed) * 72, y: pageH - (q.y + bleed) * 72 };
  };
  const rot = angle ? { rotate: degrees(-angle) } : {};

  if (slot.checkbox) {
    const box = 0.13, y0 = slot.y + (laid.size * 0.85) / 72 - box + top / 72;
    const corners = [[0, 0], [box, 0], [box, box], [0, box]].map(([dx, dy]) => toPdf({ x: slot.x + dx, y: y0 + dy }));
    for (let i = 0; i < 4; i++) {
      const a = corners[i], c = corners[(i + 1) % 4];
      page.drawLine({ start: a, end: c, thickness: 0.75, color: ink });
    }
  }
  laid.lines.forEach((line, i) => {
    const text = safeText(font, line);
    const w = measure(line, laid.size);
    const innerX = slot.x + indentIn, innerW = slot.w - indentIn;
    const align = slot.align ?? "left";
    const dx = align === "center" ? (innerW * 72 - w) / 2 : align === "right" ? innerW * 72 - w : 0;
    const baseY = slot.y + (top + i * lineH + laid.size * 0.85) / 72;
    const tracking = (slot.letterSpacing ?? 0) * laid.size;
    if (!tracking) {
      const p = toPdf({ x: innerX + dx / 72, y: baseY });
      page.drawText(text, { x: p.x, y: p.y, size: laid.size, font, color: ink, ...rot });
      return;
    }
    let x = innerX + dx / 72;
    for (const ch of [...text]) {
      const p = toPdf({ x, y: baseY });
      page.drawText(ch, { x: p.x, y: p.y, size: laid.size, font, color: ink, ...rot });
      x += (font.widthOfTextAtSize(ch, laid.size) + tracking) / 72;
    }
  });
}
