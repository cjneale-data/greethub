/**
 * Guard lines for the live guest card preview (used by pipeline-runner.mjs). Pure, no I/O.
 * The pipeline's guardLines() reads an empty cast as "no people or animals", which is right for a book page with no cast
 * but wrong for a card: guest briefs rarely list a cast, and a scene like "a bear with soup" must still show the bear.
 */
export type GuestCastBrief = { characters?: { name: string }[]; pet?: { name: string } };
type PagePlanLike = { id: string; kind: "card_front"; scene: string; characters: string[] };

/** Explicit cast from the brief: named characters, then the pet. Usually empty for guests (text-only, no People). */
export function guestCast(brief: GuestCastBrief): string[] {
  return [...(brief.characters ?? []).map((c) => c.name), ...(brief.pet ? [brief.pet.name] : [])].map((n) => n.trim()).filter(Boolean);
}

/** Neutral count line for a card with no explicit cast: the scene text decides who appears. */
export const NEUTRAL_COUNT_LINE =
  "COUNT: show only the people and animals the scene describes, each fully inside the frame. No extra background figures, no duplicates, no cropped or partial bodies.";

/** guardLines() with the brief's real cast; with no cast, its "no people or animals" line is swapped for the neutral one. */
export function guestGuardLines(guardLines: (page: PagePlanLike) => string, brief: GuestCastBrief): string {
  const cast = guestCast(brief);
  const text = guardLines({ id: "front", kind: "card_front", scene: "", characters: cast });
  return text
    .split("\n")
    .filter((line) => !line.startsWith("OUTFIT:")) // guests have no model sheet to copy outfits from
    .map((line) => (!cast.length && line.startsWith("COUNT:") ? NEUTRAL_COUNT_LINE : line))
    .join("\n");
}
