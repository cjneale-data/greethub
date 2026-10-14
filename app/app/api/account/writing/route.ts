import { json } from "@/lib/shop/api";
import { getWriting, publicView, setDefaults } from "@/lib/writing/service";
import { writingRoute } from "./_lib";

export const GET = writingRoute(async ({ userId }) => json(publicView(await getWriting(userId))));

/** { defaultStyleId?, defaultSignatureId? }: what new cards start with. */
export const PUT = writingRoute(async ({ req, userId }) => json(publicView(await setDefaults(userId, await req.json()))));
