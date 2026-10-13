import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { getUser, updateProfile } from "@/lib/shop/accountService";

export async function GET() {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  return json({ profile: await getUser(u.userId) ?? null, email: u.email });
}

export async function PUT(req: Request) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  try {
    const profile = await updateProfile(u.userId, await req.json());
    return json({ profile });
  } catch {
    return json({ error: "Check the highlighted fields." }, 400);
  }
}
