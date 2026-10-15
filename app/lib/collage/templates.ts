import { z } from "zod";
import type { Template } from "./types";

/**
 * Three sample layouts, authored on flat 5x7 portrait, until docs/design/photo-events-templates.json lands.
 * Load that file with `parseTemplates(JSON.parse(text))`; it accepts a single template, an array, or { templates: [...] }.
 * Font keys are placeholders for the brand fonts ("display", "body") and handwriting style ids.
 */

const INK = "#2B1E18";
const CREAM = "#FBF6EF";

export const FULL_BLEED: Template = {
  id: "full-bleed",
  name: "One big photo",
  size: "flat_5x7",
  orientation: "portrait",
  background: CREAM,
  tags: ["holiday", "save-the-date"],
  slots: [
    { id: "photo1", kind: "photo", x: 0, y: 0, w: 5, h: 7, bleed: true },
    { id: "band", kind: "art", x: 0, y: 5.35, w: 5, h: 1.65, bleed: true, fill: CREAM, opacity: 0.92 },
    { id: "headline", kind: "text", x: 0.35, y: 5.5, w: 4.3, h: 0.75, font: "display", sizePt: 30, color: INK, align: "center", valign: "middle", placeholder: "Season's greetings", maxLines: 1 },
    { id: "names", kind: "text", x: 0.35, y: 6.25, w: 4.3, h: 0.45, font: "body", sizePt: 13, color: INK, align: "center", valign: "middle", placeholder: "Love, the Rivera family", maxLines: 1 },
  ],
};

export const TWO_UP: Template = {
  id: "two-up",
  name: "Two photos",
  size: "flat_5x7",
  orientation: "portrait",
  background: CREAM,
  tags: ["holiday", "invitation"],
  slots: [
    { id: "photo1", kind: "photo", x: 0, y: 0, w: 5, h: 3.2, bleed: true, priority: 0 },
    { id: "photo2", kind: "photo", x: 0, y: 3.3, w: 5, h: 2.4, bleed: true, priority: 1 },
    { id: "headline", kind: "text", x: 0.35, y: 5.8, w: 4.3, h: 0.6, font: "display", sizePt: 24, color: INK, align: "center", valign: "middle", placeholder: "Happy holidays", maxLines: 1 },
    { id: "names", kind: "text", x: 0.35, y: 6.35, w: 4.3, h: 0.4, font: "body", sizePt: 12, color: INK, align: "center", valign: "middle", placeholder: "Sam, Alex and June", maxLines: 1 },
  ],
};

export const FOUR_GRID: Template = {
  id: "four-grid",
  name: "Four photo grid",
  size: "flat_5x7",
  orientation: "portrait",
  background: CREAM,
  tags: ["holiday", "year-in-review"],
  slots: [
    { id: "photo1", kind: "photo", x: 0, y: 0, w: 2.47, h: 2.75, bleed: true },
    { id: "photo2", kind: "photo", x: 2.53, y: 0, w: 2.47, h: 2.75, bleed: true },
    { id: "photo3", kind: "photo", x: 0, y: 2.81, w: 2.47, h: 2.75, bleed: true },
    { id: "photo4", kind: "photo", x: 2.53, y: 2.81, w: 2.47, h: 2.75, bleed: true },
    { id: "headline", kind: "text", x: 0.35, y: 5.7, w: 4.3, h: 0.65, font: "display", sizePt: 26, color: INK, align: "center", valign: "middle", placeholder: "Our year", maxLines: 1 },
    { id: "names", kind: "text", x: 0.35, y: 6.35, w: 4.3, h: 0.4, font: "body", sizePt: 12, color: INK, align: "center", valign: "middle", placeholder: "With love from all of us", maxLines: 2 },
  ],
};

export const SAMPLE_TEMPLATES: Template[] = [FULL_BLEED, TWO_UP, FOUR_GRID];

/* ---------------- loading from JSON ---------------- */

