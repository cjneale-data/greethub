import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { INDEX, type Collection, type DocStore, type Docs } from "../store/docs";
import type { DB } from "./types";

/**
 * Local persistence for the fake-provider mode: one JSON file, read-modify-write per call. It implements the same
 * DocStore as the Supabase tables (lib/store/supabaseDocs.ts); app code goes through `docs()` (lib/store) and never
 * sees which one runs. `readDB`/`updateDB` stay for tests and local dev tools that inspect the file directly.
 */
const emptyDB = (): DB => ({
  users: {},
  carts: {},
  addresses: {},
  drafts: {},
  people: {},
  writing: {},
  memberships: {},
  stockCreations: {},
  checkouts: {},
  orders: {},
  processedEvents: [],
  magicTokens: {},
  deleteTokens: {},
  credentials: {},
  fakePrinterJobs: {},
  batchJobs: {},
  outbox: [],
  reports: [],
});

function file(): string {
  // On Vercel the deployment dir is read-only, so the fake store falls back to the instance's /tmp (same place the
  // book store uses). That keeps a mock-mode preview from crashing on every write; it is not shared between instances.
  const dir = process.env.GREETHUB_DATA_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), "greethub-data") : path.join(process.cwd(), ".data"));
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

/* ---------- DocStore over the JSON file ---------- */

/** Collections stored as id -> document maps in the file. */
const MAPS = {
  users: "users",
  carts: "carts",
  addresses: "addresses",
  drafts: "drafts",
  people: "people",
  writing: "writing",
  memberships: "memberships",
  stock_creations: "stockCreations",
  checkouts: "checkouts",
  orders: "orders",
  magic_tokens: "magicTokens",
  delete_tokens: "deleteTokens",
  credentials: "credentials",
  fake_printer_jobs: "fakePrinterJobs",
  batch_jobs: "batchJobs",
} as const satisfies Partial<Record<Collection, keyof DB>>;
/** Collections stored as arrays of `{ id, ... }`, oldest first, optionally capped. */
const LISTS = { outbox: { key: "outbox", cap: 50 }, content_reports: { key: "reports", cap: 0 } } as const;

type Entry = [string, unknown];

function entries(db: DB, c: Collection): Entry[] {
  if (c in MAPS) return Object.entries(db[MAPS[c as keyof typeof MAPS]]);
  if (c in LISTS) return (db[LISTS[c as keyof typeof LISTS].key] as { id: string }[]).map((d) => [d.id, d]);
  if (c === "processed_events") return db.processedEvents.map((id) => [id, { at: "" }]);
  throw new Error(`The local store does not hold ${c}`);
}

function setEntry(db: DB, c: Collection, id: string, doc: unknown | undefined): void {
  if (c in MAPS) {
    const map = db[MAPS[c as keyof typeof MAPS]] as Record<string, unknown>;
    if (doc === undefined) delete map[id];
    else map[id] = doc;
    return;
  }
  if (c in LISTS) {
    const { key, cap } = LISTS[c as keyof typeof LISTS];
    const list = db[key] as { id: string }[];
    const at = list.findIndex((d) => d.id === id);
    if (doc === undefined) {
      if (at >= 0) list.splice(at, 1);
    } else if (at >= 0) list[at] = doc as { id: string };
    else list.push(doc as { id: string });
    if (cap && list.length > cap) list.splice(0, list.length - cap);
    return;
  }
  if (c === "processed_events") {
    db.processedEvents = db.processedEvents.filter((x) => x !== id);
    if (doc !== undefined) db.processedEvents.push(id);
    if (db.processedEvents.length > 500) db.processedEvents.splice(0, db.processedEvents.length - 500);
    return;
  }
  throw new Error(`The local store does not hold ${c}`);
}

const clone = <T>(v: T): T => (v === undefined ? v : structuredClone(v));

export const fileDocStore: DocStore = {
  name: "file",
  async get(c, id) {
    return entries(readDB(), c).find(([k]) => k === id)?.[1] as Docs[typeof c] | undefined;
  },
  async find(c, q) {
    return entries(readDB(), c)
      .filter(([id, d]) => {
        const ix = INDEX[c](d as never, id);
        return "owner" in q ? ix.owner === q.owner : !!ix.refs?.includes(q.ref);
      })
      .map(([, d]) => d as Docs[typeof c]);
  },
  async all(c) {
    return entries(readDB(), c).map(([, d]) => d as Docs[typeof c]);
  },
  async mutate(c, id, fn) {
    // updateDB is synchronous, so nothing else in this process runs between the read and the write.
    return updateDB((db) => {
      const cur = entries(db, c).find(([k]) => k === id)?.[1] as Docs[typeof c] | undefined;
      const next = fn(clone(cur));
      setEntry(db, c, id, next);
      return clone(next);
    });
  },
  async insertIfAbsent(c, id, doc) {
    return updateDB((db) => {
      if (entries(db, c).some(([k]) => k === id)) return false;
      setEntry(db, c, id, clone(doc));
      return true;
    });
  },
  async remove(c, id) {
    updateDB((db) => setEntry(db, c, id, undefined));
  },
  async removeByOwner(c, owner) {
    updateDB((db) => {
      for (const [id, d] of entries(db, c)) if (INDEX[c](d as never, id).owner === owner) setEntry(db, c, id, undefined);
    });
  },
};
