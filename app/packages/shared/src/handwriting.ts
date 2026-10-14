import { z } from "zod";

/**
 * Handwriting and signatures on the inside of a card (docs/PLAN.md "Handwriting and signatures").
 * Fonts are self-hosted from app/public/fonts/handwriting (licences alongside) so the browser preview and the print PDF
 * use the same file. `sizeScale` evens out the very different x-heights of script faces against the body font.
 */
export const HANDWRITING_PRESETS = [
  { id: "kalam", name: "Everyday", file: "kalam.ttf", sizeScale: 1.05, note: "Relaxed, easy to read" },
  { id: "patrick_hand", name: "Neat print", file: "patrick_hand.ttf", sizeScale: 1.1, note: "Tidy block letters" },
  { id: "indie_flower", name: "Bubbly", file: "indie_flower.ttf", sizeScale: 1.05, note: "Round and friendly" },
  { id: "shadows_into_light", name: "Quick note", file: "shadows_into_light.ttf", sizeScale: 1.15, note: "Light and quick" },
  { id: "gochi_hand", name: "Marker", file: "gochi_hand.ttf", sizeScale: 1.1, note: "Felt-tip, bold" },
  { id: "nothing_you_could_do", name: "Loose scrawl", file: "nothing_you_could_do.ttf", sizeScale: 0.95, note: "Fast, slanted" },
  { id: "cedarville_cursive", name: "Looping cursive", file: "cedarville_cursive.ttf", sizeScale: 1.05, note: "Joined-up, gentle" },
  { id: "homemade_apple", name: "Grown-up cursive", file: "homemade_apple.ttf", sizeScale: 0.85, note: "Flowing, a little formal" },
] as const;
export type HandwritingPresetId = (typeof HANDWRITING_PRESETS)[number]["id"];
export const HANDWRITING_PRESET_IDS = HANDWRITING_PRESETS.map((p) => p.id) as unknown as readonly [HandwritingPresetId, ...HandwritingPresetId[]];

/** DocuSign-style "choose a style" signature faces: your name typed in a signature script. */
export const SIGNATURE_FONTS = [
  { id: "mr_dafoe", name: "Bold script", file: "mr_dafoe.ttf" },
  { id: "herr_von_muellerhoff", name: "Fine flourish", file: "herr_von_muellerhoff.ttf" },
  { id: "allura", name: "Classic", file: "allura.ttf" },
  { id: "great_vibes", name: "Formal", file: "great_vibes.ttf" },
] as const;
export type SignatureFontId = (typeof SIGNATURE_FONTS)[number]["id"];
export const SIGNATURE_FONT_IDS = SIGNATURE_FONTS.map((f) => f.id) as unknown as readonly [SignatureFontId, ...SignatureFontId[]];

export const HANDWRITING_FONT_DIR = "/fonts/handwriting";
/** CSS family name for a preset or signature font, as declared in app/styles/handwriting.css. */
export const handwritingFamily = (id: string) => `gh-hw-${id}`;

/** A member's own handwriting, built from a filled-in template sheet: `custom_<id>`. */
export const CUSTOM_STYLE_PREFIX = "custom_";
export const isCustomStyle = (id: string | undefined): id is `custom_${string}` => !!id && id.startsWith(CUSTOM_STYLE_PREFIX);
export const isPresetStyle = (id: string | undefined): id is HandwritingPresetId => !!id && (HANDWRITING_PRESET_IDS as readonly string[]).includes(id);
export const presetById = (id: string) => HANDWRITING_PRESETS.find((p) => p.id === id);
export const signatureFontById = (id: string) => SIGNATURE_FONTS.find((f) => f.id === id);

const StyleRef = z
  .string()
  .max(64)
  .refine((v) => isPresetStyle(v) || /^custom_[a-z0-9]{6,32}$/.test(v), "Pick a handwriting style");

export const CardSignatureSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  /** Typed name in a signature font. Works for guests; screened like the sign-off. */
  z.object({ kind: z.literal("typed"), text: z.string().trim().min(1, "Type your name").max(40), fontId: z.enum(SIGNATURE_FONT_IDS) }),
  /** A signature saved in the account (drawn or uploaded). Ownership is checked on the server whenever it is used. */
  z.object({ kind: z.literal("saved"), signatureId: z.string().regex(/^sg_[a-z0-9]{6,32}$/) }),
]);
export type CardSignature = z.infer<typeof CardSignatureSchema>;

/** How the inside of a card is written. Absent or `typed` keeps today's typeset message. */
export const CardWritingSchema = z.object({
  message: z.enum(["typed", "handwritten"]).default("typed"),
  styleId: StyleRef.optional(),
  signature: CardSignatureSchema.default({ kind: "none" }),
}).superRefine((w, ctx) => {
  if (w.message === "handwritten" && !w.styleId) ctx.addIssue({ code: "custom", path: ["styleId"], message: "Pick a handwriting style" });
});
export type CardWriting = z.infer<typeof CardWritingSchema>;
export type CardWritingInput = z.input<typeof CardWritingSchema>;

/**
 * The inside-message box of the 5x7 card at 300 DPI, as pipeline/src/layout/card.ts lays it out (no inside drawing):
 * 3.85 in wide, 5.55 in tall, or 4.7 in when a signature band is reserved. The preview renders own handwriting at this
 * shape so its line breaks match print; pipeline/tests/layout.test.ts asserts the two agree.
 */
export const CARD_MESSAGE_BOX_PX = { width: 1155, height: 1665, heightWithSignature: 1410 } as const;

/** Characters on the handwriting template sheet, in cell order (row by row). A custom style needs all of them filled. */
export const TEMPLATE_GLYPHS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."0123456789",
  ...".,!?'\"-:;()&@#/+=",
] as const;
/** Characters the template does not cover that a message may still use, drawn from the nearest glyph. */
export const GLYPH_FALLBACKS: Record<string, string> = { "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", "…": "." };
