import type { BookProject, Job } from "../types";

/** Persistence seam. The JSON-file implementation is for local work; Supabase tables (books, book_jobs) replace it. */
export interface ProjectStore {
  get(id: string): Promise<BookProject | null>;
  put(project: BookProject): Promise<void>;
  /** Read-modify-write serialised per project. The updater may mutate and return the same object. */
  update(id: string, fn: (p: BookProject) => BookProject | Promise<BookProject>): Promise<BookProject | null>;
  listByUser(userId: string): Promise<BookProject[]>;
  listAll(): Promise<BookProject[]>;
  delete(id: string): Promise<void>;
}

export interface JobStore {
  get(id: string): Promise<Job | null>;
  /** Create the job document. After creation only the worker writes it. */
  create(job: Job): Promise<void>;
  update(id: string, fn: (j: Job) => Job): Promise<Job | null>;
  listByProject(projectId: string): Promise<Job[]>;
  /** Cancellation is a separate flag so the worker stays the single writer of the job document. */
  requestCancel(id: string): Promise<void>;
  isCancelRequested(id: string): Promise<boolean>;
}

export const ID_PATTERN = /^[a-z]{2,3}_[a-f0-9]{12,32}$/;
