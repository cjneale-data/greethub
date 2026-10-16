/** One-off: render the same page prompt at 1K, 2K and 4K to measure per-size image cost and latency.
 *  npx tsx scripts/measure-sizes.ts <runDir with prompts.json + images/modelsheet_v1.png> <photosDir> */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OpenRouterClient } from "../src/openrouter";
import { FileLedger } from "../src/ledger";
import { photoPart } from "../src/imageutil";
import type { ImageSize } from "../src/models";

const [runDir, photos] = process.argv.slice(2);
const key = readFileSync(join(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/).find((l) => l.startsWith("OPENROUTER_API_KEY="))!.slice(19).trim();
const ledger = new FileLedger(join(import.meta.dirname, "..", "runs", "size-probe", "cost_ledger.jsonl"));
const client = new OpenRouterClient({ apiKey: () => key, ledger, runId: "size-probe", spendCapUsd: 0.5 });
const prompts = JSON.parse(readFileSync(join(runDir, "prompts.json"), "utf8")) as Record<string, string>;
const content = [
  { type: "text" as const, text: "The FIRST attached image is the approved character model sheet (left to right: Madison, Lee). Copy faces, hair and outfits exactly.\n\n" + prompts.front },
  await photoPart(readFileSync(join(runDir, "images", "modelsheet_v1.png")), 1280),
  await photoPart(readFileSync(join(photos, "Madison.jpg")), 768),
  await photoPart(readFileSync(join(photos, "Lee.jpg")), 768),
];
for (const size of ["2K", "4K"] as ImageSize[]) {
  const t = Date.now();
  const r = await client.image({ content, stage: "probe", label: `front@${size}`, size, aspectRatio: "3:4" });
  console.log(size, r?.model, `${((Date.now() - t) / 1000).toFixed(1)}s`);
}
console.log("total", ledger.totalUsd().toFixed(4));
