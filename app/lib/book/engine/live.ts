/**
 * Live engine: the real pipeline (pipeline/src) behind the BookEngine seam. Runs inside the worker process only;
 * nothing in the Next.js server bundle imports this file. The OpenRouter key is read here, at call time, from the
 * environment or app/.env.local, and is never logged.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { liveImageSize, projectSpendCapUsd } from "../config";
import { buildBookBrief } from "../briefForm";
import type { AssetVersion, PagePlanLite } from "../types";
import { FatalJobError, type BookEngine, type EngineCtx } from "./types";

function readKey(): string {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const f = path.join(process.cwd(), ".env.local");
  if (existsSync(f)) {
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      if (line.startsWith("OPENROUTER_API_KEY=")) return line.slice("OPENROUTER_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    }
  }
  throw new FatalJobError("The drawing service is not configured yet.");
}

/** Legal req 8: every call (they all can carry a user photo) asks OpenRouter for zero-data-retention routing. */
const zdrFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => {
  const body = JSON.parse(init.body) as Record<string, unknown>;
  body.provider = { ...((body.provider as object) ?? {}), zdr: true };
  return globalThis.fetch(url, { ...init, body: JSON.stringify(body) });
};

const redact = (s: string) => s.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");

export async function createLiveEngine(): Promise<BookEngine> {
  const [{ OpenRouterClient }, { FileLedger }, identityMod, sheetMod, copyMod, promptsMod, renderMod, layoutMod] = await Promise.all([
    import("../../../../pipeline/src/openrouter.js"),
    import("../../../../pipeline/src/ledger.js"),
    import("../../../../pipeline/src/stages/identity.js"),
    import("../../../../pipeline/src/stages/modelsheet.js"),
    import("../../../../pipeline/src/stages/copy.js"),
    import("../../../../pipeline/src/stages/prompts.js"),
    import("../../../../pipeline/src/stages/render.js"),
    import("../../../../pipeline/src/layout/book.js"),
  ]);

  const build = (e: EngineCtx) => {
    const ledger = new FileLedger(path.join(e.workDir, "cost_ledger.jsonl"));
    const startUsd = ledger.totalUsd();
    const client = new OpenRouterClient({
      apiKey: readKey,
      ledger,
      runId: e.job.id,
      fetch: zdrFetch,
      spendCapUsd: projectSpendCapUsd(),
      log: (m) => e.log(redact(m)),
    });
    const input = e.job.input;
    const photoIds: Record<string, string[]> = Object.fromEntries(input.characters.map((c) => [c.id, c.photoIds]));
    const brief = buildBookBrief(input.brief, photoIds, new Date().toISOString());
    const ctx = {
      client,
      workDir: e.workDir,
      brief,
      imageSize: liveImageSize(),
      log: (m: string) => e.log(redact(m)),
      photos: { get: async (id: string) => readFile(input.photoPaths[id]) },
    };
    return { ctx, ledger, spent: () => ledger.totalUsd() - startUsd };
  };

  const identityFile = (e: EngineCtx) => path.join(e.workDir, "identity.txt");
  const loadIdentity = async (e: EngineCtx, ctx: ReturnType<typeof build>["ctx"]) => {
    if (existsSync(identityFile(e))) return readFileSync(identityFile(e), "utf8");
    const id = await identityMod.identitySheet(ctx);
    writeFileSync(identityFile(e), id, "utf8");
    return id;
  };
  const promptsFile = (e: EngineCtx) => path.join(e.workDir, "prompts.json");

  const guard = async <T>(e: EngineCtx, spent: () => number, fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      const msg = redact(String((err as Error).message));
      if (/spend cap|SpendCap/i.test(msg) || (err as Error).constructor?.name === "SpendCapExceeded") throw new FatalJobError("This book has reached its drawing budget.");
      throw err;
    } finally {
      e.reportCost(spent());
    }
  };

  return {
    async story(e) {
      const { ctx, spent } = build(e);
      return guard(e, spent, async () => {
        const s = await copyMod.writeStory(ctx, e.job.input.spreads);
        return { title: s.title, blurb: s.blurb, pages: s.pages as PagePlanLite[] };
      });
    },

    async sheet(e) {
      const { ctx, spent } = build(e);
      return guard(e, spent, async () => {
        let identity = await loadIdentity(e, ctx);
        const notes = Object.entries(e.job.input.sheetNotes ?? {}).filter(([, v]) => v.trim());
        if (notes.length) {
          identity += `\n\nCORRECTIONS FROM THE BUYER (apply these, they override the notes above): ${notes.map(([who, n]) => `${who}: ${n.trim()}`).join("; ")}`;
        }
        const out = await sheetMod.modelSheet(ctx, identity);
        return { file: path.basename(out.file), createdAt: new Date().toISOString(), model: out.model };
      });
    },

    async preparePages(e, plan) {
      const { ctx, spent } = build(e);
      await guard(e, spent, async () => {
        if (existsSync(promptsFile(e))) {
          const have = JSON.parse(readFileSync(promptsFile(e), "utf8")) as Record<string, string>;
          if (plan.every((p) => have[p.id])) return;
        }
        const identity = await loadIdentity(e, ctx);
        await promptsMod.pagePrompts(ctx, identity, plan);
      });
    },

    async renderPage(e, page, opts): Promise<AssetVersion | null> {
      const { ctx, spent } = build(e);
      return guard(e, spent, async () => {
        const prompts = JSON.parse(readFileSync(promptsFile(e), "utf8")) as Record<string, string>;
        const base = prompts[page.id];
        if (!base) throw new Error(`No prompt for ${page.id}`);
        const prompt = opts.note?.trim() ? `${base}\n\nBUYER REQUEST FOR THIS PAGE (apply it, keep everything else): ${opts.note.trim()}` : base;
        const sheetFile = e.job.input.sheetFile;
        if (!sheetFile) throw new Error("No approved model sheet");
        const r = await renderMod.renderPage(ctx, page, prompt, path.join(e.imagesDir, sheetFile), { visionQa: true });
        if (!r) return null;
        return { file: path.basename(r.file), createdAt: new Date().toISOString(), model: r.model, qaNote: r.qa && !r.qa.pass ? r.qa.notes : undefined };
      });
    },

    async layout(e, plan, art) {
      const input = e.job.input;
      const file = (id: string) => (art[id] ? readFileSync(path.join(e.imagesDir, art[id])) : undefined);
      const cover = file("cover");
      if (!cover) throw new Error("No cover art to lay out");
      const outDir = path.join(e.workDir, "print");
      mkdirSync(outDir, { recursive: true });
      const spreads = plan.filter((p) => p.kind === "spread").map((p) => ({ text: p.text ?? "", art: file(p.id)! }));
      const report = await layoutMod.layoutBook(
        { title: input.proofTitle ?? input.story?.title ?? "Our book", blurb: input.story?.blurb ?? "", coverArt: cover, backArt: file("back"), spreads },
        outDir,
        "book",
      );
      return report.files;
    },
  };
}
