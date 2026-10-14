import { supabaseStorage } from "../adapters/real/supabaseStorage";
import { getBookStorage } from "../book/storage";
import { supabaseConfigured } from "../store";
import type { StorageAdapter } from "../adapters/types";

export type WritingStorage = StorageAdapter & { read(path: string): Promise<Buffer> };

let override: WritingStorage | null = null;

/** Glyph sheets and signature images: the private Supabase bucket when configured, else local disk (same as book photos).
 *  Nothing here is ever publicly addressable; browsers get images through the ownership-checked /api/account/writing routes. */
export function writingStorage(): WritingStorage {
  if (override) return override;
  return supabaseConfigured() ? supabaseStorage() : getBookStorage();
}

export function setWritingStorageForTest(s: WritingStorage | null) {
  override = s;
}

export const writingPath = (userId: string, file: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(userId) || !/^[a-z0-9_]+\.png$/.test(file)) throw new Error("Invalid writing path");
  return `writing/${userId}/${file}`;
};
