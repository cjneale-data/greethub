import sharp, { type OverlayOptions } from "sharp";
import { fitTemplate, paintOrder, paintRect, rotatePoint, slotCenter, toPagePixels } from "./geometry";
import { MAX_INPUT_PIXELS, cropRect } from "./place";
import { PRINT_DPI, pagePixels, safeRect } from "./sizes";
import type { ArtSlot, Design, PhotoSlot, PrintSize, Slot, Template, TextSlot } from "./types";

/**
 * Compose one side of a flat card as a full-bleed PNG (trim + 0.125 in each side) at 300 DPI by default.
 * The pipeline's layout module wraps this in the print PDF.
 *
 * Text modes:
 *  - "svg"   draws text with librsvg. librsvg only sees fonts installed on the machine (fontconfig); the brand TTFs
 *            and handwriting faces are NOT registered with it, so the family list falls back to system serif/sans.
 *            Good for previews; not trusted for print.
 *  - "boxes" draws a labelled tint box per text slot (layout checks, tests, machines without fonts).
 *  - "none"  leaves text out, so the PDF step can set it as vector text with embedded fonts (recommended for print).
 */
export type TextMode = "svg" | "boxes" | "none";

export type RenderInput = {
  template: Template;
  size: PrintSize;
  design: Pick<Design, "photos" | "text">;
  /** Photo id to the original bytes. Never logged or written anywhere by this module. */
  photos: Record<string, Uint8Array>;
  /** Art asset key to bytes (backgrounds, frames). Missing assets fall back to the slot fill. */
  art?: Record<string, Uint8Array>;
};

export type RenderOptions = {
  dpi?: number;
  text?: TextMode;
  /** Font key to a CSS font-family list for "svg" mode. */
  fontFamilies?: Record<string, string>;
  /** Draw trim (red) and safe area (blue) lines. Previews only, never print. */
  guides?: boolean;
};

export type RenderResult = { png: Buffer; width: number; height: number; dpi: number };

