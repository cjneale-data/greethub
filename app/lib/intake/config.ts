/**
 * Server-only runtime config for the card creator. The OpenRouter key is read from env at call time,
 * passed straight to the request header, and never logged, returned or stored.
 */
export const TEXT_MODEL = "anthropic/claude-sonnet-5.5";

export const openRouterKey = (): string | undefined => process.env.OPENROUTER_API_KEY?.trim() || undefined;

/** Mock mode: GREETHUB_MOCK_AI=1 forces it; otherwise live whenever an OpenRouter key is set (=0 changes nothing without one). */
export function isMockAi(): boolean {
  const flag = process.env.GREETHUB_MOCK_AI?.trim();
  if (flag === "1" || flag?.toLowerCase() === "true") return true;
  // Same rule as lib/book/config.ts isMockMode. Unset used to mean mock even with a key, so production stayed on
  // placeholder art until GREETHUB_MOCK_AI=0 was set explicitly.
  return !openRouterKey();
}

export const mockDelayMs = (): number => {
  const v = Number(process.env.GREETHUB_MOCK_DELAY_MS);
  return Number.isFinite(v) && v >= 0 && process.env.GREETHUB_MOCK_DELAY_MS ? v : 2500;
};

export const dailySpendCapUsd = (): number => Number(process.env.GENERATION_DAILY_SPEND_CAP_USD) || 25;

/** Estimated cost of one guest preview (1K, one render, no sheet), from docs/cto/pipeline-costs.md. */
export const GUEST_PREVIEW_COST_ESTIMATE_USD = 0.07;

/** Redact anything key-shaped before it can reach a log line. */
export const redact = (s: string): string => s.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");
