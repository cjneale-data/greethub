import { HANDWRITING_PRESETS } from "@greethub/shared";
import { parseTemplates } from "./templates";
import { sizeFromDesignId } from "./sizes";
import type { ArtSlot, Slot, Template } from "./types";

/**
 * Loader for docs/design/photo-events-templates.json (Head of Design). Layouts name text roles; a theme maps roles
 * to text styles and supplies the palette, so one layout renders in many themes. `designTemplate()` resolves one
 * layout in one theme into the engine's Template (inches from the trim top-left, bleed as negative coordinates).
 */

export type DesignTextStyle = {
  id: string; font: string; weight: number; sizePt: number; minPt: number; lineHeight: number; tracking: number;
  case: "as_typed" | "upper"; defaultHandwriting?: string; applySizeScale?: boolean; proposedFont?: boolean;
  fallback?: { font: string; weight: number; sizePt: number; minPt: number };
};
type Palette = { background: string; ink: string; accent: string; scrim?: string };
export type DesignTheme = { id: string; name: string; palette: Palette; typography: Record<string, string>; fronts: string[]; backs: string[] };
type RawSlot = Record<string, unknown> & { id: string; kind: "photo" | "text" | "art"; x: number; y: number; w: number; h: number };
export type DesignLayout = {
  id: string; name: string; size: string; side: "front" | "back"; products?: string[]; slots: RawSlot[];
  requiresContrastCheck?: boolean; allowsOverlap?: boolean;
};
export type DesignSpec = {
  version: string; layouts: DesignLayout[]; textStyles: DesignTextStyle[]; themes: DesignTheme[];
  suites: { id: string; palette: Palette; typography: Record<string, string> }[];
};

export function loadDesignSpec(json: unknown): DesignSpec {
  const j = json as Partial<DesignSpec> | null;
  if (!j || !Array.isArray(j.layouts) || !Array.isArray(j.textStyles) || !Array.isArray(j.themes)) throw new Error("Not a photo-events template spec");
  return { version: String(j.version ?? ""), layouts: j.layouts, textStyles: j.textStyles, themes: j.themes, suites: Array.isArray(j.suites) ? j.suites : [] };
}

const ART_PAINT: Record<string, (p: Palette) => { fill?: string; opacity?: number; stroke?: string }> = {
  pattern: (p) => ({ fill: p.accent, opacity: 0.16 }),
  panel: (p) => ({ fill: p.background, opacity: 0.94, stroke: p.accent }),
  scrim: (p) => ({ fill: p.scrim ?? "#2B1E18" }),
  polaroid_frame: () => ({ fill: "#FFFFFF", stroke: "#E3DCD2" }),
  border: (p) => ({ stroke: p.accent }),
  rule: (p) => ({ fill: p.ink, opacity: 0.4 }),
  writein_rule: (p) => ({ stroke: p.ink }),
};

/** A theme id, or a suite id (suites have a palette and typography but no layout list). */
function themeFor(spec: DesignSpec, themeId: string | undefined, layoutId: string): DesignTheme {
  const found = spec.themes.find((t) => t.id === themeId);
  if (found) return found;
  const suite = themeId ? spec.suites.find((s) => s.id === themeId) : undefined;
  if (suite) return { id: suite.id, name: suite.id, palette: suite.palette, typography: suite.typography, fronts: [], backs: [] };
  return spec.themes.find((t) => t.fronts.includes(layoutId) || t.backs.includes(layoutId)) ?? spec.themes[0];
}

export function designTemplate(spec: DesignSpec, layoutId: string, themeId?: string): Template {
  const layout = spec.layouts.find((l) => l.id === layoutId);
  if (!layout) throw new Error(`Unknown layout: ${layoutId}`);
  const theme = themeFor(spec, themeId, layoutId);
  const size = sizeFromDesignId(layout.size);
  const styleOf = (role: string) => {
    const st = spec.textStyles.find((s) => s.id === theme.typography[role]);
    if (!st) throw new Error(`Theme ${theme.id} has no text style for role "${role}"`);
    // A proposed font that is not shipped yet uses its Figtree stand-in (design doc section 3).
    return st.proposedFont && st.fallback ? { ...st, ...st.fallback } : st;
  };
  const slots = layout.slots.map((raw): Slot => {
    const r = raw as RawSlot & { textStyle?: string; corner?: number; role?: string; align?: "left" | "center" | "right" };
    const common = {
      id: r.id, x: r.x, y: r.y, w: r.w, h: r.h,
      ...(r.rotate !== undefined ? { rotate: r.rotate as number } : {}),
      ...(r.pivot ? { pivot: r.pivot as { x: number; y: number } } : {}),
      ...(r.z !== undefined ? { z: r.z as number } : {}),
      ...(r.optional ? { optional: true } : {}),
    };
    if (r.kind === "photo") {
      return {
        ...common, kind: "photo",
        ...(r.corner ? { radius: r.corner } : {}),
        ...(r.mask ? { mask: r.mask as "circle" } : {}),
        ...(r.faceZone ? { faceZone: r.faceZone as "upper" | "center" } : {}),
        ...(r.hero ? { hero: true } : {}),
        ...(r.minPixels ? { minPixels: r.minPixels as never } : {}),
      };
    }
    if (r.kind === "text") {
      const st = styleOf(r.textStyle as string);
      let font = st.font, scale = 1;
      if (font === "hw:user") font = `hw:${(st as DesignTextStyle).defaultHandwriting ?? "kalam"}`;
      if ((st as DesignTextStyle).applySizeScale && font.startsWith("hw:")) scale = HANDWRITING_PRESETS.find((p) => `hw:${p.id}` === font)?.sizeScale ?? 1;
      return {
        ...common, kind: "text", font, sizePt: Math.round(st.sizePt * scale * 100) / 100, minPt: st.minPt,
        lineHeight: (st as DesignTextStyle).lineHeight, letterSpacing: (st as DesignTextStyle).tracking || undefined, weight: st.weight,
        uppercase: (st as DesignTextStyle).case === "upper" || undefined, color: theme.palette.ink, align: r.align ?? "left", valign: "top",
        role: r.textStyle as string,
        ...(r.bind ? { bind: r.bind as string } : {}), ...(r.flowTo ? { flowTo: r.flowTo as string } : {}),
        ...(r.maxWords ? { maxWords: r.maxWords as number } : {}), ...(r.checkbox ? { checkbox: true } : {}),
      };
    }
    const paint = (r.role && ART_PAINT[r.role]?.(theme.palette)) || {};
    const art: ArtSlot = {
      ...common, kind: "art", ...(r.role ? { role: r.role } : {}), ...paint,
      ...(r.gradient ? { gradient: r.gradient as "bottom-up" } : {}),
      ...(r.maxOpacity !== undefined ? { maxOpacity: r.maxOpacity as number } : {}),
      ...(r.keepClear ? { keepClear: true } : {}), ...(r.label ? { label: r.label as string } : {}),
    };
    return art;
  });
  const t: Template = {
    id: layout.id, name: layout.name, size: size.id, orientation: size.orientation, background: theme.palette.background, slots, side: layout.side,
    ...(layout.products ? { products: layout.products } : {}),
    ...(layout.requiresContrastCheck ? { requiresContrastCheck: true } : {}),
    ...(layout.allowsOverlap ? { allowsOverlap: true } : {}),
    themeId: theme.id,
  };
  return parseTemplates(t)[0];
}

/** Every layout resolved in its default theme, or in `themeId` when given. */
export function designTemplates(spec: DesignSpec, themeId?: string): Template[] {
  return spec.layouts.map((l) => designTemplate(spec, l.id, themeId));
}
