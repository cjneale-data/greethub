import { json } from "@/lib/shop/api";
import { createCustomStyle, publicView } from "@/lib/writing/service";
import { uploadOf, writingRoute } from "../_lib";

/** multipart/form-data: `file` (photo or scan of the filled-in sheet) and `name`. */
export const POST = writingRoute(async ({ req, userId }) => {
  const { data, name } = await uploadOf(req);
  const { profile, style } = await createCustomStyle(userId, { data, name });
  return json({ ...publicView(profile), created: style.id, missing: style.missing }, 201);
});
