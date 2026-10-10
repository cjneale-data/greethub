/** Script-level runner.
 *  npx tsx src/cli.ts card fixtures/card.json --photos <dir> [--size 1K] [--cap 1.00] [--run name]
 *  npx tsx src/cli.ts book fixtures/book.json --photos <dir> --spreads 3
 *  Photo ids in the brief map to <photos dir>/<photoId>.jpg. Reads OPENROUTER_API_KEY from the environment or ../app/.env.local
 *  at call time; the key is never printed. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CreationBriefSchema } from "@greethub/shared";
import { FileLedger } from "./ledger.js";
import { OpenRouterClient } from "./openrouter.js";
import { runBook, runCard } from "./run.js";
import type { Ctx } from "./types.js";
import type { ImageSize } from "./models.js";

const HERE = dirname(fileURLToPath(import.meta.url));

function apiKey(): string {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  for (const f of [join(HERE, "..", ".env.local"), join(HERE, "..", "..", "app", ".env.local")]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      if (line.startsWith("OPENROUTER_API_KEY=")) return line.slice("OPENROUTER_API_KEY=".length).trim();
    }
  }
  throw new Error("OPENROUTER_API_KEY not set (env or .env.local)");
}

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

async function main() {
  const [product, fixture] = process.argv.slice(2);
  if (!["card", "book"].includes(product) || !fixture) throw new Error("usage: cli.ts card|book <brief.json> --photos <dir>");
  const brief = CreationBriefSchema.parse(JSON.parse(readFileSync(resolve(fixture), "utf8")));
  const photosDir = resolve(arg("photos", ".")!);
  const runId = arg("run", `${product}-${Date.now()}`)!;
  const workDir = join(HERE, "..", "runs", runId);
  const ledger = new FileLedger(join(workDir, "cost_ledger.jsonl"));
  const cap = Number(arg("cap", "1.00"));
  const client = new OpenRouterClient({ apiKey, ledger, runId, spendCapUsd: cap });
  const ctx: Ctx = {
    client,
    workDir,
    brief,
    imageSize: (arg("size", "1K") as ImageSize),
    log: (m) => console.log(m),
    photos: { get: async (id) => readFileSync(join(photosDir, `${id}.jpg`)) },
  };
  const opts = { spreads: arg("spreads") ? Number(arg("spreads")) : undefined, backCover: process.argv.includes("--back"), approveModelSheet: () => true };
  const summary = product === "card" ? await runCard(ctx, opts) : await runBook(ctx, opts);
  console.log(JSON.stringify({ ...summary, costUsd: Number(summary.costUsd.toFixed(4)), ledger: join(workDir, "cost_ledger.jsonl") }, null, 2));
}

main().catch((e) => {
  console.error(String((e as Error).message).replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***"));
  process.exit(1);
});
