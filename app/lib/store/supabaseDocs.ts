import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "../env";
import { INDEX, type Collection, type DocStore, type Docs } from "./docs";

let admin: SupabaseClient | null = null;

/** Service-role client. Server only: it bypasses row-level security, and every table denies the browser roles. */
export function supabaseAdmin(): SupabaseClient {
  admin ??= createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return admin;
}

type Row<C extends Collection> = { doc: Docs[C]; version: number };

const MAX_ATTEMPTS = 8;
const PAGE = 1000;
const UNIQUE_VIOLATION = "23505";

const fail = (what: string, error: { message: string; code?: string }) => new Error(`Supabase ${what} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);

/** DocStore over the tables in supabase/migrations. Updates are compare-and-swap on `version`, retried on conflict. */
export function supabaseDocStore(db: SupabaseClient = supabaseAdmin()): DocStore {
  const meta = <C extends Collection>(c: C, id: string, doc: Docs[C]) => {
    const ix = INDEX[c](doc, id);
    return { owner_id: ix.owner ?? null, refs: ix.refs ?? [] };
  };

  return {
    name: "supabase",

    async get(c, id) {
      const { data, error } = await db.from(c).select("doc").eq("id", id).maybeSingle();
      if (error) throw fail(`get ${c}`, error);
      return (data?.doc ?? undefined) as Docs[typeof c] | undefined;
    },

    async find(c, q) {
      const base = db.from(c).select("doc");
      const { data, error } = await ("owner" in q ? base.eq("owner_id", q.owner) : base.contains("refs", [q.ref])).limit(PAGE);
      if (error) throw fail(`find ${c}`, error);
      return (data ?? []).map((r) => r.doc as Docs[typeof c]);
    },

    async all(c) {
      const out: Docs[typeof c][] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db.from(c).select("doc").order("created_at").order("id").range(from, from + PAGE - 1);
        if (error) throw fail(`list ${c}`, error);
        out.push(...(data ?? []).map((r) => r.doc as Docs[typeof c]));
        if (!data || data.length < PAGE) return out;
      }
    },

    async mutate(c, id, fn) {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const { data, error } = await db.from(c).select("doc, version").eq("id", id).maybeSingle();
        if (error) throw fail(`read ${c}`, error);
        const row = data as Row<typeof c> | null;
        const next = fn(row ? structuredClone(row.doc) : undefined);

        if (!row) {
          if (next === undefined) return undefined;
          const ins = await db.from(c).insert({ id, doc: next, ...meta(c, id, next) });
          if (!ins.error) return next;
          if (ins.error.code === UNIQUE_VIOLATION) continue; // someone created it first; re-run on their version
          throw fail(`insert ${c}`, ins.error);
        }

        if (next === undefined) {
          const del = await db.from(c).delete({ count: "exact" }).eq("id", id).eq("version", row.version);
          if (del.error) throw fail(`delete ${c}`, del.error);
          if (del.count) return undefined;
          continue;
        }

        const upd = await db
          .from(c)
          .update({ doc: next, ...meta(c, id, next), version: row.version + 1, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("version", row.version)
          .select("id");
        if (upd.error) throw fail(`update ${c}`, upd.error);
        if (upd.data?.length) return next;
        // Version moved on between our read and write: another request won. Read again and re-apply.
      }
      throw new Error(`Supabase update of ${c}/${id} kept conflicting; try again`);
    },

    async insertIfAbsent(c, id, doc) {
      const { error } = await db.from(c).insert({ id, doc, ...meta(c, id, doc) });
      if (!error) return true;
      if (error.code === UNIQUE_VIOLATION) return false;
      throw fail(`insert ${c}`, error);
    },

    async remove(c, id) {
      const { error } = await db.from(c).delete().eq("id", id);
      if (error) throw fail(`delete ${c}`, error);
    },

    async removeByOwner(c, owner) {
      const { error } = await db.from(c).delete().eq("owner_id", owner);
      if (error) throw fail(`delete ${c}`, error);
    },
  };
}
