import { json } from "@/lib/shop/api";
import { addSignature, publicView, uploadSignature } from "@/lib/writing/service";
import { uploadOf, writingRoute } from "../_lib";

/** JSON { kind: "drawn", canvas, strokes } or { kind: "typed", text, fontId }; or multipart `file` for an uploaded photo. */
export const POST = writingRoute(async ({ req, userId }) => {
  if ((req.headers.get("content-type") ?? "").startsWith("multipart/form-data")) {
    const { data, name } = await uploadOf(req);
    return json(publicView(await uploadSignature(userId, { data, label: name })), 201);
  }
  return json(publicView(await addSignature(userId, await req.json())), 201);
});
