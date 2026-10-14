import { json } from "@/lib/shop/api";
import { membershipView } from "@/lib/membership/service";
import { memberRoute } from "./_lib";

export const GET = memberRoute(async (_req, u) => json(await membershipView(u.userId)));
