import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "../adapters/types";
import { dataDir } from "./config";

/**
 * Local-disk stand-in for the private Supabase Storage bucket. Files live under the data dir (outside the repo)
 * and are only ever served through ownership-checked routes. TODO(M3/M4 Supabase): use getAdapters().storage
 * once it is real; the book code only depends on the StorageAdapter shape plus `read` and `localPath`.
 */
export class LocalDiskStorage implements StorageAdapter {
  constructor(private root: string) {}

  localPath(p: string): string {
    const full = path.resolve(this.root, "storage", p);
    if (!full.startsWith(path.resolve(this.root, "storage") + path.sep)) throw new Error("Invalid storage path");
    return full;
  }
  async putPrivate(p: string, data: Uint8Array, _contentType?: string) {
    const file = this.localPath(p);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  }
  async read(p: string): Promise<Buffer> {
    return readFile(this.localPath(p));
  }
  async signedUrl(): Promise<string> {
    // Private bucket stand-in: nothing is publicly addressable. Browsers load photos via /api/book/projects/:id/photos/:photoId.
    throw new Error("LocalDiskStorage does not issue signed URLs; use the ownership-checked photo route");
  }
  async remove(p: string) {
    await rm(this.localPath(p), { force: true });
  }
}

export const getBookStorage = (root: string = dataDir()) => new LocalDiskStorage(root);
