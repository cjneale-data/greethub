import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { BookProject, Job } from "../types";
import { ID_PATTERN, type JobStore, type ProjectStore } from "./types";

export const newId = (prefix: string) => `${prefix}_${randomBytes(8).toString("hex")}`;

function assertId(id: string) {
  if (!ID_PATTERN.test(id)) throw new Error("Invalid id");
}

/** Atomic write: temp file then rename, so a reader never sees half a document. */
function writeJson(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  for (let i = 0; ; i++) {
    try {
      renameSync(tmp, file);
      return;
    } catch (e) {
      // Windows can briefly refuse a rename onto a file another process is reading
      if (i >= 8) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15 * (i + 1));
    }
  }
}

function readJson<T>(file: string): T | null {
  for (let i = 0; i < 4; i++) {
    try {
      if (!existsSync(file)) return null;
      return JSON.parse(readFileSync(file, "utf8")) as T;
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10 * (i + 1));
    }
  }
  return null;
}

/** Per-key promise chain so concurrent updates inside one process do not interleave. */
class Mutex {
  private tails = new Map<string, Promise<unknown>>();
  run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.tails.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.tails.set(key, next.catch(() => undefined));
    return next;
  }
}

export class FileProjectStore implements ProjectStore {
  private mutex = new Mutex();
  constructor(private root: string) {}
  private file(id: string) {
    assertId(id);
    return path.join(this.root, "projects", `${id}.json`);
  }
  async get(id: string) {
    return readJson<BookProject>(this.file(id));
  }
  async put(project: BookProject) {
    writeJson(this.file(project.id), project);
  }
  async update(id: string, fn: (p: BookProject) => BookProject | Promise<BookProject>) {
    return this.mutex.run(id, async () => {
      const cur = await this.get(id);
      if (!cur) return null;
      const next = await fn(structuredClone(cur));
      next.updatedAt = new Date().toISOString();
      await this.put(next);
      return next;
    });
  }
  async listAll() {
    const dir = path.join(this.root, "projects");
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson<BookProject>(path.join(dir, f)))
      .filter((p): p is BookProject => !!p);
  }
  async listByUser(userId: string) {
    const dir = path.join(this.root, "projects");
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson<BookProject>(path.join(dir, f)))
      .filter((p): p is BookProject => !!p && p.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async delete(id: string) {
    rmSync(this.file(id), { force: true });
  }
}

export class FileJobStore implements JobStore {
  private mutex = new Mutex();
  constructor(private root: string) {}
  private file(id: string) {
    assertId(id);
    return path.join(this.root, "jobs", `${id}.json`);
  }
  async get(id: string) {
    return readJson<Job>(this.file(id));
  }
  async create(job: Job) {
    writeJson(this.file(job.id), job);
  }
  async update(id: string, fn: (j: Job) => Job) {
    return this.mutex.run(id, async () => {
      const cur = await this.get(id);
      if (!cur) return null;
      const next = fn(structuredClone(cur));
      next.updatedAt = new Date().toISOString();
      writeJson(this.file(id), next);
      return next;
    });
  }
  async listByProject(projectId: string) {
    const dir = path.join(this.root, "jobs");
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson<Job>(path.join(dir, f)))
      .filter((j): j is Job => !!j && j.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async requestCancel(id: string) {
    assertId(id);
    mkdirSync(path.join(this.root, "jobs"), { recursive: true });
    writeFileSync(path.join(this.root, "jobs", `${id}.cancel`), "1");
  }
  async isCancelRequested(id: string) {
    assertId(id);
    return existsSync(path.join(this.root, "jobs", `${id}.cancel`));
  }
  async delete(id: string) {
    rmSync(this.file(id), { force: true });
  }
}
