import { z } from "zod";
import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { getDrafts, saveDraft } from "@/lib/shop/accountService";

const DraftBody = z.object({ id: z.string().optional(), kind: z.enum(["card", "book"]), title: z.string().trim().min(1).max(160), brief: z.unknown().optional(), thumbnail: z.string().max(500).optional() });

export async function GET() {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  return json({ drafts: getDrafts(u.userId) });
}

/** Upsert a draft. The creators call this to autosave; the account page lists the result. */
export async function POST(req: Request) {
  const u = await signedIn();
  if (!u) return json({ ...NOT_SIGNED_IN, error: "Want to come back to this? Make a free account and we'll keep it." }, 401);
  const p = DraftBody.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "That draft can't be saved." }, 400);
  return json({ draft: saveDraft(u.userId, p.data) }, 201);
}
