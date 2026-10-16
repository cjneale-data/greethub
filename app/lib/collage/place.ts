import sharp from "sharp";
import { paintRect } from "./geometry";
import type { Crop, Design, PhotoInfo, PhotoSlot, PixelRect, PrintSize, Rect, SlotOverride, Template } from "./types";

/* ---------------- photo analysis ---------------- */

const ANALYSIS_EDGE = 256;
/** Largest photo the engine will decode (security review: 50 megapixels). sharp throws past this, before decoding. */
export const MAX_INPUT_PIXELS = 50_000_000;

/**
 * Oriented size and a suggested focus point for one photo. Focus comes from sharp's attention strategy
 * (luminance frequency, saturation and skin tones, so faces usually win) run on a small copy, which keeps it
 * fast and deterministic. No face model, no network. Falls back to the centre when attention gives nothing.
 */
export async function analyzePhoto(id: string, data: Uint8Array): Promise<PhotoInfo> {
  const meta = await sharp(data, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  if (!meta.width || !meta.height) throw new Error("Unreadable photo");
  if (meta.width * meta.height > MAX_INPUT_PIXELS) throw new Error("Photo is too large to process");
  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  const small = await sharp(data, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize(ANALYSIS_EDGE, ANALYSIS_EDGE, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  const sw = small.info.width, sh = small.info.height;
  // Ask for a crop narrower than the image along its long side; sharp reports the attention point in the
  // pre-crop (here: unscaled) coordinates of the small copy on both axes.
  const tw = sw >= sh ? Math.max(1, Math.round(sw / 2)) : sw;
  const th = sw >= sh ? sh : Math.max(1, Math.round(sh / 2));
  try {
    const { info } = await sharp(small.data)
      .resize(tw, th, { fit: "cover", position: sharp.strategy.attention })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ax = (info as { attentionX?: number }).attentionX;
    const ay = (info as { attentionY?: number }).attentionY;
    if (typeof ax === "number" && typeof ay === "number") {
      return { id, width, height, focusX: clamp01(ax / sw), focusY: clamp01(ay / sh), focusSource: "attention" };
    }
  } catch {
    // fall through to the centre
  }
  return { id, width, height, focusX: 0.5, focusY: 0.5, focusSource: "center" };
}

/* ---------------- crop math ---------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const MAX_ZOOM = 4;

export const defaultCrop = (p: Pick<PhotoInfo, "focusX" | "focusY">): Crop => ({ focusX: p.focusX, focusY: p.focusY, zoom: 1 });

/**
 * Source rectangle for a photo of `imgW x imgH` filling a slot of aspect `slotAspect` (w / h).
 * zoom 1 is the largest crop with the slot's aspect; the crop is centred on the focus and then slid back inside
 * the photo, so the slot is always fully covered (no letterboxing).
 */
export function cropRect(imgW: number, imgH: number, slotAspect: number, crop: Crop): PixelRect {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, crop.zoom || 1));
  let cw: number, ch: number;
  if (imgW / imgH > slotAspect) { ch = imgH; cw = imgH * slotAspect; } else { cw = imgW; ch = imgW / slotAspect; }
  cw /= zoom; ch /= zoom;
  const cx = clamp01(crop.focusX) * imgW, cy = clamp01(crop.focusY) * imgH;
  const left = Math.min(imgW - cw, Math.max(0, cx - cw / 2));
  const top = Math.min(imgH - ch, Math.max(0, cy - ch / 2));
  // Integer pixels for sharp.extract; never past the image edge.
  const L = Math.max(0, Math.floor(left)), T = Math.max(0, Math.floor(top));
  const W = Math.max(1, Math.min(imgW - L, Math.round(cw))), H = Math.max(1, Math.min(imgH - T, Math.round(ch)));
  return { left: L, top: T, width: W, height: H };
}

/** Crop that `cropRect` actually produces, expressed back as a centred focus (useful after clamping). */
export function effectiveCrop(imgW: number, imgH: number, slotAspect: number, crop: Crop): Crop {
  const r = cropRect(imgW, imgH, slotAspect, crop);
  return { focusX: (r.left + r.width / 2) / imgW, focusY: (r.top + r.height / 2) / imgH, zoom: Math.min(MAX_ZOOM, Math.max(1, crop.zoom || 1)) };
}

/**
 * Drag the photo inside its slot by a fraction of the slot (dx = 0.1 moves the picture 10% of the slot width to
 * the right, so the focus moves left). Result is clamped, so dragging past an edge stops there.
 */
export function panCrop(imgW: number, imgH: number, slotAspect: number, crop: Crop, dx: number, dy: number): Crop {
  const r = cropRect(imgW, imgH, slotAspect, crop);
  const moved = { ...crop, focusX: (r.left + r.width / 2 - dx * r.width) / imgW, focusY: (r.top + r.height / 2 - dy * r.height) / imgH };
  return effectiveCrop(imgW, imgH, slotAspect, moved);
}

/* ---------------- face-aware auto-crop ---------------- */

/** Design doc section 5: faces stay this far (share of the slot's short side) inside the slot, with headroom above. */
export const FACE_MARGIN = 0.08;
export const FACE_HEADROOM = 0.05;

const unionRect = (rs: Rect[]): Rect => {
  const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** Does every face box (0..1 of the photo) sit inside the crop with the design margin and headroom? */
export function facesInFrame(info: Pick<PhotoInfo, "width" | "height" | "faces">, slotAspect: number, crop: Crop): boolean {
  if (!info.faces?.length) return true;
  const r = cropRect(info.width, info.height, slotAspect, crop);
  const m = FACE_MARGIN * Math.min(r.width, r.height);
  const head = FACE_HEADROOM * r.height;
  return info.faces.every((f) => {
    const fx = f.x * info.width, fy = f.y * info.height, fw = f.w * info.width, fh = f.h * info.height;
    return fx >= r.left + m - 0.5 && fx + fw <= r.left + r.width - m + 0.5 && fy >= r.top + Math.max(m, head) - 0.5 && fy + fh <= r.top + r.height - m + 0.5;
  });
}

/**
 * Crop for one slot. With face boxes: centre the group of faces (in the upper third for "upper" slots, whose text
 * band sits below), the largest crop cannot zoom out, so if the faces still do not fit with margin
 * the crop is returned anyway and `facesOk` is false (the editor suggests a different slot). Without faces: the
 * attention focus. No generative changes to the photo: only the window moves.
 */
export function autoCrop(info: PhotoInfo, slotAspect: number, zone: "upper" | "center" = "center", zoom = 1): { crop: Crop; facesOk: boolean } {
  let focusX = info.focusX, focusY = info.focusY;
  if (info.faces?.length) {
    const u = unionRect(info.faces);
    focusX = u.x + u.w / 2;
    focusY = u.y + u.h / 2;
    if (zone === "upper") {
      const r = cropRect(info.width, info.height, slotAspect, { focusX, focusY, zoom });
      focusY = focusY + (0.5 - 1 / 3) * (r.height / info.height);
    }
  }
  const crop = { focusX, focusY, zoom: Math.min(MAX_ZOOM, Math.max(1, zoom)) };
  const eff = effectiveCrop(info.width, info.height, slotAspect, crop);
  return { crop: eff, facesOk: facesInFrame(info, slotAspect, eff) };
}

/* ---------------- auto-place ---------------- */

export function photoSlots(t: Template): PhotoSlot[] {
  const slots = t.slots.filter((s): s is PhotoSlot => s.kind === "photo");
  // Explicit priority first, then largest area, then template order. Stable and deterministic.
  return slots
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (a.s.priority ?? Infinity) - (b.s.priority ?? Infinity) || b.s.w * b.s.h - a.s.w * a.s.h || a.i - b.i)
    .map((x) => x.s);
}

export type AutoPlaceOptions = {
  /**
   * "order": the first photo goes in the most important slot, and so on (what people expect when they pick a hero).
   * "aspect": each slot, most important first, takes the remaining photo whose shape is closest to it.
   */
  strategy?: "order" | "aspect";
  overrides?: Record<string, SlotOverride>;
};

/**
 * Assign photos to photo slots and give each a crop. Overrides win: `photoId` pins a photo to a slot
 * (null leaves it empty) and any crop fields replace the computed ones. Unpinned photos fill the remaining slots.
 * Extra photos are left out; missing photos leave slots empty.
 */
export function autoPlace(template: Template, size: PrintSize, photos: PhotoInfo[], opts: AutoPlaceOptions = {}): Design["photos"] {
  const overrides = opts.overrides ?? {};
  const slots = photoSlots(template);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const used = new Set<string>();
  const chosen = new Map<string, PhotoInfo | null>();
  for (const s of slots) {
    const o = overrides[s.id];
    if (!o || o.photoId === undefined) continue;
    const p = o.photoId === null ? null : byId.get(o.photoId) ?? null;
    if (p && used.has(p.id)) continue;
    chosen.set(s.id, p);
    if (p) used.add(p.id);
  }
  for (const s of slots) {
    if (chosen.has(s.id)) continue;
    const left = photos.filter((p) => !used.has(p.id));
    if (!left.length) break;
    let pick = left[0];
    if (opts.strategy === "aspect") {
      const r = paintRect(s, size);
      const want = Math.log(r.w / r.h);
      pick = left.reduce((best, p) => (Math.abs(Math.log(p.width / p.height) - want) < Math.abs(Math.log(best.width / best.height) - want) ? p : best));
    }
    chosen.set(s.id, pick);
    used.add(pick.id);
  }
  const out: Design["photos"] = [];
  for (const s of slots) {
    const p = chosen.get(s.id);
    if (!p) continue;
    const o = overrides[s.id] ?? {};
    const r = paintRect(s, size);
    const auto = autoCrop(p, r.w / r.h, s.faceZone ?? "center", o.zoom ?? 1).crop;
    const crop: Crop = {
      focusX: o.focusX ?? (p.faces?.length ? auto.focusX : p.focusX),
      focusY: o.focusY ?? (p.faces?.length ? auto.focusY : p.focusY),
      zoom: Math.min(MAX_ZOOM, Math.max(1, o.zoom ?? 1)),
    };
    out.push({ slotId: s.id, photoId: p.id, crop });
  }
  return out;
}

/** Swap the photos in two slots, keeping each slot's zoom but re-centring on the incoming photo's focus. */
export function swapPhotos(placed: Design["photos"], a: string, b: string, photos: PhotoInfo[]): Design["photos"] {
  const pa = placed.find((p) => p.slotId === a), pb = placed.find((p) => p.slotId === b);
  const move = (to: string, from: (typeof placed)[number], zoom: number) => {
    const i = photos.find((p) => p.id === from.photoId);
    return { slotId: to, photoId: from.photoId, crop: { focusX: i?.focusX ?? 0.5, focusY: i?.focusY ?? 0.5, zoom } };
  };
  const rest = placed.filter((p) => p.slotId !== a && p.slotId !== b);
  if (pb) rest.push(move(a, pb, pa?.crop.zoom ?? 1));
  if (pa) rest.push(move(b, pa, pb?.crop.zoom ?? 1));
  return rest;
}
