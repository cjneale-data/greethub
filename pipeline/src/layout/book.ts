import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PDFDocument } from "pdf-lib";
import { rgb } from "pdf-lib";
import { addPage, drawArt, drawLines, edge, fitText, hex, IN, newDoc, outlinedText, panel, star, type Fonts, type PageGeom } from "./common.js";

/** 8.5 x 8.5 in trim + 0.125 in bleed on every side = 8.75 in square (630 pt, 2625 px at 300 DPI). Lulu hardcover. */
export const BOOK_TRIM = 8.5 * IN;
export const BOOK_BLEED = 0.125 * IN;
export const BOOK_GEOM: PageGeom = { w: BOOK_TRIM + 2 * BOOK_BLEED, h: BOOK_TRIM + 2 * BOOK_BLEED, bleed: BOOK_BLEED, safe: 0.5 * IN };
export const BOOK_PX = Math.round((BOOK_GEOM.w / IN) * 300); // 2625

const NAVY = hex("#1d2a4a");
const CREAM_PAPER = hex("#fbf5e6");
const GOLD = hex("#e8b730");
const NIGHT = hex("#16213d");
const YELLOW = hex("#ffd95a");

export type BookSpec = {
  title: string;
  blurb: string;
  /** Story pages in order: printed text + the rendered art (PNG/JPEG bytes) for the right-hand page. */
  spreads: { text: string; art: Buffer }[];
  coverArt: Buffer;
  /** Optional; a plain cream back cover is used when absent. */
  backArt?: Buffer;
};

export type BookLayoutReport = {
  pageCount: number;
  textSizes: number[];
  unfitted: number[];
  files: Record<string, string>;
};

/** Left (even) page: cream paper, type centred in the safe area, auto-shrunk to fit. Returns the size used. */
function textPage(doc: PDFDocument, fonts: Fonts, text: string, folio: number): { size: number; fitted: boolean } {
  const g = BOOK_GEOM;
  const page = addPage(doc, g);
  page.drawRectangle({ x: 0, y: 0, width: g.w, height: g.h, color: CREAM_PAPER });
  const w = g.w - 2 * edge(g) - 0.4 * IN;
  const maxH = g.h - 2 * edge(g) - 1.4 * IN;
  const fit = fitText(text, fonts.body, w, maxH, 24, 12, 1.45);
  const top = (g.h + fit.height) / 2;
  drawLines(page, fit, fonts.body, (g.w - w) / 2, top, NAVY);
  for (const [dx, r] of [[-0.35, 4], [0, 6.5], [0.35, 4]] as const) {
    star(page, g.w / 2 + dx * IN, top + 0.45 * IN, r, GOLD);
    star(page, g.w / 2 + dx * IN, top - fit.height - 0.45 * IN, r, GOLD);
  }
  const f = String(folio);
  page.drawText(f, { x: g.w / 2 - fonts.body.widthOfTextAtSize(f, 11) / 2, y: edge(g) - 0.15 * IN, size: 11, font: fonts.body, color: NAVY });
  return { size: fit.size, fitted: fit.fitted };
}

async function artPage(doc: PDFDocument, art: Buffer) {
  const page = addPage(doc, BOOK_GEOM);
  await drawArt(doc, page, art, BOOK_GEOM);
}

function plainPage(doc: PDFDocument, fonts: Fonts, title: string) {
  const g = BOOK_GEOM;
  const page = addPage(doc, g);
  page.drawRectangle({ x: 0, y: 0, width: g.w, height: g.h, color: NIGHT });
  for (const [x, y, r] of [[1.4, 7.3, 2.2], [2.6, 6.6, 1.4], [6.9, 7.4, 1.8], [7.4, 6.2, 1.2], [1.7, 2.1, 1.5], [6.6, 1.6, 2], [4.1, 7.6, 1.1], [5.5, 2.3, 1.3], [3, 1.4, 1]] as const) {
    page.drawCircle({ x: x * IN, y: y * IN, size: r, color: YELLOW });
  }
  // shrink long titles so they stay inside the safe area
  let size = 80;
  const maxW = g.w - 2 * edge(g);
  while (fonts.display.widthOfTextAtSize(title, size) > maxW && size > 24) size -= 2;
  outlinedText(page, title, g.w / 2, g.h / 2 - size * 0.3, fonts.display, size, YELLOW, NAVY, 3.5);
}

