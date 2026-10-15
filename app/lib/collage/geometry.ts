import { getSize, safeRect } from "./sizes";
import type { PrintSize, Rect, Slot, Template } from "./types";

const EDGE_EPS = 0.01;

/**
 * Slot rectangle as it will be painted, in trim inches. A `bleed` slot touching a trim edge is extended out
 * to the page edge on that side, so a full-bleed photo covers the bleed.
 */
export function paintRect(slot: Slot, size: PrintSize): Rect {
  let { x, y, w, h } = slot;
  if (!slot.bleed) return { x, y, w, h };
  const b = size.bleed;
  const { w: tw, h: th } = size.trim;
  if (Math.abs(x) <= EDGE_EPS) { w += x + b; x = -b; }
  if (Math.abs(y) <= EDGE_EPS) { h += y + b; y = -b; }
  if (Math.abs(x + w - tw) <= EDGE_EPS) w = tw + b - x;
  if (Math.abs(y + h - th) <= EDGE_EPS) h = th + b - y;
  return { x, y, w, h };
}

/** Pixel rectangle on the full page (bleed included) at `dpi`. Edges are rounded, so neighbours share pixel edges. */
export function toPagePixels(r: Rect, size: PrintSize, dpi: number) {
  const left = Math.round((r.x + size.bleed) * dpi);
  const top = Math.round((r.y + size.bleed) * dpi);
  const right = Math.round((r.x + r.w + size.bleed) * dpi);
  const bottom = Math.round((r.y + r.h + size.bleed) * dpi);
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

export const insideRect = (inner: Rect, outer: Rect, eps = 1e-3) =>
  inner.x >= outer.x - eps && inner.y >= outer.y - eps && inner.x + inner.w <= outer.x + outer.w + eps && inner.y + inner.h <= outer.y + outer.h + eps;

/**
 * Scale a template authored for one size onto another, per axis. 5x7 to 4x6 is a slight squeeze (0.8 x 0.857);
 * point sizes scale by the smaller factor so text never grows past its box, but never below the slot's `minPt`.
 * Edges that sit on the bleed edge stay on the bleed edge (bleed is a fixed 0.125 in, not a proportion), so a
 * photo authored as running into bleed still covers it on every size.
 */
export function fitTemplate(t: Template, target: PrintSize): Template {
  const src = getSize(t.size, t.orientation);
  if (src.trim.w === target.trim.w && src.trim.h === target.trim.h) return t;
  const kx = target.trim.w / src.trim.w;
  const ky = target.trim.h / src.trim.h;
  const kt = Math.min(kx, ky);
  const r = (v: number) => Math.round(v * 10000) / 10000;
  const edge = (v: number, k: number, srcTrim: number, dstTrim: number) => {
    if (v <= -src.bleed + EDGE_EPS) return -target.bleed;
    if (v >= srcTrim + src.bleed - EDGE_EPS) return dstTrim + target.bleed;
    return v * k;
  };
  const mapSlot = (s: Slot): Rect => {
    const x0 = edge(s.x, kx, src.trim.w, target.trim.w), x1 = edge(s.x + s.w, kx, src.trim.w, target.trim.w);
    const y0 = edge(s.y, ky, src.trim.h, target.trim.h), y1 = edge(s.y + s.h, ky, src.trim.h, target.trim.h);
    return { x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0) };
  };
  return {
    ...t,
    size: target.id,
    orientation: target.orientation,
    slots: t.slots.map((s) => {
      const base = { ...s, ...mapSlot(s), ...(s.pivot ? { pivot: { x: r(s.pivot.x * kx), y: r(s.pivot.y * ky) } } : {}) };
      if (s.kind === "text") {
        // The safe margin is a fixed 0.25 in, not a proportion, so scaling can push text past it. Text that was
        // safe on the source size is pulled (then shrunk if needed) back inside the target's safe area.
        const box = insideRect(s, safeRect(src)) ? keepInside(base, safeRect(target)) : base;
        const sizePt = r(Math.max(s.minPt ?? 0, s.sizePt * kt));
        return { ...base, ...mapRect(box, r), kind: "text", sizePt } as Slot;
      }
      if (s.kind === "photo" && s.radius) return { ...base, kind: "photo", radius: r(s.radius * kt) } as Slot;
      return base as Slot;
    }),
  };
}

/** Rotate point `p` by `deg` clockwise (y down) about `c`. */
export function rotatePoint(p: { x: number; y: number }, c: { x: number; y: number }, deg: number) {
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}

export const slotCenter = (s: Rect) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });

/** Slots in paint order: by `z`, with slots lacking z at their array index. Stable. */
export function paintOrder<T extends { z?: number }>(slots: T[]): T[] {
  return slots.map((s, i) => ({ s, i, z: s.z ?? i })).sort((a, b) => a.z - b.z || a.i - b.i).map((x) => x.s);
}

export const intersectRect = (a: Rect, b: Rect): Rect | null => {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x && y1 > y ? { x, y, w: x1 - x, h: y1 - y } : null;
};

const mapRect = (b: Rect, f: (v: number) => number): Rect => ({ x: f(b.x), y: f(b.y), w: f(b.w), h: f(b.h) });

/** Shift a rect into `outer`, shrinking it only when it is bigger than `outer`. */
export function keepInside(b: Rect, outer: Rect): Rect {
  const w = Math.min(b.w, outer.w), h = Math.min(b.h, outer.h);
  const x = Math.min(outer.x + outer.w - w, Math.max(outer.x, b.x));
  const y = Math.min(outer.y + outer.h - h, Math.max(outer.y, b.y));
  return { x, y, w, h };
}
