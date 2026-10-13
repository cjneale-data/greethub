/** Server-side env access. Throws a clear error when a credential is missing so stubs are easy to spot. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See docs/cto/setup-needed.md`);
  return v;
}
export const hasEnv = (...names: string[]) => names.every((n) => !!process.env[n]);

/** OS and runtime variables a Node child needs to start and find temp dirs (Windows and POSIX). */
const CHILD_BASE_VARS = ["PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "windir", "ComSpec", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "LANG", "TZ", "NODE_ENV"];

/**
 * SEC-22: the env handed to a spawned worker or pipeline process. Only OS basics, non-secret GREETHUB_* settings and the
 * OpenRouter key pass through; session, Stripe, Supabase, printer and email secrets stay in the server process.
 */
export function childProcessEnv(extra: Record<string, string> = {}, env: Record<string, string | undefined> = process.env): NodeJS.ProcessEnv {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) continue;
    if (CHILD_BASE_VARS.includes(k) || (k.startsWith("GREETHUB_") && !/TOKEN|SECRET|PASSWORD|_KEY/.test(k)) || k === "OPENROUTER_API_KEY") out[k] = v;
  }
  return { ...out, ...extra } as NodeJS.ProcessEnv;
}
