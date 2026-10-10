import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import { dataDir } from "./config";

/** Where long jobs run. Local: a detached worker process. Production: replace with Inngest or a Supabase queue consumer. */
export interface JobQueue {
  enqueue(jobId: string): Promise<void>;
}

/** Tests: run the job in this process (mock engine, no delays). */
export class InlineQueue implements JobQueue {
  constructor(private run: (jobId: string) => Promise<void>) {}
  async enqueue(jobId: string) {
    await this.run(jobId);
  }
}

/** Collects job ids without running them. Tests use it to inspect the queue. */
export class RecordingQueue implements JobQueue {
  ids: string[] = [];
  async enqueue(jobId: string) {
    this.ids.push(jobId);
  }
}

/**
 * Starts `worker/main.ts` through tsx (from the pipeline's node_modules) as a detached process that survives page
 * reloads and dev-server restarts. The worker reads the job document and updates it as it goes; the browser polls.
 */
export class LocalProcessQueue implements JobQueue {
  constructor(private root: string = dataDir(), private appDir: string = process.cwd()) {}

  async enqueue(jobId: string) {
    const repo = path.resolve(this.appDir, "..");
    const tsxCli = path.join(repo, "pipeline", "node_modules", "tsx", "dist", "cli.mjs");
    const worker = path.join(this.appDir, "lib", "book", "worker", "main.ts");
    if (!existsSync(tsxCli)) throw new Error("Worker runtime missing: run `npm install` in /pipeline");
    mkdirSync(path.join(this.root, "logs"), { recursive: true });
    const out = openSync(path.join(this.root, "logs", `${jobId}.log`), "a");
    try {
      const child = spawn(process.execPath, [tsxCli, "--tsconfig", path.join(this.appDir, "tsconfig.json"), worker, jobId], {
        cwd: this.appDir,
        detached: true,
        stdio: ["ignore", out, out],
        windowsHide: true,
        env: { ...process.env, GREETHUB_DATA_DIR: this.root, NODE_OPTIONS: "" },
      });
      child.unref();
    } finally {
      closeSync(out);
    }
  }
}

export function getQueue(root: string = dataDir()): JobQueue {
  // TODO(M3/M4 Supabase): return a Supabase queue / Inngest producer when configured.
  return new LocalProcessQueue(root);
}
