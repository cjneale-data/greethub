/**
 * Prompt hardening shared by every image prompt (cards and books). Appended by code, not by the model, because
 * image models ignore soft requests (same lesson as the Eye Story guard lines). docs/legal/07-ip-safety-design.md.
 */

export const IMAGE_HARDENING_LINES = [
  "ORIGINAL DESIGNS ONLY: no logos, brand marks, trademarks, licensed or franchise characters, mascots, slogans or readable text anywhere in the image. Every character is an original design; do not make any figure resemble an existing cartoon, film, game, toy or comic character.",
  "CLOTHING AND PROPS: plain, original designs. No printed characters, logos, emblems, team crests, brand marks or slogans on clothing, bags, hats, shoes, toys, cups, signs or packaging. Toys and stuffed animals are generic.",
  "REFERENCE PHOTOS: if a reference photo shows a logo, brand mark or licensed-character print on clothing, redraw that clothing plain, in a solid colour with no print.",
];

export type OutputProblem = "protected_character" | "logo" | "slogan" | "licensed_merch" | "lookalike_risk";

const PROBLEM_TEXT: Record<OutputProblem, string> = {
  protected_character: "A figure in the previous attempt looked like an existing character{guess}. Redesign every character from scratch: different hair or fur colour and style, different outfit shape and palette, different props and companions, and a different overall silhouette.",
  logo: "The previous attempt showed a logo or brand mark. Remove it completely; every surface (clothing, objects, backgrounds) is plain.",
  slogan: "The previous attempt showed a slogan, trademark or readable phrase. Remove all words and symbols.",
  licensed_merch: "The previous attempt showed licensed-character merchandise or a printed character on clothing or objects. Draw plain, solid-colour clothing and generic objects.",
  lookalike_risk: "The previous attempt risked resembling a well-known character. Change the signature combination of hair colour and style, costume shape and palette, props and sidekicks, and make the silhouette clearly different.",
};

/** Extra prompt text for the single automatic re-roll: names the specific problem. */
export function rerollAddendum(problems: OutputProblem[], guess?: string | null): string {
  const lines = problems.map((p) => PROBLEM_TEXT[p].replace("{guess}", guess ? ` (${guess.slice(0, 60)})` : ""));
  return `FIX THIS (second attempt): ${lines.join(" ")} Keep the scene, composition and each cast member's identity from the model sheet where it is an original design, but never keep any element that resembles an existing franchise.`;
}

/** Friendly copy when a page is blocked after its one re-roll. Never claims legal safety. */
export const PAGE_BLOCKED_MESSAGE = "This picture kept coming out too close to something that already exists, so we stopped it. Want to try a different direction for this page?";
