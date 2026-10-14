import sharp from "sharp";
import { GLYPH_FALLBACKS, TEMPLATE_GLYPHS } from "@greethub/shared";
import type { GlyphBox } from "./types";

/**
 * Custom handwriting from a template sheet: no model calls, all local image work.
 *  1. `templateSvg()` is a Letter page: an 8 x 10 grid of boxes, each labelled in light blue, framed by four black
 *     registration squares.
 *  2. The member fills it in with a dark pen and uploads a photo or scan. `extractSheet()` finds the four squares,
 *     undoes the perspective (homography), drops the light-blue guides and paper, and keeps each box's ink.
 *  3. `renderHandwriting()` sets any text from those glyphs into a transparent PNG that fits a box.
 * Geometry is in inches on the template; the cleaned sheet is SHEET_PPI pixels per inch over the grid only.
 */

export const PAGE = { w: 8.5, h: 11 };
export const GRID = { cols: 8, rows: 10, x0: 0.75, y0: 1.55, cellW: 0.875, cellH: 0.85 };
const GRID_W = GRID.cols * GRID.cellW;
const GRID_H = GRID.rows * GRID.cellH;
/** Label strip at the top of each cell, then the writing box. Baseline sits this far down the writing box. */
const LABEL_H = 0.2;
const BOTTOM_PAD = 0.05;
const BASELINE_AT = 0.7;
const MARKER = 0.35;
const MARKER_OFFSET = 0.3;
export const SHEET_PPI = 192;
/** Pen colour for rendered handwriting and signatures (warm near-black, like the brand cocoa). */
export const INK = { r: 0x2b, g: 0x1e, b: 0x18 }; // #2B1E18, the print layout's NAVY

