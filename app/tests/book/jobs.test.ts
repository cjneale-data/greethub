import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REROLL_ALLOWANCE, SHEET_FREE_REDOS } from "../../lib/book/constants";
import { recordConsent, getCartItem, approveProof, approveSheet, approveStory, addPhoto, cancelJob, confirmPhotos, createProject, generateSheet, generateStory, getProject, rerollPage, saveStory, startRender, QUEUED_STALE_MS, type Deps } from "../../lib/book/service";
import { RecordingQueue } from "../../lib/book/queue";
import { newId } from "../../lib/book/store";
import type { Job } from "../../lib/book/types";
import { fakeJpeg, makeDeps, tmpRoot, USER, validBrief } from "./helpers";
import { getStores } from "../../lib/book/store";

async function readyForStory(d: Deps) {
  const brief = validBrief();
  const { id } = await createProject(d, USER, brief);
  await recordConsent(d, USER, id, { boxes: { a: true, b: true, c: false, d: false }, ip: "127.0.0.1", userAgent: "vitest" });
  for (const c of brief.characters) await addPhoto(d, USER, id, { characterId: c.id, data: fakeJpeg(900, 900) });
  await confirmPhotos(d, USER, id);
  return id;
}

async function throughSheet(d: Deps) {
  const id = await readyForStory(d);
  await generateStory(d, USER, id);
  await approveStory(d, USER, id);
  await generateSheet(d, USER, id);
  await approveSheet(d, USER, id);
  return id;
}

describe("job store", () => {
  it("creates, updates, lists and flags cancellation", async () => {
    const { jobs } = getStores(tmpRoot());
    const job: Job = {
      id: newId("jb"), projectId: newId("bk"), userId: USER, kind: "story", status: "queued", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      mock: true, input: {} as Job["input"], progress: { done: 0, total: 1, label: "" }, pages: {}, costUsd: 0,
    };
    await jobs.create(job);
    expect((await jobs.get(job.id))?.status).toBe("queued");
    await Promise.all([1, 2, 3].map((n) => jobs.update(job.id, (j) => ({ ...j, progress: { ...j.progress, done: j.progress.done + n } }))));
    expect((await jobs.get(job.id))?.progress.done).toBe(6); // serialised, no lost updates
    expect(await jobs.listByProject(job.projectId)).toHaveLength(1);
    expect(await jobs.isCancelRequested(job.id)).toBe(false);
    await jobs.requestCancel(job.id);
    expect(await jobs.isCancelRequested(job.id)).toBe(true);
    await expect(jobs.get("../etc/passwd")).rejects.toThrow();
  });
});

