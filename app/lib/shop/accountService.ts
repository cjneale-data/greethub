import { z } from "zod";
import { AddressSchema } from "@greethub/shared";
import { newId, readDB, updateDB } from "./store";
import { isTerminal } from "./orderState";
import { scrubOrder } from "./orderService";
import { validateAddress } from "./address";
import type { Draft, Person, SavedAddress, UserRecord } from "./types";

/* ---------- profile ---------- */

export function getUser(userId: string): UserRecord | undefined {
  return readDB().users[userId];
}

export const ProfileSchema = z.object({ firstName: z.string().trim().max(60).optional(), lastName: z.string().trim().max(60).optional() });

export function updateProfile(userId: string, input: unknown): UserRecord | null {
  const p = ProfileSchema.parse(input);
  return updateDB((db) => {
    const u = db.users[userId];
    if (!u) return null;
    u.firstName = p.firstName || undefined;
    u.lastName = p.lastName || undefined;
    return u;
  });
}

/* ---------- addresses ---------- */

export const getAddresses = (userId: string): SavedAddress[] => readDB().addresses[userId] ?? [];

export function saveAddress(userId: string, input: { label?: string; address: unknown; isDefault?: boolean }, id?: string) {
  const v = validateAddress(input.address);
  if (!v.ok) return { ok: false as const, errors: v.errors };
  const label = (input.label ?? "").trim().slice(0, 40) || v.address.name;
  const saved = updateDB((db) => {
    const book = (db.addresses[userId] ??= []);
    let rec = id ? book.find((a) => a.id === id) : undefined;
    if (rec) {
      rec.label = label;
      rec.address = v.address;
    } else {
      rec = { id: newId("ad"), label, address: v.address, isDefault: book.length === 0 };
      book.push(rec);
    }
    if (input.isDefault) book.forEach((a) => (a.isDefault = a.id === rec!.id));
    return rec;
  });
  return { ok: true as const, saved };
}

export function deleteAddress(userId: string, id: string): SavedAddress | undefined {
  return updateDB((db) => {
    const book = db.addresses[userId] ?? [];
    const gone = book.find((a) => a.id === id);
    db.addresses[userId] = book.filter((a) => a.id !== id);
    if (gone?.isDefault && db.addresses[userId].length) db.addresses[userId][0].isDefault = true;
    return gone;
  });
}

export function restoreAddress(userId: string, rec: SavedAddress) {
  const parsed = AddressSchema.safeParse(rec.address);
  if (!parsed.success) return;
  updateDB((db) => {
    const book = (db.addresses[userId] ??= []);
    if (!book.some((a) => a.id === rec.id)) book.push({ ...rec, isDefault: book.length === 0 ? true : rec.isDefault && !book.some((a) => a.isDefault) });
  });
}

/* ---------- drafts and people (the creators write these; account pages list them) ---------- */

export const getDrafts = (userId: string): Draft[] => (readDB().drafts[userId] ?? []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export function saveDraft(userId: string, draft: Omit<Draft, "id" | "updatedAt"> & { id?: string }): Draft {
  return updateDB((db) => {
    const list = (db.drafts[userId] ??= []);
    const existing = draft.id ? list.find((d) => d.id === draft.id) : undefined;
    const rec: Draft = { ...(existing ?? {}), ...draft, id: existing?.id ?? draft.id ?? newId("dr"), updatedAt: new Date().toISOString() };
    if (existing) Object.assign(existing, rec);
    else list.push(rec);
    return rec;
  });
}

export function deleteDraft(userId: string, id: string) {
  updateDB((db) => {
    db.drafts[userId] = (db.drafts[userId] ?? []).filter((d) => d.id !== id);
  });
}

export function duplicateDraft(userId: string, id: string): Draft | null {
  return updateDB((db) => {
    const list = (db.drafts[userId] ??= []);
    const src = list.find((d) => d.id === id);
    if (!src) return null;
    const copy: Draft = { ...structuredClone(src), id: newId("dr"), title: `${src.title} (copy)`, updatedAt: new Date().toISOString() };
    list.push(copy);
    return copy;
  });
}

export const getPeople = (userId: string): Person[] => readDB().people[userId] ?? [];

export const PersonSchema = z.object({
  name: z.string().trim().min(1, "Required").max(60),
  relationship: z.string().trim().min(1, "Required").max(60),
  ageBand: z.string().trim().min(1).max(20).default("adult"),
  keepPhotos: z.boolean().default(false),
});

export function addPerson(userId: string, input: unknown): Person {
  const p = PersonSchema.parse(input);
  return updateDB((db) => {
    const rec: Person = { id: newId("pe"), ...p, usedIn: 0, createdAt: new Date().toISOString() };
    (db.people[userId] ??= []).push(rec);
    return rec;
  });
}

export function deletePerson(userId: string, id: string) {
  updateDB((db) => {
    db.people[userId] = (db.people[userId] ?? []).filter((p) => p.id !== id);
  });
}

/* ---------- orders ---------- */

export const listOrders = (userId: string) =>
  Object.values(readDB().orders)
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getOrder = (userId: string, id: string) => {
  const o = readDB().orders[id];
  return o && o.userId === userId ? o : undefined;
};

export const openOrderCount = (userId: string) => listOrders(userId).filter((o) => !isTerminal(o.status)).length;

/* ---------- export and deletion ---------- */

export function exportUserData(userId: string) {
  const db = readDB();
  return {
    exportedAt: new Date().toISOString(),
    profile: db.users[userId] ?? null,
    addresses: db.addresses[userId] ?? [],
    drafts: db.drafts[userId] ?? [],
    people: db.people[userId] ?? [],
    cart: db.carts[userId] ?? [],
    orders: listOrders(userId),
  };
}

/** Delete-my-data. Profile, people, drafts, addresses and cart go now. Orders stay as records (tax and accounting) and lose
 *  names and addresses once closed; open orders keep their ship-to until delivered, then are scrubbed on the status update. */
export function deleteAccount(userId: string): { email?: string; firstName?: string } {
  return updateDB((db) => {
    const u = db.users[userId];
    const who = { email: u?.email, firstName: u?.firstName };
    delete db.users[userId];
    delete db.carts[userId];
    delete db.addresses[userId];
    delete db.drafts[userId];
    delete db.people[userId];
    for (const [k, t] of Object.entries(db.deleteTokens)) if (t.userId === userId) delete db.deleteTokens[k];
    for (const [k, t] of Object.entries(db.magicTokens)) if (t.email === who.email) delete db.magicTokens[k];
    for (const [k, c] of Object.entries(db.checkouts)) if (c.userId === userId && c.status !== "completed") delete db.checkouts[k];
    for (const o of Object.values(db.orders)) {
      if (o.userId !== userId) continue;
      const flagged = { ...o, accountDeleted: true };
      db.orders[o.id] = isTerminal(o.status) ? scrubOrder(flagged) : flagged;
    }
    // TODO(storage): purge private photos for this user from Supabase Storage (adapter.remove) when photo upload ships.
    return who;
  });
}

export function createDeleteToken(userId: string): string {
  const token = crypto.randomUUID().replace(/-/g, "");
  updateDB((db) => {
    db.deleteTokens[token] = { userId, expiresAt: Date.now() + 15 * 60 * 1000 };
  });
  return token;
}

export function consumeDeleteToken(token: string): string | null {
  return updateDB((db) => {
    const t = db.deleteTokens[token];
    if (!t || t.expiresAt < Date.now()) return null;
    delete db.deleteTokens[token];
    return t.userId;
  });
}
