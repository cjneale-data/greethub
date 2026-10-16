import { STOCK_LIMITS } from "./config";
import type { FitResult } from "./types";

/** Budget check for the inside message: characters, lines, longest word. The UI shows `charsLeft`; the print layout (step 3) is the final judge. */
export function checkFit(message: string, limits: { maxChars: number; maxLines: number; maxWordChars: number } = STOCK_LIMITS): FitResult {
  const text = message.replace(/\r\n/g, "\n").trim();
  const chars = [...text].length;
  const lines = text ? text.split("\n").length : 0;
  const base = { chars, maxChars: limits.maxChars, charsLeft: limits.maxChars - chars, lines, maxLines: limits.maxLines };
  if (!text) return { ...base, fits: false, reason: "empty" };
  if (chars > limits.maxChars) return { ...base, fits: false, reason: "too_long" };
  if (lines > limits.maxLines) return { ...base, fits: false, reason: "too_many_lines" };
  if (text.split(/\s+/).some((w) => [...w].length > limits.maxWordChars)) return { ...base, fits: false, reason: "word_too_long" };
  return { ...base, fits: true };
}

/** Plain, no-blame copy for each failure (docs/cx/stock-cards-ux.md section 7). */
export const fitMessage = (r: FitResult): string | null => {
  switch (r.reason) {
    case "empty":
      return "Add a few words for the inside.";
    case "too_long":
      return `That's a bit long for the space. We'll fit up to ${r.maxChars} characters. Trim a few words?`;
    case "too_many_lines":
      return "That's a lot of short lines. Try fewer line breaks.";
    case "word_too_long":
      return "One of those words is too long to fit. Check for a missing space.";
    default:
      return null;
  }
};