const DEFAULT_FAMILIES: Record<string, string> = {
  display: "Georgia, 'Times New Roman', serif",
  body: "Helvetica, Arial, sans-serif",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function renderPage(input: RenderInput, opts: RenderOptions = {}): Promise<RenderResult> {
  const dpi = opts.dpi ?? PRINT_DPI;
  const { size } = input;
  const template = fitTemplate(input.template, size);
  const page = pagePixels(size, dpi);
  const layers: OverlayOptions[] = [];

  for (const slot of paintOrder(template.slots)) {
    if (slot.kind === "art" && slot.keepClear) continue; // postage and barcode zones never get ink
    const box = toPagePixels(paintRect(slot, size), size, dpi);
    let layer: { input: Buffer; left: number; top: number } | null = null;
    if (slot.kind === "photo") layer = await photoLayer(slot, input, box);
    else if (slot.kind === "art") layer = await artLayer(slot, input, box, dpi);
    else if (opts.text !== "none") layer = textLayer(slot, slotText(slot, input.design), box, dpi, opts);
    if (!layer) continue;
    if (slot.rotate) {
      const rotated = await rotateLayer(layer, box, slot, size, dpi);
      layer = rotated;
      const clippedRot = await clip(layer, { left: layer.left, top: layer.top, width: rotated.width, height: rotated.height }, page);
      if (clippedRot) layers.push(clippedRot);
      continue;
    }
    const clipped = await clip(layer, box, page);
    if (clipped) layers.push(clipped);
  }
  if (opts.guides) layers.push({ input: guidesSvg(size, page, dpi), left: 0, top: 0 });

  const png = await sharp({ create: { width: page.width, height: page.height, channels: 3, background: input.template.background } })
    .composite(layers)
    .withDensity(dpi)
    .png({ compressionLevel: 6 })
    .toBuffer();
  return { png, width: page.width, height: page.height, dpi };
}

type Box = { left: number; top: number; width: number; height: number };

/** The words for a text slot: its own id, then the shared `bind` key, then the placeholder. */
export function slotText(slot: TextSlot, design: Pick<Design, "text">): string {
  return design.text[slot.id] ?? (slot.bind ? design.text[slot.bind] : undefined) ?? slot.placeholder ?? "";
}

/** Turn a painted layer clockwise about the slot's pivot (trim inches; default its centre), as one piece. */
async function rotateLayer(layer: { input: Buffer; left: number; top: number }, box: Box, slot: Slot, size: PrintSize, dpi: number) {
  const pivot = slot.pivot ?? slotCenter(slot);
  const c = rotatePoint(slotCenter(slot), pivot, slot.rotate ?? 0);
  const out = await sharp(layer.input).rotate(slot.rotate ?? 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
  const cx = (c.x + size.bleed) * dpi, cy = (c.y + size.bleed) * dpi;
  return { input: out.data, left: Math.round(cx - out.info.width / 2), top: Math.round(cy - out.info.height / 2), width: out.info.width, height: out.info.height };
}

async function photoLayer(slot: PhotoSlot, input: RenderInput, box: Box) {
  const placed = input.design.photos.find((p) => p.slotId === slot.id);
  const bytes = placed && input.photos[placed.photoId];
  if (!placed || !bytes) {
    // Empty slot: a soft neutral tile so the layout still reads in previews.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><rect width="100%" height="100%" fill="#E8DFD4"/></svg>`;
    return { input: await sharp(Buffer.from(svg)).png().toBuffer(), left: box.left, top: box.top };
  }
  const oriented = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS }).rotate().toBuffer({ resolveWithObject: true });
  const r = cropRect(oriented.info.width, oriented.info.height, box.width / box.height, placed.crop);
  let img = await sharp(oriented.data).extract(r).resize(box.width, box.height, { fit: "fill", kernel: "lanczos3" }).png().toBuffer();
  if (slot.radius || slot.mask) {
    const rad = Math.round((slot.radius ?? 0) * (box.width / slot.w));
    const shape = slot.mask === "circle"
      ? `<ellipse cx="${box.width / 2}" cy="${box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" fill="#fff"/>`
      : `<rect width="100%" height="100%" rx="${rad}" ry="${rad}" fill="#fff"/>`;
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}">${shape}</svg>`;
    img = await sharp(img).ensureAlpha().composite([{ input: Buffer.from(mask), blend: "dest-in" }]).png().toBuffer();
  }
  return { input: img, left: box.left, top: box.top };
}

async function artLayer(slot: ArtSlot, input: RenderInput, box: Box, dpi: number) {
  const key = slot.asset ?? slot.role;
  const bytes = key ? input.art?.[key] : undefined;
  const opacity = slot.opacity ?? 1;
  if (bytes) {
    let img = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS }).rotate().resize(box.width, box.height, { fit: "cover" }).ensureAlpha();
    if (opacity < 1) img = img.composite([{ input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: "dest-in" }]);
    return { input: await img.png().toBuffer(), left: box.left, top: box.top };
  }
  const { width: w, height: h } = box;
  let body = "";
  if (slot.gradient) {
    const top = slot.gradient === "bottom-up" ? 0 : 1, bottom = 1 - top;
    const c = slot.fill ?? "#2B1E18";
    body += `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="${(top * (slot.maxOpacity ?? 0.65)).toFixed(3)}"/><stop offset="1" stop-color="${c}" stop-opacity="${(bottom * (slot.maxOpacity ?? 0.65)).toFixed(3)}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`;
  } else if (slot.fill) {
    body += `<rect width="100%" height="100%" fill="${slot.fill}" fill-opacity="${opacity}"/>`;
  }
  if (slot.stroke) {
    const sw = Math.max(1, Math.round(0.02 * dpi));
    body += slot.role === "writein_rule"
      ? `<line x1="0" y1="${h - sw}" x2="${w}" y2="${h - sw}" stroke="${slot.stroke}" stroke-width="${sw / 2}"/>`
      : `<rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" fill="none" stroke="${slot.stroke}" stroke-width="${sw}"/>`;
  }
  if (!body) return null;
  return { input: await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)).png().toBuffer(), left: box.left, top: box.top };
}

