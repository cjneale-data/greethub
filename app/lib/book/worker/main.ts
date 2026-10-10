/**
 * Background worker entry. Started by LocalProcessQueue:
 *   node pipeline/node_modules/tsx/dist/cli.mjs --tsconfig app/tsconfig.json app/lib/book/worker/main.ts <jobId>
 * Runs one job and exits. Mock jobs never import the pipeline.
 */
import { dataDir } from "../config";
import { createMockEngine } from "../engine/mock";
import { runJob } from "../engine/runner";
import { getStores } from "../store";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) throw new Error("usage: main.ts <jobId>");
  const root = dataDir();
  const { jobs } = getStores(root);
  const job = await jobs.get(jobId);
  if (!job) throw new Error("job not found");
  const engine = job.mock ? createMockEngine() : await (await import("../engine/live")).createLiveEngine();
  const done = await runJob(jobId, { jobs, root, engine, log: (m) => console.log(m) });
  console.log(`job ${jobId} ${done?.status ?? "missing"}`);
}

main().catch((e) => {
  console.error(String((e as Error).message).replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***"));
  process.exit(1);
});
