import { describe, expect, it } from "vitest";
import { childProcessEnv } from "@/lib/env";
import { AfterResponseQueue } from "@/lib/book/queue";
import { getStores, newId } from "@/lib/book/store";
import type { Job } from "@/lib/book/types";
import { tmpRoot, USER } from "./book/helpers";

describe("child process env (SEC-22)", () => {
  it("passes OS basics, GREETHUB settings and the OpenRouter key only", () => {
    const env = childProcessEnv(
      { GREETHUB_DATA_DIR: "/data" },
      {
        PATH: "/bin",
        SystemRoot: "C:\\Windows",
        GREETHUB_MOCK_AI: "1",
        OPENROUTER_API_KEY: "or-test",
        SESSION_SECRET: "s",
        STRIPE_SECRET_KEY: "k",
        STRIPE_WEBHOOK_SECRET: "w",
        SUPABASE_SERVICE_ROLE_KEY: "r",
        RESEND_API_KEY: "e",
        GREETHUB_ADMIN_TOKEN: "t",
        GREETHUB_CRON_SECRET: "c",
      },
    );
    expect(env).toEqual({ PATH: "/bin", SystemRoot: "C:\\Windows", GREETHUB_MOCK_AI: "1", OPENROUTER_API_KEY: "or-test", GREETHUB_DATA_DIR: "/data" });
  });
});

describe("after-response queue (serverless hosts)", () => {
  const job = (mock: boolean): Job => ({
    id: newId("jb"), projectId: newId("bk"), userId: USER, kind: "story", status: "queued", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    mock, input: {} as Job["input"], progress: { done: 0, total: 1, label: "" }, pages: {}, costUsd: 0,
  });

  it("runs a mock job after the response", async () => {
    const root = tmpRoot();
    const { jobs } = getStores(root);
    const j = job(true);
    await jobs.create(j);
    const scheduled: (() => Promise<void>)[] = [];
    await new AfterResponseQueue(root, (fn) => scheduled.push(fn)).enqueue(j.id);
    expect(scheduled).toHaveLength(1);
    expect((await jobs.get(j.id))?.status).toBe("queued");
    await scheduled[0]();
    expect(["queued", "running"]).not.toContain((await jobs.get(j.id))?.status);
  });

  it("refuses live jobs instead of half-running them", async () => {
    const root = tmpRoot();
    const { jobs } = getStores(root);
    const j = job(false);
    await jobs.create(j);
    await expect(new AfterResponseQueue(root, () => undefined).enqueue(j.id)).rejects.toThrow(/hosted job queue/);
  });
});
