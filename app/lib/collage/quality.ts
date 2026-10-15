import { insideRect, paintRect } from "./geometry";
import { cropRect } from "./place";
import { PRINT_DPI, safeRect } from "./sizes";
import type { Design, PhotoInfo, PrintSize, QualityLevel, SlotQuality, Template } from "./types";

/** Below this the print may look soft: amber warning (design doc section 5). */
export const DPI_WARN = 200;
/** Below this it will look blurry: red, the person must tick "Print it anyway". */
export const DPI_TOO_LOW = 150;
/** Below this the slot is blocked: swap the photo or pick a smaller slot. */
export const DPI_BLOCK = 100;

export function qualityLevel(dpi: number): QualityLevel {
  if (dpi < DPI_BLOCK) return "blocked";
  if (dpi < DPI_TOO_LOW) return "too_low";
  if (dpi < DPI_WARN) return "low";
  return "ok";
}

/**
 * Effective DPI: source pixels in the crop divided by the printed inches of the painted slot (bleed included).
 * The crop has the slot's aspect, so width and height agree; the smaller of the two is reported to absorb rounding.
 */
export function effectiveDpi(crop: { width: number; height: number }, printedIn: { w: number; h: number }): number {
  return Math.min(crop.width / printedIn.w, crop.height / printedIn.h);
}

export function photoQuality(template: Template, size: PrintSize, design: Pick<Design, "photos">, photos: PhotoInfo[]): SlotQuality[] {
  const out: SlotQuality[] = [];
  for (const placed of design.photos) {
    const slot = template.slots.find((s) => s.id === placed.slotId);
    const info = photos.find((p) => p.id === placed.photoId);
    if (!slot || !info) continue;
    const r = paintRect(slot, size);
    const crop = cropRect(info.width, info.height, r.w / r.h, placed.crop);
    const dpi = Math.round(effectiveDpi(crop, r));
    const level = qualityLevel(dpi);
    const message =
      level === "blocked"
        ? "This photo is too small for this spot to print. Swap the photo or pick a smaller spot."
        : level === "too_low"
          ? "This photo will print blurry at this size. Print it anyway, or try a larger copy or a smaller spot."
          : level === "low"
            ? "This photo may print a little soft."
            : undefined;
    out.push({ slotId: slot.id, photoId: info.id, dpi, level, message, upscale: Math.round((PRINT_DPI / Math.max(1, dpi)) * 100) / 100 });
  }
  return out;
}

export type DesignIssue =
  | { kind: "photo_quality"; slotId: string; dpi: number; level: Exclude<QualityLevel, "ok">; message: string }
  | { kind: "empty_photo_slot"; slotId: string; message: string; optional?: boolean }
  | { kind: "text_outside_safe"; slotId: string; message: string };

/** Everything to show before approval. Template authoring errors (text past the safe area) are included so tests catch them. */
export function checkDesign(template: Template, size: PrintSize, design: Pick<Design, "photos">, photos: PhotoInfo[]): DesignIssue[] {
  const issues: DesignIssue[] = [];
  for (const q of photoQuality(template, size, design, photos)) {
    if (q.level !== "ok") issues.push({ kind: "photo_quality", slotId: q.slotId, dpi: q.dpi, level: q.level, message: q.message! });
  }
  const filled = new Set(design.photos.map((p) => p.slotId));
  const safe = safeRect(size);
  for (const s of template.slots) {
    if (s.kind === "photo" && !filled.has(s.id)) {
      if (!s.optional) issues.push({ kind: "empty_photo_slot", slotId: s.id, message: "This spot needs a photo." });
    }
    if (s.kind === "text" && !insideRect(s, safe)) issues.push({ kind: "text_outside_safe", slotId: s.id, message: "Text here could be trimmed off when the card is cut." });
  }
  return issues;
}

/**
 * Can this design be approved? Blocked photos and empty required slots always stop it; red (too_low) photos
 * stop it unless the person ticked "Print it anyway" for that slot (`acknowledged`).
 */
export function approvalState(issues: DesignIssue[], acknowledged: string[] = []): { canApprove: boolean; blocking: DesignIssue[]; needsAck: string[] } {
  const blocking: DesignIssue[] = [];
  const needsAck: string[] = [];
  for (const i of issues) {
    if (i.kind === "photo_quality" && i.level === "too_low") {
      if (!acknowledged.includes(i.slotId)) { needsAck.push(i.slotId); blocking.push(i); }
    } else if (i.kind === "photo_quality" && i.level === "low") continue;
    else blocking.push(i);
  }
  return { canApprove: blocking.length === 0, blocking, needsAck };
}
