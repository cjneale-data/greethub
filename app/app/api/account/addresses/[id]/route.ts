import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { deleteAddress, getAddresses, saveAddress } from "@/lib/shop/accountService";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { label?: string; address?: unknown; isDefault?: boolean };
  const current = (await getAddresses(u.userId)).find((a) => a.id === id);
  if (!current) return json({ error: "We couldn't find that address." }, 404);
  const r = await saveAddress(u.userId, { label: b.label ?? current.label, address: b.address ?? current.address, isDefault: b.isDefault }, id);
  if (!r.ok) return json({ error: "Check the highlighted fields.", fieldErrors: r.errors }, 422);
  return json({ addresses: await getAddresses(u.userId) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const { id } = await params;
  const removed = await deleteAddress(u.userId, id);
  return json({ addresses: await getAddresses(u.userId), removed });
}
