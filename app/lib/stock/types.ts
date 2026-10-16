import type { CardWriting } from "@greethub/shared";

/**
 * Ready Cards (stock cards): pre-made 5x7 greeting cards the customer only edits the inside words of. Customer copy
 * calls them "Ready-made cards" (docs/cx/stock-cards-ux.md); "stock" is the code name. KEEP THESE TYPES STABLE: the
 * card engineer, the UI and the agent all build on them (docs/cto/stock-cards-architecture.md section 2).
 */
export type StockOccasion = string; // open set; the catalog owns the list (counts.byOccasion)
export type StockFormat = "mailed" | "digital";
export type StockMailTo = "buyer" | "recipient";

export type StockCard = {
  id: string;
  title: string;
  occasion: StockOccasion;
  tone: string;
  styleId: string;
  altText: string;
  /** Pre-written inside text; always within the fit limit. */
  defaultMessage: string;
  /** 2-3 alternate lines, one tap. Optional. */
  messageSuggestions?: string[];
  /** preview = public site path (placeholder until art is rendered). print = storage key, never a public URL. */
  frontArt: { preview: string; print: string };
  insideLayout: "message" | "message_art";
  insideArt?: string;
  /** Prompt for the design pipeline; not shown to customers. */
  frontArtBrief?: string;
  status: "live" | "hidden";
  addedAt: string;
  /** IP-safety gate (docs/legal/07). Only reviewed cards sell outside mock mode. */
  ipReviewed: boolean;
};

/** What the customer changes on a card. */
export type StockCustomization = {
  message: string;
  /** Typed sign-off line ("Love, Sam"). Name-like: only the sensitive check applies. */
  signOff?: string;
  /** Same schema resolveCardWriting takes. Presets and typed signature are free; own handwriting needs Plus. */
  writing?: CardWriting;
};

export type StockCreationStatus = "draft" | "ready" | "ordered";

/** One customised card (Docs collection `stock_creations`). Its id is the cart `creationId`. Contains customer text: never log it. */
export type StockCreation = {
  id: string; // sc_<id>
  userId: string;
  stockId: string;
  message: string;
  writing?: CardWriting;
  signOff?: string;
  status: StockCreationStatus;
  /** Set when the print PDF exists (build step 3). */
  printKey?: string;
  /** Estimate from the character/line budget now; layoutCard's answer replaces it at render time (step 3). */
  messageFitted: boolean;
  screening: { ok: boolean; at: string };
  createdAt: string;
  updatedAt: string;
};

export type FitResult = {
  fits: boolean;
  chars: number;
  maxChars: number;
  charsLeft: number;
  lines: number;
  maxLines: number;
  reason?: "too_long" | "too_many_lines" | "word_too_long" | "empty";
};
