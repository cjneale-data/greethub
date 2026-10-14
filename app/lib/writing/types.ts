/** Glyph box inside a custom style's normalized sheet, in sheet pixels. `baseline` is the baseline's y offset from `y`. */
export type GlyphBox = { x: number; y: number; w: number; h: number; baseline: number };

/** A member's own handwriting, built from a filled-in template sheet. The cleaned sheet is one private PNG. */
export type CustomStyle = {
  id: `custom_${string}`;
  name: string;
  /** Private storage path of the cleaned, ink-only sheet (transparent PNG). */
  sheetPath: string;
  /** Writing-box height in sheet pixels: the "em" every glyph is scaled from. */
  em: number;
  glyphs: Record<string, GlyphBox>;
  /** Template characters left blank or unreadable. Rendering falls back to the other case, then skips. */
  missing: string[];
  createdAt: string;
};

export type SignatureRec = {
  id: `sg_${string}`;
  kind: "drawn" | "uploaded" | "typed";
  label: string;
  /** Drawn and uploaded: private storage path of the ink-only transparent PNG. */
  path?: string;
  width?: number;
  height?: number;
  /** Typed: the name, set in a signature font at print time. */
  text?: string;
  fontId?: string;
  createdAt: string;
};

/** One document per member (id = user id). */
export type WritingProfile = {
  defaultStyleId?: string;
  defaultSignatureId?: string;
  /** Start every new card with the default handwriting and signature (like an adopted DocuSign signature). */
  applyToNewCards?: boolean;
  styles: CustomStyle[];
  signatures: SignatureRec[];
};

export const MAX_CUSTOM_STYLES = 3;
export const MAX_SIGNATURES = 5;
