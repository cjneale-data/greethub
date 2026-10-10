import { NextResponse } from "next/server";
import type { Session } from "@/lib/adapters";
import { isMockMode } from "@/lib/book/config";
import { getQueue } from "@/lib/book/queue";
import { BookError, type Deps } from "@/lib/book/service";
import { resolveSession } from "@/lib/book/session";
import { getStores } from "@/lib/book/store";
import { getBookStorage } from "@/lib/book/storage";

export function getDeps(): Deps & { root: string } {
  const { projects, jobs, root } = getStores();
  return { projects, jobs, queue: getQueue(root), storage: getBookStorage(root), mock: isMockMode(), root };
}

export const noStore = { "Cache-Control": "no-store" };

export function fail(e: unknown): NextResponse {
  if (e instanceof BookError) {
    return NextResponse.json({ error: e.code, message: e.message, ...e.extra }, { status: e.status, headers: noStore });
  }
  console.error("book api error:", (e as Error)?.message);
  return NextResponse.json({ error: "server_error", message: "Something went wrong on our side. Try again." }, { status: 500, headers: noStore });
}

/** Sign-in gate for every book route: books are account-only. */
export async function requireUser(req: Request): Promise<Session> {
  const session = await resolveSession(req.headers.get("cookie"));
  if (session.isGuest) throw new BookError(401, "sign_in_required", "Books use real photos, so we need to know it's you. Make a free account to start.");
  return session;
}

type Ctx<P> = { params: Promise<P> };

/** Wraps a route body: auth, deps, JSON response, error mapping. */
export function route<P extends Record<string, string>>(fn: (a: { req: Request; user: Session; d: Deps & { root: string }; params: P }) => Promise<unknown>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const user = await requireUser(req);
      const result = await fn({ req, user, d: getDeps(), params: await ctx.params });
      return result instanceof Response ? result : NextResponse.json(result, { headers: noStore });
    } catch (e) {
      return fail(e);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new BookError(400, "bad_json", "That request didn't make sense.");
  }
}

export function parseBody<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new BookError(422, "bad_request", "Some of that did not look right. Check it and try again.");
  return r.data;
}
