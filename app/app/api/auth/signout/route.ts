import { getAdapters } from "@/lib/adapters";
import { json } from "@/lib/shop/api";

export async function POST() {
  await getAdapters().auth.signOut();
  return json({ ok: true });
}
