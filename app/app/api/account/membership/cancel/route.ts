import { json } from "@/lib/shop/api";
import { membershipView, setCancel } from "@/lib/membership/service";
import { memberRoute } from "../_lib";

/** { cancel: true } stops renewal at period end (perks stay until then); { cancel: false } turns renewal back on. */
export const POST = memberRoute(async (req, u) => {
  const b = (await req.json().catch(() => ({}))) as { cancel?: boolean };
  await setCancel(u.userId, b.cancel !== false);
  return json(await membershipView(u.userId));
});
