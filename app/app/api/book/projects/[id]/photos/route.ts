import { addPhoto, BookError } from "@/lib/book/service";
import { route } from "../../../_lib/handler";

/** multipart/form-data: `characterId` and `file` (the browser has already downscaled it to a JPEG). */
export const POST = route<{ id: string }>(async ({ req, user, d, params }) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const characterId = String(form?.get("characterId") ?? "");
  if (!(file instanceof File) || !characterId) throw new BookError(422, "bad_request", "Pick a photo to add.");
  const data = new Uint8Array(await file.arrayBuffer());
  return { project: await addPhoto(d, user.userId, params.id, { characterId, data }) };
});
