/** Find a style the customer named in plain words ("watercolor", "paper collage", "bold cartoon"). Client-safe: slim data only. */
import type { ArtStyleId } from "@greethub/shared";
import { PICKER_STYLES } from "./picker.generated";

const NAME_WORDS: Record<string, string[]> = {
  watercolor_wash: ["watercolor", "watercolour", "soft watercolor"],
  ink_wash: ["ink and wash", "ink wash", "ink"],
  pastel_chalk: ["pastel", "chalk"],
  cozy_gouache: ["gouache", "cozy", "storybook"],
  vintage_storybook: ["vintage"],
  moonlit_night: ["moonlit", "night"],
  bold_cartoon_pop: ["bold cartoon", "cartoon pop", "cartoon", "bold"],
  flat_vector_friendly: ["flat graphic", "flat", "vector"],
  comic_panel: ["comic"],
  paper_cut_collage: ["paper", "collage", "paper cut"],
  felt_thread: ["felt", "thread"],
  clay_stopmotion: ["clay"],
  midcentury_shapes: ["mid century", "midcentury", "geometric shapes"],
  block_print: ["block print", "linocut"],
  crayon_pencil: ["crayon", "pencil"],
  wonky_ink_cartoon: ["wonky"],
  soft_3d_animated: ["3d"],
  anime_inspired: ["anime"],
  painterly_realism: ["painted portrait", "oil painting"],
  cinematic_photoreal: ["photo look", "photoreal"],
  minimal_line_art: ["line art", "minimal"],
  botanical_gouache: ["botanical", "floral"],
  hand_lettered_type: ["lettering", "handwritten"],
  foil_luxe: ["gold", "foil"],
  deco_geometric: ["deco", "geometric"],
  maximalist_pattern: ["pattern", "maximalist"],
};

/** Exact style name (chip label) or a clear keyword; the longest keyword wins. */
export function findStyleInText(text: string): ArtStyleId | undefined {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  const exact = PICKER_STYLES.find((s) => ` ${s.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} ` === t);
  if (exact) return exact.id;
  let best: { id: string; len: number } | undefined;
  for (const s of PICKER_STYLES) {
    if (s.status !== "stable") continue;
    for (const w of NAME_WORDS[s.id] ?? []) {
      if (t.includes(` ${w} `) && (!best || w.length > best.len)) best = { id: s.id, len: w.length };
    }
  }
  return best?.id as ArtStyleId | undefined;
}
