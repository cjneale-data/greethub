import { TOOL_INPUTS, TOOL_META, toolError, type ToolError, type ToolName } from "@greethub/shared";
import type { Principal } from "./auth";
import type { AgentDeps } from "./deps";
import { handlers, resolveFacts, type ToolCtx } from "./service";
import { authorize } from "./policy";
import { sha256, stableStringify, withIdempotency } from "./idempotency";

/**
 * The pipeline every tool call goes through, whichever surface it came from:
 * validate (Zod) -> authorize (policy) -> audit -> reserve model spend -> idempotency -> handler -> audit.
 * Audit rows hold a digest of the arguments, never the arguments (no free text, addresses or photos in logs).
 */
export type CallOutcome = { ok: true; data: Record<string, unknown>; replayed: boolean } | { ok: false; error: ToolError };

export async function callTool(principal: Principal, tool: ToolName, rawArgs: unknown, deps: AgentDeps, requestId?: string): Promise<CallOutcome> {
  const meta = TOOL_META[tool];
  const parsed = TOOL_INPUTS[tool].safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return { ok: false, error: toolError("validation_failed", "Some fields are missing or not valid.", { retryable: false, missing: parsed.error.issues.slice(0, 10).map((i) => ({ path: i.path.join("."), message: i.message })) }) };
  }
  const args = parsed.data as Record<string, unknown>;
  const base = { at: deps.now().toISOString(), grantId: principal.grant.grantId, userId: principal.userId, clientId: principal.clientId, tool, argsDigest: sha256(stableStringify(args)), requestId };
  const ctx: ToolCtx = { principal, deps };

  const decision = await authorize(principal, tool, args, deps, await resolveFacts(ctx, tool, args));
  await deps.audit.append({ ...base, decision: decision.decision, reasons: decision.reasons });
  if (decision.decision !== "allow") return { ok: false, error: decision.error };

  const run = async (): Promise<{ ok: true; data: Record<string, unknown>; replayed: boolean } | { ok: false; error: ToolError }> => {
    const ref = `${principal.grant.grantId}:${tool}:${crypto.randomUUID()}`;
    if (meta.spendsModelMoney) {
      const r = await deps.ledger.reserve("agent", 0.25, ref);
      if (!r.ok) return { ok: false, error: toolError("spend_cap_reached", "GreetHub can't start new drafts right now. Please try again later.", { retryable: true }) };
    }
    const result = await (handlers[tool] as (c: ToolCtx, i: unknown) => ReturnType<(typeof handlers)[ToolName]>)(ctx, parsed.data);
    if (!result.ok) {
      if (meta.spendsModelMoney) await deps.ledger.release(ref);
      return { ok: false, error: result.error };
    }
    if (tool === "create_card_draft") await deps.usage.bump(principal.grant.grantId, "drafts");
    if (tool === "request_approval") await deps.usage.bump(principal.grant.grantId, "approvals");
    return { ok: true, data: { schemaVersion: 1, ...(result.data as Record<string, unknown>) }, replayed: false };
  };

  if (!meta.needsIdempotencyKey) return run();
  const key = (args as { idempotencyKey: string }).idempotencyKey;
  const out = await withIdempotency<Record<string, unknown>>(deps.idempotency, { userId: principal.userId, clientId: principal.clientId, tool, key }, args, async () => {
    const r = await run();
    return r.ok ? { ok: true, data: r.data, replayed: false } : r;
  });
  if (!out.ok) return out;
  return { ok: true, data: { ...out.data, replayed: out.replayed }, replayed: out.replayed };
}
