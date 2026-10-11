import type { CreationBrief } from "@greethub/shared";
import type { OpenRouterClient } from "./openrouter.js";
import type { ImageSize } from "./models.js";
import type { IpSafetyService } from "../../app/lib/safety/types.js";

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
  /** IP-safety service for screening model-written text. Default: the free rules (mock). The app worker injects the live one. */
  safety?: IpSafetyService;
};

export type RenderResult = {
  id: string;
  file: string;
  model: string;
  size: ImageSize;
  attempts: number;
  qa: QaVerdict | null;
  /** True when the IP check still failed after the one automatic re-roll. The file has been deleted and must not be used. */
  ipBlocked?: boolean;
  ipFlags?: string[];
};

export type QaVerdict = {
  pass: boolean;
  characterCount?: number;
  expectedCount: number;
  whiteBorder: boolean;
  textInImage?: boolean;
  /** Output IP check (docs/legal/07). Absent when vision QA was skipped. */
  ip?: IpVisionResult;
  notes: string;
  source: "local+vision" | "local" | "skipped";
};

export type IpVisionResult = {
  /** Best guess at a protected character the picture resembles, or null. */
  recognizableProtectedCharacter: string | null;
  logoOrBrandMark: boolean;
  slogan: boolean;
  licensedMerchOnClothing: boolean;
  /** 0 = clearly original, 10 = clearly a known character. */
  lookalikeRisk: number;
  /** Closed list of failed checks (empty = IP check passed). */
  flags: ("protected_character" | "logo" | "slogan" | "licensed_merch" | "lookalike_risk")[];
};
