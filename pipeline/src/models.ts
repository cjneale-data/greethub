export const TEXT_MODEL = "anthropic/claude-sonnet-5.5"; // art director: vision + careful instruction following

export type ImageSize = "1K" | "2K" | "4K";
const RANK: Record<ImageSize, number> = { "1K": 1, "2K": 2, "4K": 3 };

/** Image models in order of preference with the largest size each supports on OpenRouter.
 *  Nano Banana was often 429 upstream on the Eye Story, so the chain falls through. */
export const IMAGE_MODELS: { id: string; maxSize: ImageSize }[] = [
  { id: "google/gemini-nano-banana-2.1", maxSize: "4K" },
  { id: "google/gemini-3.1-flash-image", maxSize: "4K" },
  { id: "google/gemini-3-pro-image", maxSize: "2K" },
];

export function capSize(requested: ImageSize, max: ImageSize): ImageSize {
  return RANK[requested] <= RANK[max] ? requested : max;
}

/** Fallback price table used ONLY when a response carries no usage.cost. USD. Values are rough and flagged costSource=computed. */
export const FALLBACK_PRICES = {
  imagePerRender: { "1K": 0.07, "2K": 0.1, "4K": 0.15 } as Record<ImageSize, number>,
  textPerMTokIn: 3,
  textPerMTokOut: 15,
};

/** Output pixel width of each size for a 1:1 render (long edge for others is similar). */
export const SIZE_PX: Record<ImageSize, number> = { "1K": 1024, "2K": 2048, "4K": 4096 };
