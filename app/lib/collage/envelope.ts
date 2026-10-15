import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont } from "pdf-lib";
import { hexToRgb, loadFace, nodeFontLoader, safeText, type FontLoader } from "./pdf";
import type { Rect } from "./types";

/**
 * Return-address envelope for the ship-to-me case: one A7 envelope face (5.25 x 7.25 in, landscape), no bleed (it is
 * printed on made-up envelopes), 0.25 in safe margin. Only the sender's address is printed, top left. The recipient
 * block, stamp corner and USPS barcode zone stay free of ink, and no vendor-printed recipient addressing happens in
 * Phase 1: the customer writes or labels each envelope. Zones from docs/design/photo-events-templates.md; still to
 * verify against USPS DMM 201/202 and the partner's template (QA R-23).
 */
export const ENVELOPE_A7 = { w: 7.25, h: 5.25, safe: 0.25 } as const;
/** No ink here: the stamp corner (top right) and the USPS barcode clear zone (bottom 5/8 in, right 4.75 in). */
export const STAMP_ZONE: Rect = { x: ENVELOPE_A7.w - 1.5, y: 0, w: 1.5, h: 1.25 };
export const BARCODE_ZONE: Rect = { x: ENVELOPE_A7.w - 4.75, y: ENVELOPE_A7.h - 0.625, w: 4.75, h: 0.625 };

export type ReturnAddress = {
  /** Name, street, then city/state/zip: 1 to 4 lines, 42 characters each at most. */
  lines: string[];
};
export type EnvelopeOptions = {
  /** Font key (brand face, "hw:<id>" handwriting for the return address is allowed). Default figtree. */
  font?: string;
  sizePt?: number;
  color?: string;
  /** USPS-style block: capitals. */
  uppercase?: boolean;
  loadFont?: FontLoader;
};
export type EnvelopePdfResult = {
  pdf: Uint8Array;
  pages: 1;
  pagePt: { w: number; h: number };
  /** The box the return address was set in, inches from the top-left. */
  addressBox: Rect;
  fontFallbacks: string[];
};

export class EnvelopeError extends Error {}

/** Return address box: top-left inside the safe margin, 3 in wide, clear of the stamp corner. */
const ADDRESS_BOX: Rect = { x: ENVELOPE_A7.safe, y: ENVELOPE_A7.safe, w: 3, h: 1.1 };

export function validateReturnAddress(a: ReturnAddress): string[] {
  const problems: string[] = [];
  const lines = a.lines.map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) problems.push("Add a name and a street address.");
  if (lines.length > 4) problems.push("Use four lines or fewer.");
  if (lines.some((l) => l.length > 42)) problems.push("Each line can be 42 characters at most.");
  return problems;
}

export async function renderEnvelopePdf(address: ReturnAddress, opts: EnvelopeOptions = {}): Promise<EnvelopePdfResult> {
  const problems = validateReturnAddress(address);
  if (problems.length) throw new EnvelopeError(problems.join(" "));
  const lines = address.lines.map((l) => l.trim()).filter(Boolean).map((l) => (opts.uppercase ? l.toUpperCase() : l));
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("GreetHub envelope");
  doc.setProducer("GreetHub");
  doc.setCreator("GreetHub");
  const pw = ENVELOPE_A7.w * 72, ph = ENVELOPE_A7.h * 72;
  const page = doc.addPage([pw, ph]);
  // No bleed: media, trim and bleed boxes are the same rectangle.
  page.setTrimBox(0, 0, pw, ph);
  page.setBleedBox(0, 0, pw, ph);
  const fallbacks = new Set<string>();
  const faces = new Map<string, PDFFont>();
  const key = opts.font ?? "figtree";
  const font = await loadFace(doc, key, 500, opts.loadFont ?? nodeFontLoader, fallbacks, faces);

  // Shrink from the requested size until every line fits the box width and the block fits its height.
  let size = opts.sizePt ?? 10;
  const lh = 1.25;
  const fits = (s: number) => lines.length * s * lh <= ADDRESS_BOX.h * 72 && lines.every((l) => font.widthOfTextAtSize(safeText(font, l), s) <= ADDRESS_BOX.w * 72);
  while (!fits(size) && size > 7) size -= 0.25;
  if (!fits(size)) throw new EnvelopeError("The return address is too long to print. Shorten a line.");
  const ink = hexToRgb(opts.color ?? "#2B1E18");
  lines.forEach((l, i) => {
    page.drawText(safeText(font, l), { x: ADDRESS_BOX.x * 72, y: ph - ADDRESS_BOX.y * 72 - size * 0.85 - i * size * lh, size, font, color: ink });
  });
  const pdf = await doc.save();
  return { pdf, pages: 1, pagePt: { w: pw, h: ph }, addressBox: ADDRESS_BOX, fontFallbacks: [...fallbacks] };
}
