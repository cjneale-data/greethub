import fs from "node:fs";
import path from "node:path";
import type { DB } from "./types";

/**
 * Local persistence for the fake-provider mode: one JSON file, read-modify-write per call.
 * It stands in for the Supabase tables (users, carts, addresses, drafts, people, orders). Swap the body of
 * `read`/`write` for Supabase queries when the project exists; callers only use `readDB` and `updateDB`.
 */
const emptyDB = (): DB => ({
  users: {},
  carts: {},
  addresses: {},
  drafts: {},
  people: {},
  checkouts: {},
  orders: {},
  processedEvents: [],
  magicTokens: {},
  deleteTokens: {},
  fakePrinterJobs: {},
  outbox: [],
  reports: [],
});

function file(): string {
  const dir = process.env.GREETHUB_DATA_DIR || path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "greethub.json");
}

export function readDB(): DB {
  try {
    const raw = fs.readFileSync(file(), "utf8");
    return { ...emptyDB(), ...(JSON.parse(raw) as Partial<DB>) };
  } catch {
    return emptyDB();
  }
}

function write(db: DB): void {
  const f = file();
  const tmp = `${f}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, f);
}

/** Runs `fn` against a fresh copy of the DB and saves it. Synchronous, so concurrent requests in one process cannot interleave. */
export function updateDB<T>(fn: (db: DB) => T): T {
  const db = readDB();
  const out = fn(db);
  write(db);
  return out;
}

export function resetDB(): void {
  write(emptyDB());
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
