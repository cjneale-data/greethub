import { createHash } from "node:crypto";
import { toolError, type ToolError } from "@greethub/shared";
import type { IdempotencyStore } from "./deps";

/**
 * Idempotency for write tools (AGT-004). Same key and same payload returns the original result with replayed: true;
 * same key and a different payload returns idempotency_conflict. Scoped by user + client + tool so keys never collide across accounts.
 */
export const stableStringify = (v: unknown): string =>
  JSON.stringify(v, (_k, val) => (val && typeof val === "object" && !Array.isArray(val) ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b))) : val));

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type IdemOutcome<T> = { ok: true; data: T; replayed: boolean } | { ok: false; error: ToolError };

export async function withIdempotency<T>(
  store: IdempotencyStore,
  scope: { userId: string; clientId: string; tool: string; key: string },
  payload: unknown,
  run: () => Promise<IdemOutcome<T>>,
): Promise<IdemOutcome<T>> {
  const scopeKey = sha256(`${scope.userId}|${scope.clientId}|${scope.tool}|${scope.key}`);
  // The key itself is excluded from the payload hash so a retry with the same body matches.
  const { idempotencyKey: _ignored, ...rest } = (payload ?? {}) as Record<string, unknown>;
  void _ignored;
  const payloadHash = sha256(stableStringify(rest));

  const claim = await store.claim(scopeKey, payloadHash);
  if (claim.claimed) {
    try {
      const out = await run();
      // Only successful results are replayable. Failures free the key so the model can retry after fixing its input.
      if (out.ok) await store.complete(scopeKey, out.data);
      else await store.abandon(scopeKey);
      return out;
    } catch (e) {
      await store.abandon(scopeKey);
      throw e;
    }
  }
  if (claim.record.payloadHash !== payloadHash) return { ok: false, error: toolError("idempotency_conflict", "That idempotency key was already used with different details. Use a new key for a new request.") };
  // Concurrent duplicate: wait briefly for the first request to finish.
  for (let i = 0; i < 100; i++) {
    const again = await store.claim(scopeKey, payloadHash);
    if (again.claimed) {
      // The first attempt failed and released the key; this caller now owns it.
      try {
        const out = await run();
        if (out.ok) await store.complete(scopeKey, out.data);
        else await store.abandon(scopeKey);
        return out;
      } catch (e) {
        await store.abandon(scopeKey);
        throw e;
      }
    }
    if (again.record.status === "done") return { ok: true, data: again.record.result as T, replayed: true };
    await new Promise((r) => setTimeout(r, 50));
  }
  return { ok: false, error: toolError("service_busy", "A matching request is still running. Try again in a moment.", { retryable: true, retryAfterSeconds: 5 }) };
}
