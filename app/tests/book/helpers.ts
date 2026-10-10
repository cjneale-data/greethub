import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { createMockEngine } from "../../lib/book/engine/mock";
import { runJob } from "../../lib/book/engine/runner";
import { InlineQueue, RecordingQueue } from "../../lib/book/queue";
import type { Deps } from "../../lib/book/service";
import { getStores } from "../../lib/book/store";
import { getBookStorage } from "../../lib/book/storage";
import type { BriefForm } from "../../lib/book/types";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

export function tmpRoot(): string {
  const d = mkdtempSync(path.join(os.tmpdir(), "gh-book-test-"));
  dirs.push(d);
  return d;
}

/** Deps with an inline mock-engine queue: enqueue() runs the whole job before it returns. */
export function makeDeps(opts: { failPageIds?: string[]; record?: boolean } = {}): Deps & { root: string; queue: InlineQueue | RecordingQueue } {
  const root = tmpRoot();
  const { projects, jobs } = getStores(root);
  const engine = createMockEngine({ delayMs: 0, failPageIds: opts.failPageIds ?? [] });
  const queue = opts.record ? new RecordingQueue() : new InlineQueue((id) => runJob(id, { jobs, root, engine }).then(() => undefined));
  return { projects, jobs, queue, storage: getBookStorage(root), mock: true, root };
}

export function validBrief(overrides: Partial<BriefForm> = {}): BriefForm {
  return {
    occasion: "birthday",
    occasionOther: "",
    recipientName: "Lee",
    relationship: "grandson",
    tone: "adventurous",
    readingAge: "3-5",
    pageCount: 24,
    artStyle: "watercolor",
    storyIdea: "Three cousins sneak out at night with flashlights to explore the woods.",
    settingDetails: "",
    dedication: "For Lee",
    characters: [
      { id: "c_aaaa1111", name: "Madison", ageBand: "child", role: "Hero", pronouns: "she/her" },
      { id: "c_bbbb2222", name: "Grandpa", ageBand: "senior", role: "Grandparent", pronouns: "he/him" },
    ],
    ...overrides,
  };
}

/** A minimal JPEG header with the given size: enough for the server's own type and size sniffing. */
export function fakeJpeg(width: number, height: number): Uint8Array {
  const sof = [0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1];
  return new Uint8Array([0xff, 0xd8, ...sof, 0xff, 0xd9]);
}

export const USER = "user-1";
