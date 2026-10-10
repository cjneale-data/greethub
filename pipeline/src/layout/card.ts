import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { addPage, drawArt, drawLines, edge, fitText, hex, IN, newDoc, type PageGeom } from "./common.js";

/** 5 x 7 in folded card (flat panel). 0.125 in bleed, 0.375 in safe margin. Page size 5.25 x 7.25 in = 1575 x 2175 px at 300 DPI. */
export const CARD_TRIM_W = 5 * IN;
export const CARD_TRIM_H = 7 * IN;
export const CARD_BLEED = 0.125 * IN;
export const CARD_GEOM: PageGeom = { w: CARD_TRIM_W + 2 * CARD_BLEED, h: CARD_TRIM_H + 2 * CARD_BLEED, bleed: CARD_BLEED, safe: 0.375 * IN };
export const CARD_PX = { w: Math.round((CARD_GEOM.w / IN) * 300), h: Math.round((CARD_GEOM.h / IN) * 300) }; // 1575 x 2175

const NAVY = hex("#2B1E18");
const PAPER = hex("#FBF6EE");

export type CardSpec = {
  title: string;
  message: string;
  frontArt: Buffer;
  /** Small inside illustration; shown above the message when present. */
  insideArt?: Buffer;
  /** e.g. "Made with GreetHub" line on the back of the fold (kept tiny). */
  signature?: string;
};

export type CardLayoutReport = { files: Record<string, string>; messageSize: number; messageFitted: boolean; pages: number };

/** Print PDF: page 1 = front, page 2 = inside (message on cream paper). The outside back is printed blank/branded by the printer template. */
export async function layoutCard(spec: CardSpec, outDir: string, baseName = "card"): Promise<CardLayoutReport> {
  mkdirSync(outDir, { recursive: true });
  const g = CARD_GEOM;
  const { doc, fonts } = await newDoc(spec.title);

  const front = addPage(doc, g);
  await drawArt(doc, front, spec.frontArt, g);

  const inside = addPage(doc, g);
  inside.drawRectangle({ x: 0, y: 0, width: g.w, height: g.h, color: PAPER });
  const margin = edge(g) + 0.2 * IN;
  const boxW = g.w - 2 * margin;
  let top = g.h - margin;
  if (spec.insideArt) {
    const artW = boxW;
    const artH = artW * (4 / 3) * 0.62; // landscape-ish crop of the portrait render
    const px = await sharp(spec.insideArt).resize(Math.round((artW / IN) * 300), Math.round((artH / IN) * 300), { fit: "cover" }).jpeg({ quality: 95 }).withMetadata({ density: 300 }).toBuffer();
    const img = await doc.embedJpg(px);
    inside.drawImage(img, { x: margin, y: top - artH, width: artW, height: artH });
    top -= artH + 0.3 * IN;
  }
  const maxH = top - margin - 0.3 * IN;
  const fit = fitText(spec.message, fonts.body, boxW, maxH, 22, 11, 1.5);
  const y0 = spec.insideArt ? top : (g.h + fit.height) / 2;
  drawLines(inside, fit, fonts.body, margin, y0, NAVY, "center", boxW);
  if (spec.signature) {
    const s = 8;
    inside.drawText(spec.signature, { x: g.w / 2 - fonts.body.widthOfTextAtSize(spec.signature, s) / 2, y: edge(g), size: s, font: fonts.body, color: hex("#A99888") });
  }

  const pdfPath = join(outDir, `${baseName}_print.pdf`);
  writeFileSync(pdfPath, await doc.save());
  const proofPath = join(outDir, `${baseName}_guest_proof.jpg`);
  writeFileSync(proofPath, await guestProof(spec.frontArt));
  return { files: { print: pdfPath, guestProof: proofPath }, messageSize: fit.size, messageFitted: fit.fitted, pages: doc.getPageCount() };
}

/** Low-resolution watermarked proof for guests: 600 px wide JPEG with a repeating diagonal "GreetHub preview" mark. */
export async function guestProof(frontArt: Buffer): Promise<Buffer> {
  const w = 600;
  const h = 840;
  const marks = [];
  for (let y = 100; y < h; y += 170) {
    for (let x = -40; x < w; x += 280) {
      marks.push(`<text x="${x}" y="${y}" transform="rotate(-28 ${x} ${y})" font-family="sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" stroke-width="1">GreetHub preview</text>`);
    }
  }
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${marks.join("")}</svg>`);
  return sharp(frontArt).resize(w, h, { fit: "cover" }).composite([{ input: svg }]).jpeg({ quality: 60 }).toBuffer();
}