describe("book job flow (mock engine)", () => {
  it("runs story, sheet, pages and proof end to end", async () => {
    const d = makeDeps();
    const id = await readyForStory(d);

    let p = await generateStory(d, USER, id);
    expect(p.story?.pages.filter((x) => x.kind === "spread")).toHaveLength(11); // 24 pages = 11 spreads
    expect(p.artOrder).toEqual(["cover", ...Array.from({ length: 11 }, (_, i) => `p${i + 1}`), "back"]);
    expect(p.story?.pages[1].text).toContain("Madison");

    p = await saveStory(d, USER, id, { title: "The Night Woods", texts: { p1: "My own words." } });
    expect(p.story?.pages[1].text).toBe("My own words.");
    expect(p.story?.editedIds).toEqual(["p1"]);

    await expect(generateSheet(d, USER, id)).rejects.toMatchObject({ code: "story_not_approved" });
    await approveStory(d, USER, id);
    await expect(saveStory(d, USER, id, { title: "Nope" })).rejects.toMatchObject({ code: "locked" });
    await expect(startRender(d, USER, id)).rejects.toMatchObject({ code: "sheet_not_approved" });

    p = await generateSheet(d, USER, id);
    expect(p.sheet.versions).toHaveLength(1);
    p = await approveSheet(d, USER, id);
    expect(p.sheet.approved).toBe(true);

    p = await startRender(d, USER, id);
    expect(p.artOrder.every((pid) => p.art[pid].status === "done")).toBe(true);
    expect(p.art.p1.versions[0].file).toBe("p1_v1.svg");
    expect(existsSync(path.join(d.root, "work", id, "images", "p1_v1.svg"))).toBe(true);
    expect(p.job).toBeUndefined();

    await expect(approveProof(d, USER, id, { title: "T", dedication: "", digitalCopy: false, acknowledged: false })).rejects.toMatchObject({ code: "not_acknowledged" });
    await expect(getCartItem(d, USER, id)).rejects.toMatchObject({ code: "not_approved" });
    p = await approveProof(d, USER, id, { title: "The Night Woods", dedication: "For Lee", digitalCopy: true, acknowledged: true });
    expect(p.proof.approved).toBe(true);

    const item = await getCartItem(d, USER, id);
    expect(item).toMatchObject({ kind: "book", creationId: id, pageCount: 24, digitalCopy: true, title: "The Night Woods", quantity: 1 });
  });

  it("charges re-rolls against the allowance and refuses past it", async () => {
    const d = makeDeps();
    const id = await throughSheet(d);
    await startRender(d, USER, id);
    for (let i = 1; i <= REROLL_ALLOWANCE; i++) {
      const p = await rerollPage(d, USER, id, "p2", "make the sky pink");
      expect(p.rerollsLeft).toBe(REROLL_ALLOWANCE - i);
      expect(p.art.p2.versions).toHaveLength(i + 1);
      expect(p.art.p2.current).toBe(i);
    }
    await expect(rerollPage(d, USER, id, "p3")).rejects.toMatchObject({ status: 402, code: "no_rerolls" });
  });

  it("gives two free sheet redos, then spends a re-roll, then stops", async () => {
    const d = makeDeps();
    const id = await readyForStory(d);
    await generateStory(d, USER, id);
    await approveStory(d, USER, id);
    await generateSheet(d, USER, id);
    let p = await getProject(d, USER, id);
    for (let i = 0; i < SHEET_FREE_REDOS; i++) {
      p = await generateSheet(d, USER, id, { redo: true, notes: { Madison: "shorter hair" } });
      expect(p.rerollsLeft).toBe(REROLL_ALLOWANCE);
    }
    expect(p.sheetFreeRedosLeft).toBe(0);
    p = await generateSheet(d, USER, id, { redo: true });
    expect(p.rerollsLeft).toBe(REROLL_ALLOWANCE - 1);
    expect(p.sheet.versions).toHaveLength(4);
  });

  it("marks a page failed after one automatic retry, and retrying it is free", async () => {
    const d = makeDeps({ failPageIds: ["p3"] });
    const id = await throughSheet(d);
    let p = await startRender(d, USER, id);
    expect(p.art.p3.status).toBe("failed");
    expect(p.art.p3.versions).toHaveLength(0);
    expect(p.lastJob?.status).toBe("failed");
    expect(p.art.p4.status).toBe("done"); // one bad page does not stop the rest
    await expect(approveProof(d, USER, id, { title: "T", dedication: "", digitalCopy: false, acknowledged: true })).rejects.toMatchObject({ code: "not_ready" });
    p = await rerollPage(d, USER, id, "p3");
    expect(p.art.p3.status).toBe("done");
    expect(p.rerollsLeft).toBe(REROLL_ALLOWANCE);
  });

  it("fails jobs nobody picked up, and refunds the re-roll they charged", async () => {
    const d = makeDeps();
    const id = await throughSheet(d);
    await startRender(d, USER, id);
    // from here on nothing runs jobs, as if the worker never started
    let skew = 0;
    const dead = { ...d, queue: new RecordingQueue(), now: () => new Date(Date.now() + skew) };
    let p = await rerollPage(dead, USER, id, "p2", "bluer");
    expect(p.job?.status).toBe("queued");
    expect(p.rerollsLeft).toBe(REROLL_ALLOWANCE - 1);
    expect(p.art.p2.status).toBe("redrawing");
    await expect(rerollPage(dead, USER, id, "p3")).rejects.toMatchObject({ code: "busy" });
    skew = QUEUED_STALE_MS + 5_000;
    p = await getProject(dead, USER, id); // the watchdog runs on read
    expect(p.job).toBeUndefined();
    expect(p.lastJob).toMatchObject({ status: "failed", kind: "reroll", pageId: "p2" });
    expect(p.rerollsLeft).toBe(REROLL_ALLOWANCE);
    expect(p.art.p2.status).toBe("done"); // the old art is still there
  });

  it("stops a render when cancellation is requested and lets it resume", async () => {
    const d = makeDeps({ record: true });
    const id = await readyForStory(d);
    // run the story job by hand so the rest of the flow can use the recording queue
    const { createMockEngine } = await import("../../lib/book/engine/mock");
    const { runJob } = await import("../../lib/book/engine/runner");
    const engine = createMockEngine({ delayMs: 0 });
    const run = async () => {
      const q = d.queue as unknown as { ids: string[] };
      const jobId = q.ids.at(-1)!;
      await runJob(jobId, { jobs: d.jobs, root: d.root, engine });
    };
    await generateStory(d, USER, id);
    await run();
    await approveStory(d, USER, id);
    await generateSheet(d, USER, id);
    await run();
    await approveSheet(d, USER, id);
    await startRender(d, USER, id);
    await cancelJob(d, USER, id);
    await run();
    const p = await getProject(d, USER, id);
    expect(p.lastJob?.status).toBe("cancelled");
    expect(p.artOrder.some((pid) => p.art[pid].status === "pending")).toBe(true);
    await startRender(d, USER, id); // resume is allowed
  });
});
