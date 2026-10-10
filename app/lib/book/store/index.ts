import { dataDir } from "../config";
import { FileJobStore, FileProjectStore } from "./fileStore";
import type { JobStore, ProjectStore } from "./types";

export * from "./types";
export { newId } from "./fileStore";

/** TODO(M3/M4 Supabase): return Supabase-backed stores when hasEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"). */
export function getStores(root: string = dataDir()): { projects: ProjectStore; jobs: JobStore; root: string } {
  return { projects: new FileProjectStore(root), jobs: new FileJobStore(root), root };
}
