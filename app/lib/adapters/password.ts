import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // bcrypt's limit in Supabase Auth; longer would be silently truncated there

/** Why an email + password sign-in or sign-up failed, in terms the route can explain to the person. */
export type PasswordReason = "exists" | "bad_credentials" | "weak_password" | "rate_limited" | "unavailable";

export class PasswordAuthError extends Error {
  constructor(public reason: PasswordReason, message: string = reason) {
    super(message);
  }
}

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Local auth only (Supabase Auth hashes its own). Format: scrypt$<salt hex>$<hash hex>. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
