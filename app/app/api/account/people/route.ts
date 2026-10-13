import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { addPerson, getPeople } from "@/lib/shop/accountService";

export async function GET() {
  const u = await signedIn();
  if (!u) return json({ ...NOT_SIGNED_IN, error: "Save Grandma once and skip the typing next time. Make a free account to save people." }, 401);
  return json({ people: await getPeople(u.userId) });
}

export async function POST(req: Request) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  try {
    await addPerson(u.userId, await req.json());
    return json({ people: await getPeople(u.userId) }, 201);
  } catch {
    return json({ error: "Check the highlighted fields." }, 400);
  }
}
