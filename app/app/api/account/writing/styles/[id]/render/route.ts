import { z } from "zod";
import { CARD_MESSAGE_BOX_PX } from "@greethub/shared";
import { json } from "@/lib/shop/api";
import { allow } from "@/lib/intake/rate-limit";
import { renderCustom } from "@/lib/writing/service";
import { png, writingRoute } from "../../../_lib";

const Body = z.object({
  text: z.string().max(600),
  width: z.number().int().min(100).max(CARD_MESSAGE_BOX_PX.width).default(CARD_MESSAGE_BOX_PX.width),
  height: z.number().int().min(60).max(CARD_MESSAGE_BOX_PX.height).default(CARD_MESSAGE_BOX_PX.height),
});

/**
 * Preview of a message in the member's own handwriting (transparent PNG), at most the print box. Each call is image work
 * on the server, so it is rate-limited per member. `X-Unsupported` lists characters this hand can't write (URL-encoded).
 */
export const POST = writingRoute<{ id: string }>(async ({ req, userId, params }) => {
  if (!allow(`writing-render:${userId}`, 40, 60_000)) return json({ error: "Slow down a little and try again in a minute.", code: "rate_limited" }, 429);
  const b = Body.parse(await req.json());
  const r = await renderCustom(userId, params.id, b.text.trim() || "Your message here", { width: b.width, height: b.height });
  const res = png(r.png);
  res.headers.set("X-Unsupported", encodeURIComponent(r.unsupported.join("")));
  res.headers.set("X-Fitted", r.fitted ? "1" : "0");
  return res;
});
