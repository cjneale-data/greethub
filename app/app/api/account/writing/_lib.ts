import { ZodError } from "zod";
import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { WritingError } from "@/lib/writing/service";

type Ctx<P> = { req: Request; userId: string; params: P };

/** Signed-in only; WritingError and bad input become friendly JSON errors. */
export function writingRoute<P = Record<string, never>>(fn: (c: Ctx<P>) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    const u = await signedIn();
    if (!u) return json({ ...NOT_SIGNED_IN, error: "Make a free account to save your handwriting and signature." }, 401);
    try {
      return await fn({ req, userId: u.userId, params: await (ctx?.params ?? Promise.resolve({} as P)) });
    } catch (e) {
      if (e instanceof WritingError) return json({ error: e.message, code: e.code }, e.status);
      if (e instanceof ZodError || e instanceof SyntaxError) return json({ error: "Check the highlighted fields.", code: "bad_request" }, 400);
      throw e;
    }
  };
}

/** Hosted functions reject bodies over 4.5 MB before the handler runs; the browser shrinks photos below this first. */
export const MAX_BODY_BYTES = 4_400_000;

export async function uploadOf(req: Request): Promise<{ data: Uint8Array; name?: string }> {
  // Check the declared size before buffering anything.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) throw new WritingError(413, "too_big", "That photo is too big to send. Try a smaller one.");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new WritingError(422, "bad_request", "Pick a photo to add.");
  const name = form?.get("name");
  return { data: new Uint8Array(await file.arrayBuffer()), name: typeof name === "string" ? name : undefined };
}

/** Private images: never in shared caches. `maxAge` lets the browser reuse an unchanging one (a saved signature) briefly. */
export const png = (buf: Buffer, maxAge = 0) =>
  new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/png", "Cache-Control": maxAge ? `private, max-age=${maxAge}` : "private, no-store", "X-Content-Type-Options": "nosniff" } });
