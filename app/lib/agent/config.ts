/**
 * Agent channel config and env handling (docs/integrations/06 sections 1 and 6).
 * Reads env on every call (no module-level caching) so tests can set it. Secrets are only read inside server code,
 * never logged or returned. The channel is OFF unless AGENT_CHANNEL_ENABLED=1, so merging this framework changes nothing in production.
 */
const flag = (name: string) => process.env[name]?.trim() === "1";
const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && process.env[name] ? v : fallback;
};
const str = (name: string) => process.env[name]?.trim() || undefined;

export const agentChannelEnabled = () => flag("AGENT_CHANNEL_ENABLED");
/** Sandbox deployment only (AGT-016): fake auth and the dev token verifier are allowed. Must never be set with production secrets. */
export const isSandbox = () => flag("GREETHUB_SANDBOX");

const siteUrl = () => (str("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

export const agentConfig = () => ({
  /** The URL the user types into a client; the token `aud` and the protected-resource `resource` must equal it (02 section 2). */
  mcpResourceUrl: str("AGENT_MCP_RESOURCE_URL") ?? `${siteUrl()}/api/mcp`,
  /** OAuth authorization server issuer. TODO: decided by the AGT-010 spike (Supabase OAuth server vs custom). */
  authIssuer: str("AGENT_AUTH_ISSUER"),
  jwksUrl: str("AGENT_JWKS_URL"),
  /** Pepper for API-key hashing. Secret. Presence is checked with hasAgentKeyPepper(); the value is read only in keys.ts. */
  hasKeyPepper: !!process.env.AGENT_KEY_PEPPER,
  /** Separate model-spend pool so agent traffic cannot starve web customers (02 section 5 check 4). Open question 4: $10/day. */
  dailyModelBudgetUsd: num("AGENT_DAILY_MODEL_BUDGET_USD", 10),
  /** Per grant. Proposed in 02 section 5 check 3. */
  rateLimits: { readsPerMin: num("AGENT_READS_PER_MIN", 120), writesPerMin: num("AGENT_WRITES_PER_MIN", 20), approvalsPerDay: num("AGENT_APPROVALS_PER_DAY", 20) },
  /** Seconds a draft preview may long-poll. Vercel duration limit is open question 30. */
  maxPreviewWaitSeconds: num("AGENT_MAX_PREVIEW_WAIT_S", 20),
  /** Cooling-off between autonomy opt-in and first use (02 section 3). */
  autonomyCoolingOffHours: num("AGENT_AUTONOMY_COOLING_OFF_H", 24),
  /** Global kill switch for just this channel (SEC-08 `ai_mode` is separate and also checked). */
  paused: flag("AGENT_CHANNEL_PAUSED"),
  supportedProtocolVersions: ["2026-07-28", "2025-11-25"] as const,
});

/** Names for docs/cto/setup-needed.md and .env.example. */
export const AGENT_ENV_NAMES = [
  "AGENT_CHANNEL_ENABLED", "AGENT_CHANNEL_PAUSED", "GREETHUB_SANDBOX", "AGENT_MCP_RESOURCE_URL", "AGENT_AUTH_ISSUER", "AGENT_JWKS_URL",
  "AGENT_KEY_PEPPER", "AGENT_DAILY_MODEL_BUDGET_USD", "AGENT_READS_PER_MIN", "AGENT_WRITES_PER_MIN", "AGENT_APPROVALS_PER_DAY",
  "AGENT_MAX_PREVIEW_WAIT_S", "AGENT_AUTONOMY_COOLING_OFF_H",
] as const;
