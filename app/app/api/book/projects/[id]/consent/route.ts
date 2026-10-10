import { z } from "zod";
import { recordConsent } from "@/lib/book/service";
import { parseBody, readJson, route } from "../../../_lib/handler";

const Body = z.object({ a: z.boolean(), b: z.boolean(), c: z.boolean().default(false), d: z.boolean().default(false) });

/** Writes the consent log entry (boxes, UTC time, IP, user agent, wording hash). Required before any upload. */
export const POST = route<{ id: string }>(async ({ req, user, d, params }) => {
  const boxes = parseBody(Body, await readJson(req));
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  return { project: await recordConsent(d, user.userId, params.id, { boxes, ip, userAgent: req.headers.get("user-agent") ?? "" }) };
});
