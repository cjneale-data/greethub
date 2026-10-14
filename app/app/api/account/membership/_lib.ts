import { json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { MembershipError } from "@/lib/membership/service";

type Member = { userId: string; email: string };

/** Signed-in only; MembershipError becomes a friendly JSON error. */
export function memberRoute(fn: (req: Request, u: Member) => Promise<Response>) {
  return async (req: Request) => {
    const u = await signedIn();
    if (!u) return json({ ...NOT_SIGNED_IN, error: "Make a free account to see memberships." }, 401);
    try {
      return await fn(req, u);
    } catch (e) {
      if (e instanceof MembershipError) return json({ error: e.message, code: e.code }, e.status);
      console.error("membership request failed", e);
      return json({ error: "Something broke on our side. Nothing was charged. Try again in a minute." }, 500);
    }
  };
}
