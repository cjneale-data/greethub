import { SET_COLLECTION } from "./constants";
import type { PhotoSet } from "./types";

/**
 * Persistence seam for photo sets. Same contract as DocStore.mutate (app/lib/store/docs.ts): `fn` may run more than
 * once on a version conflict, so it must only build the next document. Return undefined from `fn` to delete.
 */
export interface SetStore {
  get(id: string): Promise<PhotoSet | undefined>;
  listByUser(userId: string): Promise<PhotoSet[]>;
  listAll(): Promise<PhotoSet[]>;
  mutate(id: string, fn: (cur: PhotoSet | undefined) => PhotoSet | undefined): Promise<PhotoSet | undefined>;
  remove(id: string): Promise<void>;
}

export function memorySetStore(): SetStore {
  const rows = new Map<string, PhotoSet>();
  const clone = <T>(v: T): T => structuredClone(v);
  return {
    async get(id) {
      const r = rows.get(id);
      return r && clone(r);
    },
    async listByUser(userId) {
      return [...rows.values()].filter((r) => r.userId === userId).map(clone);
    },
    async listAll() {
      return [...rows.values()].map(clone);
    },
    async mutate(id, fn) {
      const next = fn(clone(rows.get(id)));
      if (next === undefined) rows.delete(id);
      else rows.set(id, clone(next));
      return next && clone(next);
    },
    async remove(id) {
      rows.delete(id);
    },
  };
}

/** The slice of DocStore this service uses, with the collection name loosened until `photo_sets` is added to `Docs`. */
type LooseDocs = {
  get(c: string, id: string): Promise<PhotoSet | undefined>;
  find(c: string, q: { owner: string }): Promise<PhotoSet[]>;
  all(c: string): Promise<PhotoSet[]>;
  mutate(c: string, id: string, fn: (cur: PhotoSet | undefined) => PhotoSet | undefined): Promise<PhotoSet | undefined>;
  remove(c: string, id: string): Promise<void>;
};

/**
 * DocStore-backed set store. TODO(CTO item 5): add `photo_sets: PhotoSet` to `Docs` and
 * `photo_sets: (d, id) => ({ owner: d.userId, refs: d.designIds })` to `INDEX` in app/lib/store/docs.ts, plus the
 * migration; then drop the cast below and pass `docs()` directly.
 */
export function docSetStore(store: unknown): SetStore {
  const s = store as LooseDocs;
  return {
    get: (id) => s.get(SET_COLLECTION, id),
    listByUser: (userId) => s.find(SET_COLLECTION, { owner: userId }),
    listAll: () => s.all(SET_COLLECTION),
    mutate: (id, fn) => s.mutate(SET_COLLECTION, id, fn),
    remove: (id) => s.remove(SET_COLLECTION, id),
  };
}
