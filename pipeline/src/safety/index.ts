/**
 * Pipeline-side IP safety: the shared service (app/lib/safety, pure TypeScript, no Next.js imports) wired to the
 * pipeline's OpenRouter client so every screening call lands in the cost ledger, plus the last-mile prompt sanitiser.
 */
import { createLiveIpSafety, createMockIpSafety, type ModelCaller } from "../../../app/lib/safety/service.js";
import { fastScreen } from "../../../app/lib/safety/fastpass.js";
import type { IpField, IpInput, IpResult, IpSafetyService } from "../../../app/lib/safety/types.js";
import { logInputResult } from "../../../app/lib/safety/events.js";
import type { OpenRouterClient } from "../openrouter.js";

export { createLiveIpSafety, createMockIpSafety, fastScreen };
export type { IpSafetyService, IpInput, IpResult, IpField };
export { IMAGE_HARDENING_LINES, rerollAddendum, PAGE_BLOCKED_MESSAGE, type OutputProblem } from "../../../app/lib/safety/hardening.js";
export { logOutputFlagged, logOutputRerolled, type OutputFlag } from "../../../app/lib/safety/events.js";
export * from "./thresholds.js";

/** Thrown when text cannot be made safe (for example a real public figure in story text). `userMessage` is customer-facing. */
export class IpBlockedError extends Error {
  constructor(public userMessage: string) {
    super("ip_blocked");
  }
}

/** Live service whose calls go through the pipeline client, so they are recorded in the cost ledger (stage "ip_safety"). */
export function pipelineIpSafety(client: OpenRouterClient): IpSafetyService {
  const caller: ModelCaller = async ({ system, user, label }) =>
    client.text({ content: [{ type: "text", text: user }], system, stage: "ip_safety", label });
  return createLiveIpSafety(caller);
}

/** Screen several texts and log data events. Throws IpBlockedError if any is blocked. */
export async function screenAll(svc: IpSafetyService | undefined, inputs: IpInput[]): Promise<IpResult[]> {
  const s = svc ?? createMockIpSafety();
  const out = await s.screenBatch(inputs);
  out.forEach((r, i) => logInputResult(inputs[i].field, inputs[i].text, r, "worker"));
  const bad = out.find((r) => r.verdict === "blocked");
  if (bad) throw new IpBlockedError(bad.userNote || "That needs a different idea. What would you like instead?");
  return out;
}

/**
 * Last-mile sanitiser for the final text of an image prompt (free rules only; the model screen already ran upstream).
 * Cast names are passed as known names so a real child called Elsa is never rewritten.
 * Blocked (public figure) text throws; rewritten text is returned with the design swapped in.
 */
export function sanitizeImagePrompt(text: string, knownNames: string[] = []): { text: string; changed: boolean } {
  const r = fastScreen({ text, field: "image_prompt", knownNames });
  if (r.verdict === "blocked") throw new IpBlockedError(r.userNote);
  logInputResult("image_prompt", text, r, "worker");
  return { text: r.verdict === "rewritten" ? r.safeText : text, changed: r.verdict === "rewritten" };
}

/** Free-rules rewrite of one customer text (second layer behind the app-level screen). Throws IpBlockedError for public figures. */
export function fastText(text: string, field: IpField, knownNames: string[] = []): string {
  const r = fastScreen({ text, field, knownNames });
  if (r.verdict === "blocked") throw new IpBlockedError(r.userNote);
  return r.verdict === "rewritten" ? r.safeText : text;
}
