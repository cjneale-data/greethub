import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { HANDWRITING_PRESETS, type CardWriting } from "@greethub/shared";
import { CARD_GEOM, CARD_PX, layoutCard, type CardWritingSpec } from "../../../pipeline/src/layout/card";
import { edge, fitText, IN } from "../../../pipeline/src/layout/common";
import { WATERMARK_PATH, WATERMARK_WIDTH } from "../../../pipeline/src/layout/watermark-path";
import { isValidGuestId } from "../shop/session";
import { resolveCardWriting, writingOrderBlock } from "../writing/service";
import { getCard } from "./catalog";
import { stockFrontArt } from "./render-art";
import { handwritingFontPath, loadMeasureFont, measureFontFromBuffer, pipelineFontPath, textPaths } from "./render-text";
import type { StockCard, StockCreation } from "./types";

/*
 * Stock card renderer (build step 3, mock mode). Print PDF goes through the pipeline's layoutCard (page 1 front, page 2
 * inside, 5.25 x 7.25 in with 0.125 in bleed and 0.375 in safe margin). The PNG preview is drawn here from the same
 * geometry with glyph outlines (no system fonts needed). Customer text is never logged.
 */

const INK = "#2B1E18";
const PAPER = "#FBF6EE";
// Mirrors layoutCard's inside box (pipeline/src/layout/card.ts). A test pins the capacity numbers so drift shows up.
const MARGIN = edge(CARD_GEOM) + 0.2 * IN;
const BOX_W = CARD_GEOM.w - 2 * MARGIN;
const SIG_H = 0.7 * IN;
const SIG_MAX_W = 2.2 * IN;
const boxHeight = (hasSig: boolean) => CARD_GEOM.h - MARGIN - MARGIN - 0.3 * IN - (hasSig ? SIG_H + 0.15 * IN : 0);

type Resolved = { spec: CardWritingSpec | undefined; message: string };

/** The message as printed: the typed sign-off joins as a last paragraph. */
const fullMessage = (c: StockCreation) => (c.signOff?.trim() ? `${c.message.trim()}\n\n${c.signOff.trim()}` : c.message.trim());

/**
 * Member handwriting and signature, only when this user may print it. Guests and anyone blocked by writingOrderBlock
 * (own handwriting and saved signatures need Plus) get the typeset inside instead. An unowned style or signature still
 * throws (resolveCardWriting 404), so a forged id never renders.
 */
async function resolveWriting(c: StockCreation): Promise<CardWritingSpec | undefined> {
  const w: CardWriting | undefined = c.writing;
  if (!w) return undefined;
  if (isValidGuestId(c.userId)) return undefined; // guests: typeset only (docs/cx/stock-cards-ux.md)
  if (await writingOrderBlock(c.userId, w)) return undefined;
  return (await resolveCardWriting(c.userId, w)) as CardWritingSpec;
}

async function resolve(c: StockCreation): Promise<{ card: StockCard; r: Resolved }> {
  const card = getCard(c.stockId);
  if (!card) throw new Error("unknown_stock_card");
  return { card, r: { spec: await resolveWriting(c), message: fullMessage(c) } };
}

/* ------------------------------ print PDF ------------------------------ */

