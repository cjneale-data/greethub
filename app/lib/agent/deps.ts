import type { Grant, ToolName } from "@greethub/shared";

/**
 * Persistence and policy hooks the agent channel depends on. Each has an in-memory DEV implementation below so the framework runs
 * and tests pass with no database. Production implementations land with AGT-003 (tables), SEC-07 (limits), SEC-10 (cost ledger).
 * The in-memory versions are per instance and reset on restart (security R5): they are NOT safe for production, and
 * getAgentDeps() refuses to hand them out in production unless the sandbox flag is set.
 */

export interface GrantStore {
  /** Current grant, loaded on every call. Limits are never trusted from the token. */
  get(grantId: string): Promise<Grant | null>;
}

export type UsageSnapshot = {
  draftsToday: number;
  cardsThisMonth: number;
  spentMonthCents: number;
  spentYearCents: number;
  newRecipientsToday: number;
  approvalsToday: number;
};
export interface UsageStore {
  snapshot(grantId: string, now: Date): Promise<UsageSnapshot>;
  /** Count of cards already sent to this recipient by this grant. */
  cardsToRecipient(grantId: string, personId: string): Promise<number>;
  bump(grantId: string, what: "drafts" | "approvals" | "newRecipients"): Promise<void>;
}

export interface RateLimiter {
  /** True when allowed. Production: Postgres or Redis backed (SEC-07). */
  allow(key: string, max: number, windowMs: number): Promise<{ ok: boolean; retryAfterSeconds: number }>;
}

export interface CostLedger {
  /** Reserve model spend against a pool before any model call. Atomic. Production: SEC-10 ledger with reservations. */
  reserve(pool: "agent", usd: number, ref: string): Promise<{ ok: boolean }>;
  release(ref: string): Promise<void>;
}

export type KillSwitches = { global: boolean; agentChannel: boolean; userPaused: boolean; accountHeld: boolean };
export interface KillSwitchProvider {
  read(userId: string): Promise<KillSwitches>;
}

export type IdempotencyRecord = { payloadHash: string; result?: unknown; status: "in_flight" | "done" };
export interface IdempotencyStore {
  /** Atomically claim a key. Returns the existing record when someone already did. */
  claim(scopeKey: string, payloadHash: string): Promise<{ claimed: true } | { claimed: false; record: IdempotencyRecord }>;
  complete(scopeKey: string, result: unknown): Promise<void>;
  /** Free the claim after a failure that should be retryable. */
  abandon(scopeKey: string): Promise<void>;
}

export type AuditRow = {
  at: string;
  grantId: string;
  userId: string;
  clientId: string;
  tool: ToolName | "auth";
  decision: "allow" | "deny" | "require_approval";
  reasons: string[];
  /** SHA-256 digest of the arguments. Never the arguments themselves (docs/data ground rules: no free text in logs). */
  argsDigest?: string;
  requestId?: string;
};
export interface AuditLog {
  /** Append only. No update or delete. */
  append(row: AuditRow): Promise<void>;
}

/** Hook to flag injection attempts; feeds the abuse score and drops the grant to require_approval for 24h (05 section 9.4). */
export interface AbuseSignals {
  flag(grantId: string, kind: "injection" | "blocked_content" | "rate_limit"): Promise<void>;
  isFlagged(grantId: string): Promise<boolean>;
}

export type AgentDeps = {
  grants: GrantStore;
  usage: UsageStore;
  limiter: RateLimiter;
  ledger: CostLedger;
  killSwitches: KillSwitchProvider;
  idempotency: IdempotencyStore;
  audit: AuditLog;
  abuse: AbuseSignals;
  /** "memory" = dev only. */
  kind: "memory" | "production";
  now: () => Date;
};
