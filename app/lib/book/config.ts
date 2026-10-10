import os from "node:os";
import path from "node:path";
import { DEFAULT_PROJECT_SPEND_CAP_USD } from "./constants";

/**
 * Mock mode (placeholder art, canned story, no network, free):
 * GREETHUB_MOCK_AI=1 forces it, =0 forces live, and unset means mock unless an OpenRouter key exists.
 */
export function isMockMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.GREETHUB_MOCK_AI;
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return !env.OPENROUTER_API_KEY;
}

/** Private data (projects, jobs, photos, renders). Outside the repo on purpose: family photos never land in git. */
export function dataDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.GREETHUB_DATA_DIR || path.join(os.tmpdir(), "greethub-data");
}

export const projectSpendCapUsd = (env: NodeJS.ProcessEnv = process.env) =>
  Number(env.GREETHUB_BOOK_SPEND_CAP_USD) > 0 ? Number(env.GREETHUB_BOOK_SPEND_CAP_USD) : DEFAULT_PROJECT_SPEND_CAP_USD;

/** Live image size. 2K is the recommended print size; the budgeted wiring test uses 1K. */
export const liveImageSize = (env: NodeJS.ProcessEnv = process.env): "1K" | "2K" | "4K" =>
  (["1K", "2K", "4K"] as const).find((s) => s === env.GREETHUB_BOOK_IMAGE_SIZE) ?? "2K";

/** Test-only: shrink the book to this many spreads (cover + N art pages). Unset means the real page count. */
export const spreadsOverride = (env: NodeJS.ProcessEnv = process.env): number | undefined => {
  const n = Number(env.GREETHUB_BOOK_MAX_SPREADS);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const mockDelayMs = (env: NodeJS.ProcessEnv = process.env): number => {
  const n = Number(env.GREETHUB_MOCK_DELAY_MS);
  return Number.isFinite(n) && n >= 0 && env.GREETHUB_MOCK_DELAY_MS !== undefined ? n : 600;
};

/** Dev sign-in cookie works only outside production, and only while the auth adapter is still the stub. */
export const devSigninAllowed = (env: NodeJS.ProcessEnv = process.env): boolean =>
  env.NODE_ENV !== "production" || env.GREETHUB_ALLOW_DEV_SIGNIN === "1";