/** Marker centres in template inches: TL, TR, BL, BR. */
export const MARKERS: [number, number][] = [
  [GRID.x0 - MARKER_OFFSET, GRID.y0 - MARKER_OFFSET],
  [GRID.x0 + GRID_W + MARKER_OFFSET, GRID.y0 - MARKER_OFFSET],
  [GRID.x0 - MARKER_OFFSET, GRID.y0 + GRID_H + MARKER_OFFSET],
  [GRID.x0 + GRID_W + MARKER_OFFSET, GRID.y0 + GRID_H + MARKER_OFFSET],
];
/** Orientation mark: a smaller square just right of the top-left marker, so a sideways or upside-down photo still reads. */
const ORIENT = { size: 0.2, dx: 0.45 };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Printable template. Units are 1/100 in; print at 100% ("actual size"). */
export function templateSvg(): string {
  const u = (v: number) => +(v * 100).toFixed(2);
  const guide = "#8FC3FF";
  const parts: string[] = [];
  parts.push(`<rect width="${u(PAGE.w)}" height="${u(PAGE.h)}" fill="#fff"/>`);
  parts.push(`<text x="${u(0.75)}" y="${u(0.6)}" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#2B1E18">GreetHub handwriting sheet</text>`);
  parts.push(`<text x="${u(0.75)}" y="${u(0.88)}" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#6B5A50">Print at 100% (actual size). Write one character in each box with a dark pen, sitting on the dotted line.</text>`);
  parts.push(`<text x="${u(0.75)}" y="${u(1.06)}" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#6B5A50">Then take a straight-on photo in good light with all the black squares in the picture.</text>`);
  for (const [cx, cy] of MARKERS) parts.push(`<rect x="${u(cx - MARKER / 2)}" y="${u(cy - MARKER / 2)}" width="${u(MARKER)}" height="${u(MARKER)}" fill="#000"/>`);
  const [ox, oy] = [MARKERS[0][0] + ORIENT.dx, MARKERS[0][1]];
  parts.push(`<rect x="${u(ox - ORIENT.size / 2)}" y="${u(oy - ORIENT.size / 2)}" width="${u(ORIENT.size)}" height="${u(ORIENT.size)}" fill="#000"/>`);
  TEMPLATE_GLYPHS.forEach((ch, i) => {
    const x = GRID.x0 + (i % GRID.cols) * GRID.cellW;
    const y = GRID.y0 + Math.floor(i / GRID.cols) * GRID.cellH;
    const boxTop = y + LABEL_H;
    const boxH = GRID.cellH - LABEL_H - BOTTOM_PAD;
    parts.push(`<rect x="${u(x + 0.02)}" y="${u(y + 0.02)}" width="${u(GRID.cellW - 0.04)}" height="${u(GRID.cellH - 0.04)}" fill="none" stroke="${guide}" stroke-width="1.2" rx="4"/>`);
    parts.push(`<text x="${u(x + 0.07)}" y="${u(y + 0.15)}" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="${guide}">${esc(ch)}</text>`);
    parts.push(`<line x1="${u(x + 0.08)}" x2="${u(x + GRID.cellW - 0.08)}" y1="${u(boxTop + boxH * BASELINE_AT)}" y2="${u(boxTop + boxH * BASELINE_AT)}" stroke="${guide}" stroke-width="1" stroke-dasharray="3 4"/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}in" height="${PAGE.h}in" viewBox="0 0 ${u(PAGE.w)} ${u(PAGE.h)}">${parts.join("")}</svg>`;
}

/* ---------------- pixels ---------------- */

type Gray = { data: Uint8Array; w: number; h: number };

async function toGray(buf: Uint8Array, maxEdge: number): Promise<Gray> {
  const { data, info } = await sharp(buf, { limitInputPixels: 50_000_000 })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data.buffer, data.byteOffset, data.length), w: info.width, h: info.height };
}

/** Paper brightness around each pixel: a heavy blur of the page, so shadows and uneven light divide out. */
async function background(g: Gray, sigma: number): Promise<Uint8Array> {
  const out = await sharp(Buffer.from(g.data), { raw: { width: g.w, height: g.h, channels: 1 } }).blur(sigma).raw().toBuffer();
  return new Uint8Array(out.buffer, out.byteOffset, out.length);
}

/** Ink strength 0..255 from luminance against local paper. Light-blue guides (about 0.75 of paper) fall below the ramp. */
function inkAlpha(lum: number, bg: number): number {
  const r = lum / Math.max(bg, 40);
  if (r >= 0.62) return 0;
  if (r <= 0.36) return 255;
  return Math.round(((0.62 - r) / 0.26) * 255);
}

function percentile(data: Uint8Array, p: number): number {
  const hist = new Uint32Array(256);
  for (const v of data) hist[v]++;
  let acc = 0;
  const target = data.length * p;
  for (let i = 0; i < 256; i++) if ((acc += hist[i]) >= target) return i;
  return 255;
}

/* ---------------- registration ---------------- */

type Pt = [number, number];

/** Solid dark squares: connected components that are square-ish, well filled, and a plausible size. */
export function findMarkers(g: Gray): Pt[] | null {
  const paper = percentile(g.data, 0.9);
  const dark = Math.min(110, paper * 0.5);
  const seen = new Uint8Array(g.w * g.h);
  const area = g.w * g.h;
  const cands: { c: Pt; size: number }[] = [];
  const stack: number[] = [];
  for (let i = 0; i < area; i++) {
    if (seen[i] || g.data[i] >= dark) continue;
    let n = 0, sx = 0, sy = 0, minX = g.w, maxX = 0, minY = g.h, maxY = 0;
    stack.push(i);
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % g.w, y = (p / g.w) | 0;
      n++; sx += x; sy += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const q of [p - 1, p + 1, p - g.w, p + g.w]) {
        if (q < 0 || q >= area || seen[q] || g.data[q] >= dark) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === g.w - 1)) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const aspect = bw / bh;
    if (n < area * 0.0001 || n > area * 0.03 || aspect < 0.6 || aspect > 1.65 || n / (bw * bh) < 0.72) continue;
    cands.push({ c: [sx / n, sy / n], size: n });
  }
  if (cands.length < 5) return null;
  // The four biggest solid squares are the corners; take the extremes so a stray filled blob cannot win a corner.
  const sorted = cands.sort((a, b) => b.size - a.size);
  const median = sorted[3].size;
  const pts = sorted.slice(0, 8).filter((t) => t.size > median * 0.6).map((t) => t.c);
  const pick = (f: (p: Pt) => number, max: boolean) => pts.reduce((a, b) => ((max ? f(b) > f(a) : f(b) < f(a)) ? b : a));
  const tl = pick((p) => p[0] + p[1], false);
  const br = pick((p) => p[0] + p[1], true);
  const tr = pick((p) => p[0] - p[1], true);
  const bl = pick((p) => p[0] - p[1], false);
  if (new Set([tl, tr, bl, br].map((p) => p.join(","))).size < 4) return null;
  // Image position only says which marker is in which corner of the photo. The orientation mark says which one is the
  // sheet's real top-left: rotate the clockwise corner order until that marker comes first.
  const side = Math.sqrt(median);
  const cyc: Pt[] = [tl, tr, br, bl];
  let best: { k: number; d: number } | null = null;
  for (const s of sorted) {
    if (s.size > median * 0.6 || s.size < median * 0.12) continue;
    cyc.forEach((m, k) => {
      const d = Math.hypot(s.c[0] - m[0], s.c[1] - m[1]);
      if (d < side * 1.9 && (!best || d < best.d)) best = { k, d };
    });
  }
  if (!best) return null;
  const k = (best as { k: number }).k;
  const o = [0, 1, 2, 3].map((i) => cyc[(i + k) % 4]);
  return [o[0], o[1], o[3], o[2]];
}