/** Print PDF: page 1 front art, page 2 inside. `overflow` is layoutCard's answer: true means the words did not fit (never clipped silently). */
export async function renderStockPdf(creation: StockCreation): Promise<{ pdf: Uint8Array; overflow: boolean }> {
  const { card, r } = await resolve(creation);
  const dir = mkdtempSync(path.join(os.tmpdir(), "gh-stock-pdf-"));
  try {
    const rep = await layoutCard({ title: card.title, message: r.message, frontArt: await stockFrontArt(card), writing: r.spec }, dir, "stock");
    return { pdf: new Uint8Array(readFileSync(rep.files.print)), overflow: !rep.messageFitted };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ------------------------------ preview PNG ------------------------------ */

const PREVIEW_SCALE = (0.4 * 300) / IN; // px per pt: each panel 630 x 870
const PW = Math.round(CARD_PX.w * 0.4);
const PH = Math.round(CARD_PX.h * 0.4);
const GAP = 30;

async function insidePanel(r: Resolved): Promise<Buffer> {
  const k = PREVIEW_SCALE;
  const w = r.spec;
  const hasSig = !!(w?.signatureImage || w?.signatureText);
  const maxH = boxHeight(hasSig);
  const sigBlock = hasSig ? SIG_H + 0.15 * IN : 0;
  const parts: string[] = [];
  const overlays: OverlayOptions[] = [];
  let messageBottomPt: number; // distance from the page top, in points
  if (w?.renderMessage) {
    const box = { width: Math.round((BOX_W / IN) * 300), height: Math.round((maxH / IN) * 300) };
    const { png } = await w.renderMessage(r.message, box);
    const yTop = (CARD_GEOM.h + maxH + sigBlock) / 2;
    overlays.push({ input: await sharp(png).resize(Math.round(BOX_W * k), Math.round(maxH * k)).png().toBuffer(), left: Math.round(MARGIN * k), top: Math.round((CARD_GEOM.h - yTop) * k) });
    messageBottomPt = CARD_GEOM.h - yTop + maxH;
  } else {
    const hand = !!w?.messageFont;
    const mf = hand ? measureFontFromBuffer(w!.messageFont!) : loadMeasureFont("Andika-Regular.ttf", pipelineFontPath);
    const kk = hand ? (w!.sizeScale ?? 1) : 1;
    const fit = fitText(r.message, mf.asPdfFont, BOX_W, maxH, 22 * kk * (hand ? 1.25 : 1), 11 * kk, hand ? 1.35 : 1.5);
    const y0 = (CARD_GEOM.h + fit.height + sigBlock) / 2; // from the bottom, as in layoutCard
    fit.lines.forEach((line, i) => {
      const lw = mf.widthOfTextAtSize(line, fit.size);
      const base = y0 - (i + 1) * fit.leading + (fit.leading - fit.size) * 0.5 + fit.size * 0.1;
      parts.push(textPaths(mf, line, (MARGIN + (BOX_W - lw) / 2) * k, (CARD_GEOM.h - base) * k, fit.size * k, INK));
    });
    messageBottomPt = CARD_GEOM.h - (y0 - fit.height);
  }
  const sigTop = messageBottomPt + 0.15 * IN;
  if (w?.signatureImage) {
    const meta = await sharp(w.signatureImage).metadata();
    const s = Math.min(SIG_MAX_W / meta.width!, SIG_H / meta.height!);
    const sw = Math.max(1, Math.round(meta.width! * s * k));
    const sh = Math.max(1, Math.round(meta.height! * s * k));
    overlays.push({ input: await sharp(w.signatureImage).resize(sw, sh).png().toBuffer(), left: Math.round((PW - sw) / 2), top: Math.min(Math.round(sigTop * k), PH - Math.round(MARGIN * k) - sh) });
  } else if (w?.signatureText) {
    const sf = measureFontFromBuffer(w.signatureText.font);
    let size = 30;
    while (size > 14 && sf.widthOfTextAtSize(w.signatureText.text, size) > SIG_MAX_W) size -= 1;
    const tw = sf.widthOfTextAtSize(w.signatureText.text, size);
    parts.push(textPaths(sf, w.signatureText.text, ((CARD_GEOM.w - tw) / 2) * k, (sigTop + size * 0.8) * k, size * k, INK));
  }
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" fill="${PAPER}"/>${parts.join("")}</svg>`);
  return sharp(svg).composite(overlays).png().toBuffer();
}

function watermarkSvg(w: number, h: number): Buffer {
  const marks: string[] = [];
  const s = 0.9;
  for (let y = 90; y < h; y += 150) {
    for (let x = -30; x < w; x += WATERMARK_WIDTH * s + 40) marks.push(`<path d="${WATERMARK_PATH}" transform="translate(${x} ${y}) rotate(-28) scale(${s})" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>`);
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${marks.join("")}</svg>`);
}

/** Front and inside side by side (1350 x 930 PNG). Watermarked unless `watermark: false` (set it for signed-in members only). */
export async function renderStockPreview(creation: StockCreation, opts: { watermark?: boolean } = {}): Promise<Uint8Array> {
  const { card, r } = await resolve(creation);
  const front = await sharp(await stockFrontArt(card)).resize(PW, PH, { fit: "cover" }).png().toBuffer();
  const inside = await insidePanel(r);
  const W = PW * 2 + GAP * 3;
  const H = PH + GAP * 2;
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${GAP + 4}" y="${GAP + 6}" width="${PW}" height="${PH}" fill="rgba(43,30,24,0.15)"/><rect x="${GAP * 2 + PW + 4}" y="${GAP + 6}" width="${PW}" height="${PH}" fill="rgba(43,30,24,0.15)"/></svg>`);
  const layers: OverlayOptions[] = [
    { input: shadow },
    { input: front, left: GAP, top: GAP },
    { input: inside, left: GAP * 2 + PW, top: GAP },
  ];
  if (opts.watermark !== false) layers.push({ input: watermarkSvg(PW, PH), left: GAP, top: GAP }, { input: watermarkSvg(PW, PH), left: GAP * 2 + PW, top: GAP });
  return new Uint8Array(await sharp({ create: { width: W, height: H, channels: 3, background: "#EFE7DB" } }).composite(layers).png().toBuffer());
}

/* ------------------------------ capacity ------------------------------ */

const SAMPLE = "Thank you for being such a good friend to us all this year. We hope the day is full of cake and laughter and that you take a long, slow breath and enjoy it. Wishing you every happiness in the months ahead, with love from all of us here at home. ";
const text = (n: number) => SAMPLE.repeat(Math.ceil(n / SAMPLE.length)).slice(0, n).trim();

/** Characters that fit between `start` and `min` point size on the real font: grow typical English until fitText overflows. */
function measure(font: ReturnType<typeof loadMeasureFont>, start: number, min: number, lead: number, maxH: number) {
  const fit = (n: number) => fitText(text(n), font.asPdfFont, BOX_W, maxH, start, min, lead);
  let lo = 1;
  let hi = 2500;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fit(mid).fitted) lo = mid;
    else hi = mid - 1;
  }
  return { maxChars: lo, maxLines: fit(lo).lines.length };
}

