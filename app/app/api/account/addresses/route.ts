import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { getAddresses, restoreAddress, saveAddress } from "@/lib/shop/accountService";
import type { SavedAddress } from "@/lib/shop/types";

export async function GET() {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  return json({ addresses: getAddresses(u.userId) });
}

export async function POST(req: Request) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const b = (await req.json().catch(() => ({}))) as { label?: string; address?: unknown; isDefault?: boolean; restore?: SavedAddress };
  if (b.restore) {
    restoreAddress(u.userId, b.restore);
    return json({ addresses: getAddresses(u.userId) });
  }
  const r = saveAddress(u.userId, { label: b.label, address: b.address, isDefault: b.isDefault });
  if (!r.ok) return json({ error: "Check the highlighted fields.", fieldErrors: r.errors }, 422);
  return json({ addresses: getAddresses(u.userId) }, 201);
}
