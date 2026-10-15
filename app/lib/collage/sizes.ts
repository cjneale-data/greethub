import type { Orientation, PrintSize, PrintSizeId, Rect } from "./types";

/** Print resolution for every flat card. */
export const PRINT_DPI = 300;
export const BLEED_IN = 0.125;
export const SAFE_IN = 0.25;

/** Portrait presets (plan section 3). Landscape is the same card turned: see `orient()`. */
export const PRINT_SIZES: Record<PrintSizeId, PrintSize> = {
  flat_5x7: { id: "flat_5x7", label: "Flat 5 x 7 in", orientation: "portrait", trim: { w: 5, h: 7 }, bleed: BLEED_IN, safe: SAFE_IN },
  flat_4x6: { id: "flat_4x6", label: "Flat 4 x 6 in", orientation: "portrait", trim: { w: 4, h: 6 }, bleed: BLEED_IN, safe: SAFE_IN },
  flat_3_5x5: { id: "flat_3_5x5", label: "Flat 3.5 x 5 in", orientation: "portrait", trim: { w: 3.5, h: 5 }, bleed: BLEED_IN, safe: SAFE_IN },
};

export function getSize(id: PrintSizeId, orientation: Orientation = "portrait"): PrintSize {
  const s = PRINT_SIZES[id];
  if (!s) throw new Error(`Unknown print size: ${id}`);
  return orient(s, orientation);
}

export function orient(size: PrintSize, orientation: Orientation): PrintSize {
  if (size.orientation === orientation) return size;
  return { ...size, orientation, trim: { w: size.trim.h, h: size.trim.w } };
}

/** Full page including bleed, inches. */
export const pageInches = (s: PrintSize) => ({ w: s.trim.w + 2 * s.bleed, h: s.trim.h + 2 * s.bleed });

/** Full page including bleed, pixels at `dpi`. 5x7 at 300 DPI is 1575 x 2175. */
export const pagePixels = (s: PrintSize, dpi = PRINT_DPI) => {
  const p = pageInches(s);
  return { width: Math.round(p.w * dpi), height: Math.round(p.h * dpi) };
};

/** Safe area in trim coordinates. */
export const safeRect = (s: PrintSize): Rect => ({ x: s.safe, y: s.safe, w: s.trim.w - 2 * s.safe, h: s.trim.h - 2 * s.safe });

/**
 * Size ids used by docs/design/photo-events-templates.json, mapped onto the three presets. The design names each
 * orientation separately; the engine stores one preset plus an orientation.
 */
export const DESIGN_SIZE_IDS = {
  flat_5x7_p: { id: "flat_5x7", orientation: "portrait" },
  flat_7x5_l: { id: "flat_5x7", orientation: "landscape" },
  postcard_6x4_l: { id: "flat_4x6", orientation: "landscape" },
  details_4x6_p: { id: "flat_4x6", orientation: "portrait" },
  rsvp_5x3_5_l: { id: "flat_3_5x5", orientation: "landscape" },
} as const satisfies Record<string, { id: PrintSizeId; orientation: Orientation }>;
export type DesignSizeId = keyof typeof DESIGN_SIZE_IDS;

export function sizeFromDesignId(id: string): PrintSize {
  const m = (DESIGN_SIZE_IDS as Record<string, { id: PrintSizeId; orientation: Orientation }>)[id];
  if (!m) throw new Error(`Unknown design size: ${id}`);
  return getSize(m.id, m.orientation);
}

/** Every preset in both orientations: the sizes a design must render at. */
export const ALL_SIZES: PrintSize[] = (Object.keys(PRINT_SIZES) as PrintSizeId[]).flatMap((id) => [getSize(id, "portrait"), getSize(id, "landscape")]);