/**
 * How much fits on the inside of a 5x7 card, measured with the real fonts through the same fitText layoutCard uses
 * (Andika for typeset; the eight preset handwriting faces, lowest wins). Typical English; text shrinks from 22pt to a
 * floor of 11pt (times the preset's size scale). With handwriting a signature block is reserved. These are HARD limits:
 * a message at the limit prints, but small. Measured 2026-10-16: typeset hard 1261 chars / 24 lines; 560 chars stay at 16pt
 * or larger, 434 at 18pt or larger, 305 at the full 22pt. Handwriting (signature reserved, lowest preset) hard 1059 chars /
 * 19 lines; Kalam stays at its 16pt-equivalent up to 510 chars and at full size up to 175. Numbers measured 2026-10-16 are in the final report and pinned by
 * tests/stock/render.test.ts; the OWNER picks the message limit (110 design JSON, 180 CX, about 420 CTO), this does not.
 * Own uploaded handwriting is rendered by lib/writing and is not covered: renderStockPdf reports its fit as `overflow`.
 */
export function stockInsideCapacity(opts: { handwriting: boolean }): { maxChars: number; maxLines: number } {
  const hit = capacityCache.get(opts.handwriting);
  if (hit) return hit;
  const v = capacity(opts);
  capacityCache.set(opts.handwriting, v);
  return v;
}
const capacityCache = new Map<boolean, { maxChars: number; maxLines: number }>();
function capacity(opts: { handwriting: boolean }): { maxChars: number; maxLines: number } {
  if (!opts.handwriting) return measure(loadMeasureFont("Andika-Regular.ttf", pipelineFontPath), 22, 11, 1.5, boxHeight(false));
  const per = HANDWRITING_PRESETS.map((p) => measure(loadMeasureFont(p.file, handwritingFontPath), 22 * p.sizeScale * 1.25, 11 * p.sizeScale, 1.35, boxHeight(true)));
  return { maxChars: Math.min(...per.map((p) => p.maxChars)), maxLines: Math.min(...per.map((p) => p.maxLines)) };
}
