import type { CreationBrief } from "@greethub/shared";
import type { OpenRouterClient } from "./openrouter.js";
import type { ImageSize } from "./models.js";

/** Source of reference photos. Production: Supabase private storage via signed URLs. Tests/CLI: a local directory. */
export interface PhotoStore {
  get(photoId: string): Promise<Buffer>;
}

export type PageKind = "cover" | "spread" | "back" | "card_front" | "card_inside";

/** One illustrated page. `characters` lists who is visible, which drives the exact-count line. */
export type PagePlan = {
  id: string;
  kind: PageKind;
  scene: string;
  characters: string[];
  /** Printed text that goes on the paired text page (book) or inside the card. Never rendered in the image. */
  text?: string;
  /** Extra headroom request, e.g. cover title sky. */
  textZone?: string;
};

export type Ctx = {
  client: OpenRouterClient;
  workDir: string;
  photos: PhotoStore;
  brief: CreationBrief;
  imageSize: ImageSize;
  log: (m: string) => void;
};

export type RenderResult = {
  id: string;
  file: string;
  model: string;
  size: ImageSize;
  attempts: number;
  qa: QaVerdict | null;
};

export type QaVerdict = {
  pass: boolean;
  characterCount?: number;
  expectedCount: number;
  whiteBorder: boolean;
  textInImage?: boolean;
  notes: string;
  source: "local+vision" | "local" | "skipped";
};