async function frontCover(doc: PDFDocument, fonts: Fonts, title: string, art: Buffer) {
  const g = BOOK_GEOM;
  const page = addPage(doc, g);
  await drawArt(doc, page, art, g);
  // soft dark wash behind the title so it reads over the art
  for (let i = 0; i < 24; i++) {
    page.drawRectangle({ x: 0, y: g.h - 2.9 * IN + i * 0.1 * IN, width: g.w, height: 2.9 * IN, color: rgb(0.07, 0.1, 0.22), opacity: 0.03 });
  }
  const maxW = g.w - 2 * edge(g);
  let size = 92;
  while (fonts.display.widthOfTextAtSize(title, size) > maxW && size > 30) size -= 2;
  outlinedText(page, title, g.w / 2, g.h - edge(g) - size * 0.95, fonts.display, size, YELLOW, NAVY, 4.5);
}

async function backCover(doc: PDFDocument, fonts: Fonts, blurb: string, art?: Buffer) {
  const g = BOOK_GEOM;
  const page = addPage(doc, g);
  if (art) await drawArt(doc, page, art, g);
  else page.drawRectangle({ x: 0, y: 0, width: g.w, height: g.h, color: CREAM_PAPER });
  const boxW = 5.6 * IN;
  const pad = 0.3 * IN;
  const fit = fitText(blurb, fonts.body, boxW - 2 * pad, 5 * IN, 19, 11, 1.42);
  const x = (g.w - boxW) / 2;
  const top = g.h - edge(g) - 0.35 * IN;
  panel(page, x, top, boxW, fit.height + 2 * pad, 0.2 * IN, hex("#fffaed"), 0.9);
  drawLines(page, fit, fonts.body, x + pad, top - pad, NAVY, "center", boxW - 2 * pad);
}

/** Build all print files: interior (title + N text/art spreads + The End), front/back covers, and a reading-order preview.
 *  Interior page count = 2 + 2 * spreads; Lulu hardcover needs 24..800 pages, so 11 spreads = 24 and 15 = 32.
 *  TODO(M6): the Lulu cover wrap (back + spine + front) is assembled from these using Lulu's cover-dimensions API. */
export async function layoutBook(spec: BookSpec, outDir: string, baseName = "book"): Promise<BookLayoutReport> {
  mkdirSync(outDir, { recursive: true });
  const files: Record<string, string> = {};
  const textSizes: number[] = [];
  const unfitted: number[] = [];
  let measuring = true; // record text sizes on the first (interior) build only

  const interior = async (doc: PDFDocument, fonts: Fonts) => {
    plainPage(doc, fonts, spec.title);
    for (let n = 0; n < spec.spreads.length; n++) {
      const folio = 2 + 2 * n;
      const r = textPage(doc, fonts, spec.spreads[n].text, folio);
      if (measuring) {
        textSizes[n] = r.size;
        if (!r.fitted) unfitted.push(folio);
      }
      await artPage(doc, spec.spreads[n].art);
    }
    plainPage(doc, fonts, "The End");
  };

  const save = async (name: string, build: (d: PDFDocument, f: Fonts) => Promise<void>) => {
    const { doc, fonts } = await newDoc(spec.title);
    await build(doc, fonts);
    const path = join(outDir, `${baseName}_${name}.pdf`);
    writeFileSync(path, await doc.save());
    files[name] = path;
    return doc.getPageCount();
  };

  const pageCount = await save("interior", interior);
  measuring = false;
  await save("front_cover", (d, f) => frontCover(d, f, spec.title, spec.coverArt));
  await save("back_cover", (d, f) => backCover(d, f, spec.blurb, spec.backArt));
  await save("preview", async (d, f) => {
    await frontCover(d, f, spec.title, spec.coverArt);
    await interior(d, f);
    await backCover(d, f, spec.blurb, spec.backArt);
  });
  return { pageCount, textSizes, unfitted, files };
}