/** Homography mapping src points to dst points (4 pairs). Returns the 3x3 matrix, row-major, h33 = 1. */
export function homography(src: Pt[], dst: Pt[]): number[] {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  // Gaussian elimination with partial pivoting.
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    if (Math.abs(A[c][c]) < 1e-12) throw new Error("Degenerate registration points");
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  return [...b.map((v, i) => v / A[i][i]), 1];
}

const apply = (H: number[], x: number, y: number): Pt => {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
};

/* ---------------- extraction ---------------- */

export class SheetError extends Error {
  constructor(public code: "no_markers" | "too_few_glyphs" | "missing_required" | "bad_image", message: string) {
    super(message);
  }
}

export type ExtractedSheet = { png: Buffer; em: number; glyphs: Record<string, GlyphBox>; missing: string[] };

/** Below this many readable boxes the photo is the problem, not a few blanks. */
export const MIN_GLYPHS = 40;

/** Required for a usable style: every letter in at least one case, plus every digit. Punctuation is optional. */
export function requiredGaps(glyphs: Record<string, unknown>): string[] {
  const gaps: string[] = [];
  for (const up of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if (!glyphs[up] && !glyphs[up.toLowerCase()]) gaps.push(up);
  for (const d of "0123456789") if (!glyphs[d]) gaps.push(d);
  return gaps;
}

export async function extractSheet(photo: Uint8Array): Promise<ExtractedSheet> {
  let g: Gray;
  try {
    g = await toGray(photo, 2600);
  } catch {
    throw new SheetError("bad_image", "We couldn't read that file. Try a JPG or PNG photo.");
  }
  const small = await toGray(await sharp(Buffer.from(g.data), { raw: { width: g.w, height: g.h, channels: 1 } }).png().toBuffer(), 1000);
  const marks = findMarkers(small);
  if (!marks) throw new SheetError("no_markers", "We couldn't find all the black squares (four corners and the small one at the top). Take the photo straight on, with the whole sheet in the picture.");
  const k = g.w / small.w;
  const imgPts = marks.map(([x, y]) => [x * k, y * k] as Pt);
  const H = homography(MARKERS, imgPts);

  const W = Math.round(GRID_W * SHEET_PPI), Hh = Math.round(GRID_H * SHEET_PPI);
  const warped = new Uint8Array(W * Hh);
  for (let v = 0; v < Hh; v++) {
    for (let u = 0; u < W; u++) {
      const [x, y] = apply(H, GRID.x0 + (u + 0.5) / SHEET_PPI, GRID.y0 + (v + 0.5) / SHEET_PPI);
      warped[v * W + u] = sample(g, x, y);
    }
  }
  const sheet: Gray = { data: warped, w: W, h: Hh };
  const bg = await background(sheet, SHEET_PPI * 0.12);
  const alpha = new Uint8Array(W * Hh);
  // Dense ink pulls the blurred paper estimate down; never let it fall far below the sheet's typical paper.
  const paperFloor = percentile(warped, 0.5) * 0.85;
  for (let i = 0; i < alpha.length; i++) alpha[i] = inkAlpha(warped[i], Math.max(bg[i], paperFloor));

  const glyphs: Record<string, GlyphBox> = {};
  const missing: string[] = [];
  const em = Math.round((GRID.cellH - LABEL_H - BOTTOM_PAD) * SHEET_PPI);
  TEMPLATE_GLYPHS.forEach((ch, i) => {
    const cx = Math.round(((i % GRID.cols) * GRID.cellW + 0.06) * SHEET_PPI);
    const cy = Math.round((Math.floor(i / GRID.cols) * GRID.cellH + LABEL_H) * SHEET_PPI);
    const cw = Math.round((GRID.cellW - 0.12) * SHEET_PPI);
    const ch_ = em - Math.round(0.02 * SHEET_PPI);
    const box = inkBox(alpha, W, cx, cy, cw, ch_);
    if (!box) return void missing.push(ch);
    const baselineY = cy + Math.round(em * BASELINE_AT);
    glyphs[ch] = { ...box, baseline: baselineY - box.y };
  });
  if (Object.keys(glyphs).length < MIN_GLYPHS) {
    throw new SheetError("too_few_glyphs", "We could only read a few of the boxes. Use a dark pen, fill in the letters and numbers, and try a brighter photo.");
  }
  const required = requiredGaps(glyphs);
  if (required.length) {
    throw new SheetError("missing_required", `A few boxes look empty: ${required.join(" ")}. Every letter (in either case) and every number needs filling in. Fill them and upload the sheet again.`);
  }
  const rgba = Buffer.alloc(W * Hh * 4);
  for (let i = 0; i < alpha.length; i++) {
    rgba[i * 4] = INK.r; rgba[i * 4 + 1] = INK.g; rgba[i * 4 + 2] = INK.b; rgba[i * 4 + 3] = alpha[i];
  }
  const png = await sharp(rgba, { raw: { width: W, height: Hh, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return { png, em, glyphs, missing };
}

function sample(g: Gray, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= g.w - 1 || y >= g.h - 1) return 255;
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * g.w + x0;
  const a = g.data[i] * (1 - fx) + g.data[i + 1] * fx;
  const b = g.data[i + g.w] * (1 - fx) + g.data[i + g.w + 1] * fx;
  return Math.round(a * (1 - fy) + b * fy);
}

/** Tight box around the ink in a region, ignoring rows and columns with only a stray pixel or two. Null when empty. */
function inkBox(alpha: Uint8Array, W: number, x: number, y: number, w: number, h: number): Omit<GlyphBox, "baseline"> | null {
  const cols = new Uint32Array(w), rows = new Uint32Array(h);
  let total = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (alpha[(y + j) * W + x + i] > 90) { cols[i]++; rows[j]++; total++; }
  }
  // A pen full stop is only ~8 px across at SHEET_PPI, so the floor is absolute, not a share of the box.
  if (total < 24) return null;
  const first = (a: Uint32Array) => a.findIndex((v) => v >= 2);
  const last = (a: Uint32Array) => a.length - 1 - [...a].reverse().findIndex((v) => v >= 2);
  const x0 = first(cols), x1 = last(cols), y0 = first(rows), y1 = last(rows);
  if (x0 < 0 || y0 < 0 || x1 <= x0 || y1 <= y0) return null;
  const pad = 2;
  return { x: x + Math.max(0, x0 - pad), y: y + Math.max(0, y0 - pad), w: Math.min(w, x1 - x0 + 1 + 2 * pad), h: Math.min(h, y1 - y0 + 1 + 2 * pad) };
}

/* ---------------- rendering ---------------- */

export type RenderOptions = { width: number; height: number; maxEm?: number; minEm?: number; align?: "center" | "left" };
export type RenderResult = { png: Buffer; width: number; height: number; emPx: number; fitted: boolean; unsupported: string[] };

type Style = { sheet: Buffer; em: number; glyphs: Record<string, GlyphBox> };

function glyphFor(style: Style, ch: string): GlyphBox | undefined {
  return style.glyphs[ch] ?? style.glyphs[GLYPH_FALLBACKS[ch] ?? ""] ?? style.glyphs[ch.toUpperCase()] ?? style.glyphs[ch.toLowerCase()];
}

type Placed = { ch: string; box: GlyphBox; x: number };
type Line = { glyphs: Placed[]; width: number };

function layout(style: Style, text: string, emPx: number, maxW: number): { lines: Line[]; unsupported: Set<string> } {
  const k = emPx / style.em;
  const gap = emPx * 0.02, space = emPx * 0.32;
  const unsupported = new Set<string>();
  const lines: Line[] = [];
  const word = (w: string) => {
    const out: Placed[] = [];
    let x = 0;
    for (const ch of w) {
      const box = glyphFor(style, ch);
      if (!box) { unsupported.add(ch); continue; }
      out.push({ ch, box, x });
      x += box.w * k + gap;
    }
    return { glyphs: out, width: Math.max(0, x - gap) };
  };
  for (const para of text.split(/\n/)) {
    let cur: Line = { glyphs: [], width: 0 };
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const wd = word(w);
      const start = cur.glyphs.length ? cur.width + space : 0;
      if (cur.glyphs.length && start + wd.width > maxW) {
        lines.push(cur);
        cur = { glyphs: [], width: 0 };
      }
      const off = cur.glyphs.length ? cur.width + space : 0;
      cur.glyphs.push(...wd.glyphs.map((p) => ({ ...p, x: p.x + off })));
      cur.width = off + wd.width;
    }
    lines.push(cur);
  }
  return { lines, unsupported };
}

/** Small deterministic wobble so repeated letters don't look stamped. */
const jitter = (i: number, salt: number) => (Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453) % 1;

export async function renderHandwriting(style: Style, text: string, o: RenderOptions): Promise<RenderResult> {
  const maxEm = o.maxEm ?? Math.min(o.height / 3, o.width / 8);
  const minEm = o.minEm ?? Math.max(18, maxEm * 0.35);
  let emPx = maxEm;
  let res = layout(style, text, emPx, o.width);
  const lineH = () => emPx * 0.95;
  // Room for the size wobble on the right and the last line's descenders at the bottom.
  const fits = () => res.lines.length * lineH() + emPx * 0.3 <= o.height && !res.lines.some((l) => l.width * 1.04 > o.width);
  while (emPx > minEm && !fits()) {
    emPx *= 0.93;
    res = layout(style, text, emPx, o.width);
  }
  const fitted = fits();
  const k = emPx / style.em;
  const blockH = res.lines.length * lineH();
  const top = Math.max(0, (o.height - blockH) / 2);
  // Decode the sheet once; cut glyphs from raw pixels. Three wobble sizes per letter keep the cache useful.
  const sheet = await sharp(style.sheet).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const raw = { raw: { width: sheet.info.width, height: sheet.info.height, channels: 4 as const } };
  const pad = Math.ceil(emPx * 0.5);
  const comps: { input: Buffer; left: number; top: number }[] = [];
  const cache = new Map<string, Buffer>();
  let n = 0;
  for (const [li, line] of res.lines.entries()) {
    const left = o.align === "left" ? 0 : (o.width - line.width) / 2;
    const baseline = top + li * lineH() + emPx * 0.7;
    for (const p of line.glyphs) {
      const s = [0.97, 1, 1.03][Math.min(2, Math.floor((jitter(n, 1) + 1) * 1.5))];
      const w = Math.max(1, Math.round(p.box.w * k * s)), h = Math.max(1, Math.round(p.box.h * k * s));
      const key = `${p.ch}:${w}x${h}`;
      let img = cache.get(key);
      if (!img) {
        img = await sharp(sheet.data, raw).extract({ left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h }).resize(w, h, { fit: "fill" }).png().toBuffer();
        cache.set(key, img);
      }
      const x = Math.round(left + p.x) + pad;
      const y = Math.round(baseline - p.box.baseline * k * s + jitter(n, 2) * emPx * 0.03) + pad;
      // Clip rather than drop: everything lands on a padded canvas, then the box is cut out of it.
      if (x >= 0 && y >= 0 && x + w <= o.width + 2 * pad && y + h <= o.height + 2 * pad) comps.push({ input: img, left: x, top: y });
      n++;
    }
  }
  const W = Math.round(o.width), H = Math.round(o.height);
  const big = await sharp({ create: { width: W + 2 * pad, height: H + 2 * pad, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png().toBuffer();
  const png = await sharp(big).extract({ left: pad, top: pad, width: W, height: H }).png().toBuffer();
  return { png, width: W, height: H, emPx, fitted, unsupported: [...res.unsupported] };
}

/* ---------------- signatures ---------------- */

export class SignatureError extends Error {
  constructor(public code: "bad_image" | "no_ink" | "too_busy" | "bad_strokes", message: string) {
    super(message);
  }
}

/** Ink-only transparent PNG of a signature photographed or scanned on plain paper, cropped to the ink. */
export async function signatureFromPhoto(photo: Uint8Array): Promise<{ png: Buffer; width: number; height: number }> {
  let g: Gray;
  try {
    g = await toGray(photo, 3000); // ~2.2 in printed wide at 300 DPI needs ~660 px of signature, often a third of the photo
  } catch {
    throw new SignatureError("bad_image", "We couldn't read that file. Try a JPG or PNG photo.");
  }
  const bg = await background(g, Math.max(8, Math.min(g.w, g.h) * 0.04));
  const alpha = new Uint8Array(g.w * g.h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = inkAlpha(g.data[i], bg[i]);
  const box = inkBox(alpha, g.w, 0, 0, g.w, g.h);
  if (!box || box.w < 40 || box.h < 12) throw new SignatureError("no_ink", "We couldn't see a signature. Sign in dark pen on plain white paper and try again.");
  let ink = 0;
  for (let j = box.y; j < box.y + box.h; j++) for (let i = box.x; i < box.x + box.w; i++) if (alpha[j * g.w + i] > 90) ink++;
  if (ink / (box.w * box.h) > 0.4) throw new SignatureError("too_busy", "That looks like more than a signature. Crop to just your signature on plain paper.");
  return inkPng(alpha, g.w, box);
}

export type Stroke = { x: number; y: number }[];

/** Signature drawn on the canvas: smooth the strokes into an SVG path and render ink-only, cropped. */
export async function signatureFromStrokes(strokes: Stroke[], canvas: { w: number; h: number }): Promise<{ png: Buffer; width: number; height: number }> {
  const pts = strokes.reduce((n, s) => n + s.length, 0);
  if (!strokes.length || pts < 8) throw new SignatureError("bad_strokes", "Sign in the box first.");
  if (strokes.length > 60 || pts > 6000) throw new SignatureError("bad_strokes", "That signature is too long. Clear it and try again.");
  const ok = (v: number, max: number) => Number.isFinite(v) && v >= -5 && v <= max + 5;
  const scale = 3;
  const d = strokes
    .map((s) => {
      if (!s.every((p) => ok(p.x, canvas.w) && ok(p.y, canvas.h))) throw new SignatureError("bad_strokes", "Sign in the box first.");
      if (s.length === 1) return `M${s[0].x * scale} ${s[0].y * scale}l0.1 0`;
      let path = `M${s[0].x * scale} ${s[0].y * scale}`;
      for (let i = 1; i < s.length - 1; i++) {
        const mx = ((s[i].x + s[i + 1].x) / 2) * scale, my = ((s[i].y + s[i + 1].y) / 2) * scale;
        path += `Q${s[i].x * scale} ${s[i].y * scale} ${mx} ${my}`;
      }
      const z = s[s.length - 1];
      return `${path}L${z.x * scale} ${z.y * scale}`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.w * scale}" height="${canvas.h * scale}"><path d="${d}" fill="none" stroke="rgb(${INK.r},${INK.g},${INK.b})" stroke-width="${2.6 * scale}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const trimmed = await sharp(Buffer.from(svg)).png().trim({ threshold: 1 }).extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
  return { png: trimmed.data, width: trimmed.info.width, height: trimmed.info.height };
}

async function inkPng(alpha: Uint8Array, W: number, box: Omit<GlyphBox, "baseline">) {
  const pad = Math.round(Math.max(box.w, box.h) * 0.04);
  const out = Buffer.alloc((box.w + 2 * pad) * (box.h + 2 * pad) * 4);
  const ow = box.w + 2 * pad;
  for (let j = 0; j < box.h; j++) for (let i = 0; i < box.w; i++) {
    const o = ((j + pad) * ow + i + pad) * 4;
    out[o] = INK.r; out[o + 1] = INK.g; out[o + 2] = INK.b; out[o + 3] = alpha[(box.y + j) * W + box.x + i];
  }
  const png = await sharp(out, { raw: { width: ow, height: box.h + 2 * pad, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return { png, width: ow, height: box.h + 2 * pad };
}
