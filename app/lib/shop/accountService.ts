import { z } from "zod";
import { AddressSchema } from "@greethub/shared";
import { docs } from "../store";
import { newId } from "./store";
import { isTerminal } from "./orderState";
import { scrubOrder } from "./orderService";
import { validateAddress } from "./address";
import { deleteWriting, exportWriting } from "../writing/service";
import type { Draft, Order, Person, SavedAddress, UserRecord } from "./types";

/* ---------- profile ---------- */

export async function getUser(userId: string): Promise<UserRecord | undefined> {
  return docs().get("users", userId);
}

export const ProfileSchema = z.object({ firstName: z.string().trim().max(60).optional(), lastName: z.string().trim().max(60).optional() });

export async function updateProfile(userId: string, input: unknown): Promise<UserRecord | null> {
  const p = ProfileSchema.parse(input);
  const u = await docs().mutate("users", userId, (u) => u && { ...u, firstName: p.firstName || undefined, lastName: p.lastName || undefined });
  return u ?? null;
}

/* ---------- addresses ---------- */

export const getAddresses = async (userId: string): Promise<SavedAddress[]> => (await docs().get("addresses", userId)) ?? [];

export async function saveAddress(userId: string, input: { label?: string; address: unknown; isDefault?: boolean }, id?: string) {
  const v = validateAddress(input.address);
  if (!v.ok) return { ok: false as const, errors: v.errors };
  const label = (input.label ?? "").trim().slice(0, 40) || v.address.name;
  const newRecId = newId("ad");
  let saved!: SavedAddress;
  await docs().mutate("addresses", userId, (cur) => {
    const book = cur ?? [];
    let rec = id ? book.find((a) => a.id === id) : undefined;
    if (rec) {
      rec.label = label;
      rec.address = v.address;
    } else {
      rec = { id: newRecId, label, address: v.address, isDefault: book.length === 0 };
      book.push(rec);
    }
    if (input.isDefault) book.forEach((a) => (a.isDefault = a.id === rec!.id));
    saved = rec;
    return book;
  });
  return { ok: true as const, saved };
}

export async function deleteAddress(userId: string, id: string): Promise<SavedAddress | undefined> {
  let gone: SavedAddress | undefined;
  await docs().mutate("addresses", userId, (cur) => {
    const book = cur ?? [];
    gone = book.find((a) => a.id === id);
    const rest = book.filter((a) => a.id !== id);
    if (gone?.isDefault && rest.length) rest[0].isDefault = true;
    return rest;
  });
  return gone;
}

export async function restoreAddress(userId: string, rec: SavedAddress) {
  const parsed = AddressSchema.safeParse(rec.address);
  if (!parsed.success) return;
  await docs().mutate("addresses", userId, (cur) => {
    const book = cur ?? [];
    if (!book.some((a) => a.id === rec.id)) book.push({ ...rec, isDefault: book.length === 0 ? true : rec.isDefault && !book.some((a) => a.isDefault) });
    return book;
  });
}

/* ---------- drafts and people (the creators write these; account pages list them) ---------- */

