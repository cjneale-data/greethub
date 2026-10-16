import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { WATERMARK_PATH } from "./watermark-path";
import { addPage, drawArt, drawLines, edge, fitText, hex, IN, newDoc, type PageGeom } from "./common";

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
  /** Handwritten inside (app/lib/writing: resolveCardWriting supplies these, already ownership-checked). */
  writing?: CardWritingSpec;
};

export type CardWritingSpec = {
  /** Preset handwriting face (TTF) for the message, and its size correction against the body font. */
  messageFont?: Buffer;
  sizeScale?: number;
  /** The member's own handwriting: renders the message into a transparent PNG of exactly this pixel box (300 DPI). */
  renderMessage?: (text: string, box: { width: number; height: number }) => Promise<{ png: Buffer; fitted: boolean }>;
  /** Drawn or uploaded signature: transparent PNG. */
  signatureImage?: Buffer;
  /** Typed signature: the name set in a signature face (TTF). */
  signatureText?: { text: string; font: Buffer };
};

/** Signature area under the message: at most this wide and tall, centred. */
const SIG_MAX_W = 2.2 * IN;
const SIG_H = 0.7 * IN;

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
  const w = spec.writing;
  const hasSig = !!(w?.signatureImage || w?.signatureText);
  const sigBlock = hasSig ? SIG_H + 0.15 * IN : 0;
  const maxH = top - margin - 0.3 * IN - sigBlock;
  let messageSize: number;
  let messageFitted: boolean;
  let messageBottom: number;
  if (w?.renderMessage) {
    // Own handwriting: the renderer fits the text to the box and returns it as one transparent image.
    const box = { width: Math.round((boxW / IN) * 300), height: Math.round((maxH / IN) * 300) };
    const { png, fitted } = await w.renderMessage(spec.message, box);
    const img = await doc.embedPng(png);
    const yTop = spec.insideArt ? top : (g.h + maxH + sigBlock) / 2;
    inside.drawImage(img, { x: margin, y: yTop - maxH, width: boxW, height: maxH });
    const ink = await inkExtent(png);
    messageBottom = yTop - maxH + ((box.height - ink.bottom) / box.height) * maxH;
    messageSize = 0;
    messageFitted = fitted && ink.any;
  } else {
    const font = w?.messageFont ? await doc.embedFont(w.messageFont, { subset: true }) : fonts.body;
    const k = w?.messageFont ? (w.sizeScale ?? 1) : 1;
    const fit = fitText(spec.message, font, boxW, maxH, 22 * k * (w?.messageFont ? 1.25 : 1), 11 * k, w?.messageFont ? 1.35 : 1.5);
    const y0 = spec.insideArt ? top : (g.h + fit.height + sigBlock) / 2;
    drawLines(inside, fit, font, margin, y0, NAVY, "center", boxW);
    messageSize = fit.size;
    messageFitted = fit.fitted;
    messageBottom = y0 - fit.height;
  }
  if (w?.signatureImage) {
    const img = await doc.embedPng(await sharp(w.signatureImage).png().toBuffer());
    const s = Math.min(SIG_MAX_W / img.width, SIG_H / img.height);
    const sw = img.width * s, sh = img.height * s;
    inside.drawImage(img, { x: (g.w - sw) / 2, y: Math.max(margin, messageBottom - 0.15 * IN - sh), width: sw, height: sh });
  } else if (w?.signatureText) {
    const f = await doc.embedFont(w.signatureText.font, { subset: true });
    let size = 30;
    while (size > 14 && f.widthOfTextAtSize(w.signatureText.text, size) > SIG_MAX_W) size -= 1;
    const tw = f.widthOfTextAtSize(w.signatureText.text, size);
    inside.drawText(w.signatureText.text, { x: (g.w - tw) / 2, y: Math.max(margin, messageBottom - 0.15 * IN - size * 0.8), size, font: f, color: NAVY });
  }
  if (spec.signature) {
    const s = 8;
    inside.drawText(spec.signature, { x: g.w / 2 - fonts.body.widthOfTextAtSize(spec.signature, s) / 2, y: edge(g), size: s, font: fonts.body, color: hex("#A99888") });
  }

  const pdfPath = join(outDir, `${baseName}_print.pdf`);
  writeFileSync(pdfPath, await doc.save());
  const proofPath = join(outDir, `${baseName}_guest_proof.jpg`);
  writeFileSync(proofPath, await guestProof(spec.frontArt));
  return { files: { print: pdfPath, guestProof: proofPath }, messageSize, messageFitted, pages: doc.getPageCount() };
}

/** Lowest row with ink in a rendered message, so the signature sits under the words rather than under the empty box. */
async function inkExtent(png: Buffer): Promise<{ any: boolean; bottom: number }> {
  const { data, info } = await sharp(png).ensureAlpha().extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
  for (let y = info.height - 1; y >= 0; y--) {
    for (let x = 0; x < info.width; x++) if (data[y * info.width + x] > 40) return { any: true, bottom: y + 1 };
  }
  return { any: false, bottom: 0 };
}

/** Low-resolution watermarked proof for guests: 600 px wide JPEG with a repeating diagonal "GreetHub preview" mark. */
export async function guestProof(frontArt: Buffer): Promise<Buffer> {
  const w = 600;
  const h = 840;
  const marks = [];
  for (let y = 100; y < h; y += 170) {
    for (let x = -40; x < w; x += 280) {
      // A path, not <text>: servers without fonts (Vercel) draw text as empty boxes.
      marks.push(`<path d="${WATERMARK_PATH}" transform="translate(${x} ${y}) rotate(-28)" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>`);
    }
  }
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${marks.join("")}</svg>`);
  return sharp(frontArt).resize(w, h, { fit: "cover" }).composite([{ input: svg }]).jpeg({ quality: 60 }).toBuffer();
}