const num = z.number().finite();
const base = {
  id: z.string().min(1), x: num, y: num, w: num.positive(), h: num.positive(), bleed: z.boolean().optional(),
  rotate: num.optional(), pivot: z.object({ x: num, y: num }).optional(), z: num.optional(), optional: z.boolean().optional(),
};
const pair = z.tuple([num, num]);
const color = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "colour must be #rgb or #rrggbb");

const slotSchema = z.discriminatedUnion("kind", [
  z.object({
    ...base,
    kind: z.literal("photo"),
    priority: num.optional(),
    radius: num.nonnegative().optional(),
    mask: z.literal("circle").optional(),
    faceZone: z.enum(["upper", "center"]).optional(),
    hero: z.boolean().optional(),
    minPixels: z.object({ warnBelow: pair, blockBelow: pair, ideal: pair }).optional(),
  }),
  z.object({
    ...base,
    kind: z.literal("text"),
    font: z.string().min(1),
    sizePt: num.positive(),
    minPt: num.positive().optional(),
    lineHeight: num.positive().optional(),
    role: z.string().optional(),
    bind: z.string().optional(),
    flowTo: z.string().optional(),
    maxWords: z.number().int().positive().optional(),
    checkbox: z.boolean().optional(),
    color,
    align: z.enum(["left", "center", "right"]).optional(),
    valign: z.enum(["top", "middle", "bottom"]).optional(),
    placeholder: z.string().optional(),
    maxLines: z.number().int().positive().optional(),
    weight: z.union([z.enum(["normal", "bold"]), num]).optional(),
    letterSpacing: num.optional(),
    uppercase: z.boolean().optional(),
  }),
  z.object({
    ...base,
    kind: z.literal("art"),
    asset: z.string().optional(),
    fill: color.optional(),
    opacity: num.min(0).max(1).optional(),
    role: z.string().optional(),
    gradient: z.enum(["bottom-up", "top-down"]).optional(),
    maxOpacity: num.min(0).max(1).optional(),
    keepClear: z.boolean().optional(),
    stroke: color.optional(),
    label: z.string().optional(),
  }),
]);

const templateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    size: z.enum(["flat_5x7", "flat_4x6", "flat_3_5x5"]),
    orientation: z.enum(["portrait", "landscape"]).default("portrait"),
    background: color.default(CREAM),
    slots: z.array(slotSchema).min(1),
    tags: z.array(z.string()).optional(),
    side: z.enum(["front", "back"]).optional(),
    products: z.array(z.string()).optional(),
    requiresContrastCheck: z.boolean().optional(),
    allowsOverlap: z.boolean().optional(),
    themeId: z.string().optional(),
  })
  .superRefine((t, ctx) => {
    const seen = new Set<string>();
    t.slots.forEach((s, i) => {
      if (seen.has(s.id)) ctx.addIssue({ code: "custom", path: ["slots", i, "id"], message: `duplicate slot id "${s.id}"` });
      seen.add(s.id);
    });
  });

export class TemplateError extends Error {}

/** Parse one template, an array, or { templates: [...] } (unknown extra keys are ignored). */
export function parseTemplates(json: unknown): Template[] {
  const list = Array.isArray(json)
    ? json
    : json && typeof json === "object" && Array.isArray((json as { templates?: unknown }).templates)
      ? (json as { templates: unknown[] }).templates
      : [json];
  return list.map((raw, i) => {
    const r = templateSchema.safeParse(raw);
    if (!r.success) {
      const issue = r.error.issues[0];
      throw new TemplateError(`Template ${i} (${(raw as { id?: string })?.id ?? "no id"}): ${issue.path.join(".")} ${issue.message}`);
    }
    return r.data as Template;
  });
}

export function findTemplate(id: string, list: Template[] = SAMPLE_TEMPLATES): Template | undefined {
  return list.find((t) => t.id === id);
}
