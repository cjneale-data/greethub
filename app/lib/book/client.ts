import type { NewCartItem } from "@greethub/shared";
import type { BriefForm, ProjectView } from "./types";

/** Browser-side wrapper around /api/book. No node imports here. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "offline", "We lost you for a second. Trying again.");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, String(body.error ?? "error"), String(body.message ?? "Something went wrong. Try again."), body);
  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) });

export type SessionInfo = { signedIn: boolean; email: string | null; mock: boolean; devSignin: boolean; rerollAllowance: number; sheetFreeRedos: number };
export type DraftSummary = { id: string; title: string; updatedAt: string; approved: boolean; step: string };

export const bookApi = {
  session: () => call<SessionInfo>("/api/book/session"),
  devSignIn: () => call<{ ok: true }>("/api/book/dev-session", json("POST")),
  listProjects: () => call<{ projects: DraftSummary[] }>("/api/book/projects").then((r) => r.projects),
  getProject: (id: string) => call<{ project: ProjectView }>(`/api/book/projects/${id}`).then((r) => r.project),
  createProject: (brief: BriefForm) => call<{ project: ProjectView }>("/api/book/projects", json("POST", { brief })).then((r) => r.project),
  updateBrief: (id: string, brief: BriefForm) => call<{ project: ProjectView }>(`/api/book/projects/${id}`, json("PATCH", { brief })).then((r) => r.project),
  recordConsent: (id: string, boxes: { a: boolean; b: boolean; c: boolean; d: boolean }) =>
    call<{ project: ProjectView }>(`/api/book/projects/${id}/consent`, json("POST", boxes)).then((r) => r.project),
  uploadPhoto: (id: string, characterId: string, blob: Blob) => {
    const f = new FormData();
    f.set("characterId", characterId);
    f.set("file", blob, "photo.jpg");
    return call<{ project: ProjectView }>(`/api/book/projects/${id}/photos`, { method: "POST", body: f }).then((r) => r.project);
  },
  removePhoto: (id: string, photoId: string) => call<{ project: ProjectView }>(`/api/book/projects/${id}/photos/${photoId}`, json("DELETE")).then((r) => r.project),
  action: (id: string, name: string, body?: unknown) => call<{ project: ProjectView }>(`/api/book/projects/${id}/${name}`, json("POST", body ?? {})).then((r) => r.project),
  cartItem: (id: string) => call<{ item: NewCartItem }>(`/api/book/projects/${id}/cart-item`).then((r) => r.item),
  /** Hands the approved book to the cart (app/api/cart takes a NewCartItem). */
  addToCart: (item: NewCartItem) => call<unknown>("/api/cart", json("POST", item)),
};

export const assetUrl = (projectId: string, file: string) => `/api/book/projects/${projectId}/assets/${file}`;
export const photoUrl = (projectId: string, photoId: string) => `/api/book/projects/${projectId}/photos/${photoId}`;
