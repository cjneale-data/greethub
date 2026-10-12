import type { Grant } from "@greethub/shared";
import type { AgentDeps, AuditRow, IdempotencyRecord, UsageSnapshot } from "./deps";

/** In-memory DEV implementations of the agent dependencies. Not for production (per instance, reset on restart). Also used by tests. */
export function createMemoryDeps(over: Partial<AgentDeps> = {}) {
  const grants = new Map<string, Grant>();
  const usage = new Map<string, UsageSnapshot>();
  const toRecipient = new Map<string, number>();
  const hits = new Map<string, number[]>();
  const reserved = new Map<string, number>();
  const idem = new Map<string, IdempotencyRecord>();
  const flagged = new Set<string>();
  const audit: AuditRow[] = [];
  const kill = { global: false, agentChannel: false, paused: new Set<string>(), held: new Set<string>() };
  let budgetUsd = 10;
  const empty = (): UsageSnapshot => ({ draftsToday: 0, cardsThisMonth: 0, spentMonthCents: 0, spentYearCents: 0, newRecipientsToday: 0, approvalsToday: 0 });

  const deps: AgentDeps = {
    kind: "memory",
    now: () => new Date(),
    grants: { get: async (id) => grants.get(id) ?? null },
    usage: {
      snapshot: async (g) => usage.get(g) ?? empty(),
      cardsToRecipient: async (g, p) => toRecipient.get(`${g}:${p}`) ?? 0,
      bump: async (g, what) => {
        const u = usage.get(g) ?? empty();
        if (what === "drafts") u.draftsToday++;
        if (what === "approvals") u.approvalsToday++;
        if (what === "newRecipients") u.newRecipientsToday++;
        usage.set(g, u);
      },
    },
    limiter: {
      allow: async (key, max, windowMs) => {
        const now = Date.now();
        const h = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
        if (h.length >= max) {
          hits.set(key, h);
          return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - h[0])) / 1000)) };
        }
        h.push(now);
        hits.set(key, h);
        return { ok: true, retryAfterSeconds: 0 };
      },
    },
    ledger: {
      reserve: async (_pool, usd, ref) => {
        const total = [...reserved.values()].reduce((a, b) => a + b, 0);
        if (total + usd > budgetUsd) return { ok: false };
        reserved.set(ref, usd);
        return { ok: true };
      },
      release: async (ref) => void reserved.delete(ref),
    },
    killSwitches: { read: async (u) => ({ global: kill.global, agentChannel: kill.agentChannel, userPaused: kill.paused.has(u), accountHeld: kill.held.has(u) }) },
    idempotency: {
      claim: async (k, h) => {
        const r = idem.get(k);
        if (r) return { claimed: false, record: r };
        idem.set(k, { payloadHash: h, status: "in_flight" });
        return { claimed: true };
      },
      complete: async (k, result) => {
        const r = idem.get(k);
        if (r) idem.set(k, { ...r, status: "done", result });
      },
      abandon: async (k) => void idem.delete(k),
    },
    audit: { append: async (row) => void audit.push(row) },
    abuse: { flag: async (g) => void flagged.add(g), isFlagged: async (g) => flagged.has(g) },
    ...over,
  };
  return {
    deps,
    // Test and sandbox helpers.
    addGrant: (g: Grant) => void grants.set(g.grantId, g),
    setUsage: (grantId: string, u: Partial<UsageSnapshot>) => void usage.set(grantId, { ...empty(), ...u }),
    setCardsToRecipient: (grantId: string, personId: string, n: number) => void toRecipient.set(`${grantId}:${personId}`, n),
    setBudgetUsd: (n: number) => void (budgetUsd = n),
    kill,
    audit,
  };
}
