import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { deletePerson, getPeople } from "@/lib/shop/accountService";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  deletePerson(u.userId, id);
  return json({ people: getPeople(u.userId) });
}
