import type { StyleId } from "@greethub/shared";

export type StyleProduct = "book" | "card";
export type AgeBand = "0-3" | "4-7" | "8-10";
export type StyleTone = "silly" | "tender" | "adventurous" | "elegant" | "bold";

export type StyleCategory = { id: string; name: string; blurb: string; order: number };

/** Slim record for the picker. Client-safe: no prompts, no franchise phrases. */
export type PickerStyle = {
  id: StyleId;
  name: string;
  category: string;
  status: "stable" | "beta";
  products: StyleProduct[];
  ageBands: AgeBand[];
  occasions: string[];
  tones: StyleTone[];
  description: string;
  whyThisOne: string;
  /** Hex swatches. */
  swatches: string[];
  consistency: { bookRating: number; cardRating: number };
  popularity: "high" | "medium" | "niche" | "emerging" | "not_found";
  thumbnail: { file: string | null; rendered: boolean };
};

/** Full record, mirrors docs/design/style-library.schema.json. Server and tests only. */
export type StyleEntry = {
  id: StyleId;
  name: string;
  category: string;
  status: "stable" | "beta";
  legacyIds: string[];
  products: StyleProduct[];
  ageBands: AgeBand[];
  occasions: string[];
  tones: StyleTone[];
  description: string;
  whyThisOne: string;
  popularity: { rating: "high" | "medium" | "niche" | "emerging" | "not_found"; sources: string[]; summary: string };
  look: { medium: string; technique: string; line: string; palette: string; composition: string; mood: string; era: string };
  styleString: string;
  avoid: string[];
  swatches: { hex: string; name: string }[];
  consistency: { bookRating: number; cardRating: number; notes: string; tips: string[]; renderNotes?: string };
  photoReference: string;
  card?: { typography: { display: string[]; body: string[]; notes: string }; layout: string; textSafeZone: string };
  print: { bleed: string; inkCoverage: string; foilAndSpot: string };
  bestFor: string[];
  avoidFor: string[];
  tags: string[];
  synonyms: string[];
  /** Customer phrases (franchise names, "like a ... movie") that map to this generic style. Matched in code, never put in a prompt. */
  ipSafeAliases: string[];
  risks: { ip: string; uncanny: string; age: string };
  brandKit: { fonts: { display: string; body: string }; textColor: string; paperColor: string; accentColor: string };
  thumbnail: { file: string | null; bookFile?: string | null; rendered: boolean; note: string };
};
