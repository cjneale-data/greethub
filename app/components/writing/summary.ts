import { presetById, signatureFontById, type CardWritingInput } from "@greethub/shared";

/** One line for the brief card: "Everyday handwriting · typed signature". Empty when the card is typed with no signature. */
export function writingSummary(w?: CardWritingInput): string {
  if (!w) return "";
  const parts: string[] = [];
  if (w.message === "handwritten" && w.styleId) parts.push(`${presetById(w.styleId)?.name ?? "Your own"} handwriting`);
  const s = w.signature;
  if (s?.kind === "typed") parts.push(`signed "${s.text}" (${signatureFontById(s.fontId)?.name ?? "script"})`);
  if (s?.kind === "saved") parts.push("your saved signature");
  return parts.join(" · ");
}
