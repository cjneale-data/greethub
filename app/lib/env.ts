/** Server-side env access. Throws a clear error when a credential is missing so stubs are easy to spot. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See docs/cto/setup-needed.md`);
  return v;
}
export const hasEnv = (...names: string[]) => names.every((n) => !!process.env[n]);
