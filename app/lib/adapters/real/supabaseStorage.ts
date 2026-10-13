import type { StorageAdapter } from "../types";
import { supabaseAdmin } from "../../store/supabaseDocs";

/** The private bucket made by supabase/migrations. No storage policies: only the service role reaches it. */
export const PRIVATE_BUCKET = "private";

export type SupabaseStorage = StorageAdapter & { read(path: string): Promise<Buffer> };

export function supabaseStorage(bucket = PRIVATE_BUCKET): SupabaseStorage {
  const files = () => supabaseAdmin().storage.from(bucket);
  return {
    async putPrivate(path, data, contentType) {
      const { error } = await files().upload(path, data, { contentType, upsert: true });
      if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    },
    async read(path) {
      const { data, error } = await files().download(path);
      if (error || !data) throw new Error(`Supabase Storage download failed: ${error?.message ?? "empty"}`);
      return Buffer.from(await data.arrayBuffer());
    },
    async signedUrl(path, ttlSeconds) {
      const { data, error } = await files().createSignedUrl(path, ttlSeconds);
      if (error || !data) throw new Error(`Supabase Storage signed URL failed: ${error?.message ?? "empty"}`);
      return data.signedUrl;
    },
    async remove(path) {
      const { error } = await files().remove([path]);
      if (error) throw new Error(`Supabase Storage delete failed: ${error.message}`);
    },
  };
}
