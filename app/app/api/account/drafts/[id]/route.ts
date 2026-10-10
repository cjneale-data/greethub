import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { deleteDraft, duplicateDraft, getDrafts } from "@/lib/shop/accountService";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  deleteDraft(u.userId, id);
  return json({ drafts: getDrafts(u.userId) });
}

/** POST = duplicate. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  duplicateDraft(u.userId, id);
  return json({ drafts: getDrafts(u.userId) });
}
