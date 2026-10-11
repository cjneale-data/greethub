/**
 * IP-safety types (docs/legal/07-ip-safety-design.md). Pure types, safe on client and server.
 *
 * Product rule: keep the customer's IDEA (theme, mood, relationships, setting), never the protected identity.
 * Output is "original characters inspired by your idea". Nothing here claims the result is legally safe.
 */

export type DetectedKind = "character" | "brand" | "slogan" | "person" | "franchise";
export type IpVerdict = "ok" | "rewritten" | "blocked";

/** Where the text came from. `printed` fields end up as readable text on a card or book page. */
export type IpField =
  | "chat"
  | "card_message"
  | "card_idea"
  | "story_idea"
  | "character_note"
  | "photo_caption"
  | "reroll_note"
  | "brief_field"
  | "story_text"
  | "image_prompt";

/** Fields whose text is printed for the reader (a slogan there is a different risk from a slogan in an idea). */
export const PRINTED_FIELDS: readonly IpField[] = ["card_message", "story_text"];

/** Event surface names in docs/data/tracking-plan.json (ip_input_rewritten.surface). */
export const EVENT_SURFACE: Record<IpField, string> = {
  chat: "chat",
  card_message: "card_message",
  card_idea: "story_idea",
  story_idea: "story_idea",
  character_note: "character_note",
  photo_caption: "photo_caption",
  reroll_note: "reroll_note",
  brief_field: "brief_field",
  story_text: "story_text",
  image_prompt: "image_prompt",
};

export type IpInput = {
  text: string;
  field: IpField;
  /** Names the customer gave for real people in this order (recipient, characters, pet). Never treated as protected on their own. */
  knownNames?: string[];
  /** Earlier customer turns, for multi-step attempts. Live classifier only. */
  history?: string[];
};

export type Detected = {
  kind: DetectedKind;
  /** The customer's own words that matched. Never put this in an analytics event. */
  original: string;
  confidence: number;
};

export type IpResult = {
  verdict: IpVerdict;
  /** Text to use downstream. Equals the (cleaned) input when verdict is ok. Empty when blocked. */
  safeText: string;
  /** Friendly one-liner for the customer, or "" when nothing changed. */
  userNote: string;
  detected: Detected[];
  /** Theme elements that survived, e.g. "two sisters", "icy winter magic". */
  themeKept: string[];
  engine: "rules" | "model";
  /** True when the model call failed and only the free rules ran. */
  degraded?: boolean;
  /** A generic style offered because the customer asked for a franchise look (see style-offer.ts). */
  styleOffer?: { styleId: string; styleName: string; note: string };
};

export interface IpSafetyService {
  readonly name: "mock" | "live";
  screen(input: IpInput): Promise<IpResult>;
  /** One round trip for several fields (the live service sends one model call). */
  screenBatch(inputs: IpInput[]): Promise<IpResult[]>;
}

export const okResult = (text: string, engine: IpResult["engine"] = "rules"): IpResult => ({
  verdict: "ok",
  safeText: text,
  userNote: "",
  detected: [],
  themeKept: [],
  engine,
});