/** Greedy wrap by an average glyph width (0.52 em); real metrics come from the PDF step. */
export function wrapText(text: string, maxWidthPx: number, fontPx: number, maxLines?: number): string[] {
  const perLine = Math.max(1, Math.floor(maxWidthPx / (fontPx * 0.52)));
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    let cur = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = cur ? `${cur} ${word}` : word;
      if (next.length > perLine && cur) { lines.push(cur); cur = word; } else cur = next;
    }
    lines.push(cur);
  }
  if (maxLines && lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S{0,3}$/, "") + "…";
    return kept;
  }
  return lines;
}

function textLayer(slot: TextSlot, text: string, box: Box, dpi: number, opts: RenderOptions) {
  const { width: w, height: h } = box;
  if (opts.text === "boxes") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="${slot.color}" fill-opacity="0.12" stroke="${slot.color}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="8 6"/></svg>`;
    return { input: Buffer.from(svg), left: box.left, top: box.top };
  }
  if (!text.trim()) return null;
  const fontPx = (slot.sizePt / 72) * dpi;
  const shown = slot.uppercase ? text.toUpperCase() : text;
  const lines = wrapText(shown, w, fontPx, slot.maxLines);
  const lineH = fontPx * 1.2;
  const blockH = lines.length * lineH;
  const valign = slot.valign ?? "top";
  const top = valign === "middle" ? (h - blockH) / 2 : valign === "bottom" ? h - blockH : 0;
  const align = slot.align ?? "left";
  const x = align === "center" ? w / 2 : align === "right" ? w : 0;
  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const family = (opts.fontFamilies ?? DEFAULT_FAMILIES)[slot.font] ?? DEFAULT_FAMILIES.body;
  const tspans = lines.map((l, i) => `<tspan x="${x.toFixed(1)}" y="${(top + i * lineH + fontPx * 0.9).toFixed(1)}">${esc(l)}</tspan>`).join("");
  const spacing = slot.letterSpacing ? ` letter-spacing="${slot.letterSpacing * fontPx}"` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text font-family="${esc(family)}" font-size="${fontPx.toFixed(1)}" font-weight="${slot.weight ?? "normal"}" fill="${slot.color}" text-anchor="${anchor}"${spacing}>${tspans}</text></svg>`;
  return { input: Buffer.from(svg), left: box.left, top: box.top };
}

/** Cut a layer to the page; sharp refuses overlays that fall outside the base image. */
async function clip(layer: { input: Buffer; left: number; top: number }, box: Box, page: { width: number; height: number }): Promise<OverlayOptions | null> {
  box = { ...box, left: layer.left, top: layer.top };
  const x0 = Math.max(0, box.left), y0 = Math.max(0, box.top);
  const x1 = Math.min(page.width, box.left + box.width), y1 = Math.min(page.height, box.top + box.height);
  if (x1 <= x0 || y1 <= y0) return null;
  if (x0 === box.left && y0 === box.top && x1 === box.left + box.width && y1 === box.top + box.height) return layer;
  const input = await sharp(layer.input).extract({ left: x0 - box.left, top: y0 - box.top, width: x1 - x0, height: y1 - y0 }).png().toBuffer();
  return { input, left: x0, top: y0 };
}

function guidesSvg(size: PrintSize, page: { width: number; height: number }, dpi: number): Buffer {
  const b = size.bleed * dpi;
  const s = safeRect(size);
  const rect = (x: number, y: number, w: number, h: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="2"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}">` +
      rect(b, b, size.trim.w * dpi, size.trim.h * dpi, "#E5484D") +
      rect(b + s.x * dpi, b + s.y * dpi, s.w * dpi, s.h * dpi, "#3E7BFA") +
      `</svg>`,
  );
}
