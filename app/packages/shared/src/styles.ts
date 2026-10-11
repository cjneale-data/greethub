import { LEGACY_STYLE_MAP, STYLE_IDS, STYLE_NAMES, STYLE_STRINGS, type LegacyStyleId, type StyleId } from "./styles.generated";

/**
 * Art styles. The data (ids, names, style strings) is generated from docs/design/style-library.json by
 * docs/design/tools/build-knowledge.mjs. `style` strings are passed to the image model; the pipeline appends the
 * shared page rules and the IP-safety hardening lines separately.
 *
 * Backward compatibility: the first shared schema used six ids (watercolor, storybook_ink, paper_cut, bold_flat,
 * crayon, storybook_3d) and the CMO templates used five preset ids (soft_watercolor, bold_pop, cozy_gouache,
 * paper_collage, ink_wash). All still validate and resolve to a canonical id (LEGACY_STYLE_MAP).
 */
export { STYLE_IDS, STYLE_NAMES, STYLE_STRINGS, LEGACY_STYLE_MAP };
export type { StyleId, LegacyStyleId };

export type ArtStyleId = StyleId;
export const ART_STYLE_IDS = STYLE_IDS as unknown as [ArtStyleId, ...ArtStyleId[]];
export const LEGACY_ART_STYLE_IDS = Object.keys(LEGACY_STYLE_MAP) as LegacyStyleId[];
/** Every id a stored draft or an old client may still send. */
export const ART_STYLE_INPUT_IDS = [...STYLE_IDS, ...LEGACY_ART_STYLE_IDS] as unknown as [string, ...string[]];

/** Canonical id for a current or legacy id, or undefined when unknown. */
export function resolveArtStyleId(id: string | undefined | null): ArtStyleId | undefined {
  if (!id) return undefined;
  if ((STYLE_IDS as readonly string[]).includes(id)) return id as ArtStyleId;
  return (LEGACY_STYLE_MAP as Record<string, ArtStyleId>)[id];
}

/** The style string for an id (current or legacy). Throws on an unknown id so a typo never silently renders unstyled. */
export function styleStringFor(id: string): string {
  const canon = resolveArtStyleId(id);
  if (!canon) throw new Error(`Unknown art style: ${id}`);
  return STYLE_STRINGS[canon];
}

/** Compatibility view used by older code: label plus the style string. */
export const ART_STYLES = Object.fromEntries(STYLE_IDS.map((id) => [id, { label: STYLE_NAMES[id], prompt: STYLE_STRINGS[id] }])) as Record<ArtStyleId, { label: string; prompt: string }>;
