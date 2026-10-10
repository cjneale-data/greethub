import type { CardDraft } from "./draft";

export type StoredPreview = { front: string; insideMessage: string; title: string; mock: boolean; createdAt: string };
export type StoredChat = { role: "user" | "assistant"; content: string }[];
export type StoredDraft = { draft: CardDraft; chat: StoredChat; preview?: StoredPreview; updatedAt: string };

/**
 * Draft persistence seam. Guests use localStorage. After sign-up, `migrateToAccount` moves the draft to
 * Supabase (briefs table) and the Supabase adapter takes over. Browser only for the local implementation.
 */
export interface DraftStorage {
  load(): Promise<StoredDraft | null>;
  save(d: StoredDraft): Promise<void>;
  clear(): Promise<void>;
  migrateToAccount(userId: string): Promise<void>;
}

const KEY = "greethub.guestCardDraft.v1";

export const localDraftStorage: DraftStorage = {
  async load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as StoredDraft) : null;
    } catch {
      return null;
    }
  },
  async save(d) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(d));
    } catch {
      /* storage blocked or full: the draft just won't survive a reload */
    }
  },
  async clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
  async migrateToAccount() {
    throw new Error("TODO adapter not wired: Supabase draft migration. See docs/cto/setup-needed.md");
  },
};

/** TODO(M3 follow-up): Supabase `briefs` table; carries the guest draft over on sign-up via AuthAdapter.upgradeGuest. */
export const stubSupabaseDraftStorage: DraftStorage = {
  async load() { throw new Error("TODO adapter not wired: Supabase drafts"); },
  async save() { throw new Error("TODO adapter not wired: Supabase drafts"); },
  async clear() { throw new Error("TODO adapter not wired: Supabase drafts"); },
  async migrateToAccount() { throw new Error("TODO adapter not wired: Supabase drafts"); },
};

export const getDraftStorage = (): DraftStorage => localDraftStorage;