export const getDrafts = async (userId: string): Promise<Draft[]> =>
  ((await docs().get("drafts", userId)) ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export async function saveDraft(userId: string, draft: Omit<Draft, "id" | "updatedAt"> & { id?: string }): Promise<Draft> {
  const freshId = newId("dr");
  let rec!: Draft;
  await docs().mutate("drafts", userId, (cur) => {
    const list = cur ?? [];
    const existing = draft.id ? list.find((d) => d.id === draft.id) : undefined;
    rec = { ...(existing ?? {}), ...draft, id: existing?.id ?? draft.id ?? freshId, updatedAt: new Date().toISOString() };
    if (existing) Object.assign(existing, rec);
    else list.push(rec);
    return list;
  });
  return rec;
}

export async function deleteDraft(userId: string, id: string) {
  await docs().mutate("drafts", userId, (cur) => (cur ?? []).filter((d) => d.id !== id));
}

export async function duplicateDraft(userId: string, id: string): Promise<Draft | null> {
  const copyId = newId("dr");
  let copy: Draft | null = null;
  await docs().mutate("drafts", userId, (cur) => {
    const list = cur ?? [];
    const src = list.find((d) => d.id === id);
    copy = src ? { ...structuredClone(src), id: copyId, title: `${src.title} (copy)`, updatedAt: new Date().toISOString() } : null;
    return copy ? [...list, copy] : list;
  });
  return copy;
}

export const getPeople = async (userId: string): Promise<Person[]> => (await docs().get("people", userId)) ?? [];

export const PersonSchema = z.object({
  name: z.string().trim().min(1, "Required").max(60),
  relationship: z.string().trim().min(1, "Required").max(60),
  ageBand: z.string().trim().min(1).max(20).default("adult"),
  keepPhotos: z.boolean().default(false),
});

export async function addPerson(userId: string, input: unknown): Promise<Person> {
  const p = PersonSchema.parse(input);
  const rec: Person = { id: newId("pe"), ...p, usedIn: 0, createdAt: new Date().toISOString() };
  await docs().mutate("people", userId, (cur) => [...(cur ?? []), rec]);
  return rec;
}

export async function deletePerson(userId: string, id: string) {
  await docs().mutate("people", userId, (cur) => (cur ?? []).filter((p) => p.id !== id));
}

/* ---------- orders ---------- */

export const listOrders = async (userId: string): Promise<Order[]> =>
  (await docs().find("orders", { owner: userId })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getOrder = async (userId: string, id: string): Promise<Order | undefined> => {
  const o = await docs().get("orders", id);
  return o && o.userId === userId ? o : undefined;
};

export const openOrderCount = async (userId: string) => (await listOrders(userId)).filter((o) => !isTerminal(o.status)).length;

/* ---------- export and deletion ---------- */

export async function exportUserData(userId: string) {
  const [profile, addresses, drafts, people, cart, orders, writing] = await Promise.all([
    docs().get("users", userId),
    docs().get("addresses", userId),
    docs().get("drafts", userId),
    docs().get("people", userId),
    docs().get("carts", userId),
    listOrders(userId),
    exportWriting(userId),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile: profile ?? null,
    addresses: addresses ?? [],
    drafts: drafts ?? [],
    people: people ?? [],
    cart: cart ?? [],
    orders,
    handwritingAndSignatures: writing,
  };
}

/** Delete-my-data. Profile, people, drafts, addresses and cart go now. Orders stay as records (tax and accounting) and lose
 *  names and addresses once closed; open orders keep their ship-to until delivered, then are scrubbed on the status update. */
export async function deleteAccount(userId: string): Promise<{ email?: string; firstName?: string }> {
  const store = docs();
  const u = await store.get("users", userId);
  const who = { email: u?.email, firstName: u?.firstName };
  await deleteWriting(userId); // signature and handwriting images first: they are private files, not just rows
  await Promise.all((["users", "carts", "addresses", "drafts", "people"] as const).map((c) => store.remove(c, userId)));
  await store.removeByOwner("delete_tokens", userId);
  if (who.email) await store.removeByOwner("magic_tokens", who.email);
  const [checkouts, orders] = await Promise.all([store.find("checkouts", { owner: userId }), store.find("orders", { owner: userId })]);
  for (const c of checkouts) if (c.status !== "completed") await store.remove("checkouts", c.id);
  for (const o of orders) {
    await store.mutate("orders", o.id, (cur) => {
      if (!cur) return cur;
      const flagged = { ...cur, accountDeleted: true };
      return isTerminal(cur.status) ? scrubOrder(flagged) : flagged;
    });
  }
  // TODO(storage): purge private photos for this user from Supabase Storage (adapter.remove) when photo upload ships.
  return who;
}

export async function createDeleteToken(userId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, "");
  await docs().insertIfAbsent("delete_tokens", token, { userId, expiresAt: Date.now() + 15 * 60 * 1000 });
  return token;
}

export async function consumeDeleteToken(token: string): Promise<string | null> {
  let userId: string | null = null;
  await docs().mutate("delete_tokens", token, (t) => {
    userId = t && t.expiresAt >= Date.now() ? t.userId : null;
    return userId ? undefined : t;
  });
  return userId;
}
