import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Per-agent API keys for headless agents (docs/integrations/02 section 4). Format ghk_live_<43 base64url chars> / ghk_test_...
 * Shown once, stored as an HMAC-SHA256 hash (keyed with AGENT_KEY_PEPPER) plus a short lookup prefix. Never log a key.
 * TODO (AGT-010 or AGT-003): the ApiKeyStore backed by the agent_keys table, and the web UI that creates keys.
 */
export const KEY_PREFIX_LEN = 12;

export type ApiKeyRecord = { keyHash: string; grantId: string; expiresAt: string | null; revokedAt: string | null; ipAllowlist?: string[] };
export interface ApiKeyStore {
  /** Lookup by the non-secret prefix (first KEY_PREFIX_LEN characters after the `ghk_xxxx_` marker). */
  findByPrefix(prefix: string): Promise<ApiKeyRecord | null>;
}

let apiKeyStore: ApiKeyStore | null = null;
export const setApiKeyStore = (s: ApiKeyStore | null) => void (apiKeyStore = s);
export const getApiKeyStore = () => apiKeyStore;

const pepper = () => {
  const p = process.env.AGENT_KEY_PEPPER;
  if (!p) throw new Error("Missing env var AGENT_KEY_PEPPER. See docs/cto/setup-needed.md");
  return p;
};

export const looksLikeApiKey = (token: string) => /^ghk_(live|test)_[A-Za-z0-9_-]{43}$/.test(token);
export const keyPrefix = (key: string) => key.slice(9, 9 + KEY_PREFIX_LEN);
export const hashApiKey = (key: string) => createHmac("sha256", pepper()).update(key).digest("hex");

export function generateApiKey(env: "live" | "test" = "live") {
  const key = `ghk_${env}_${randomBytes(32).toString("base64url")}`;
  return { key, prefix: keyPrefix(key), keyHash: hashApiKey(key) };
}

export function keyMatches(key: string, record: ApiKeyRecord): boolean {
  const a = Buffer.from(hashApiKey(key), "hex");
  const b = Buffer.from(record.keyHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
