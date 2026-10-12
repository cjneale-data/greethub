import { isSandbox } from "./config";
import type { AgentDeps } from "./deps";
import { createMemoryDeps } from "./memory";

/**
 * Single place that picks agent dependencies, like getAdapters(). Production (Supabase-backed) implementations do not exist yet
 * (AGT-003, SEC-07, SEC-10), so outside the sandbox and tests this throws and the routes answer 503 service_busy.
 * That is deliberate: the in-memory limiter and ledger must never guard real money.
 */
let cached: AgentDeps | null = null;
let memory: ReturnType<typeof createMemoryDeps> | null = null;

export class AgentNotReady extends Error {}

export function getAgentDeps(): AgentDeps {
  if (cached) return cached;
  const allowMemory = isSandbox() || process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";
  if (!allowMemory) throw new AgentNotReady("Agent channel persistence is not configured. See docs/cto/agent-channel-build-order.md.");
  memory = createMemoryDeps();
  cached = memory.deps;
  return cached;
}

/** Dev and sandbox helpers (seed a grant etc.). Undefined until getAgentDeps() has run. */
export const getMemoryHelpers = () => {
  getAgentDeps();
  return memory;
};

export function setAgentDepsForTest(d: AgentDeps | null) {
  cached = d;
  if (!d) memory = null;
}
