import { NextResponse } from "next/server";
import { readPhoto, removePhoto } from "@/lib/book/service";
import { route } from "../../../../_lib/handler";

/** Private thumbnail: only the owner can load it. */
export const GET = route<{ id: string; photoId: string }>(async ({ user, d, params }) => {
  const { data, contentType } = await readPhoto(d, user.userId, params.id, params.photoId);
  return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" } });
});

export const DELETE = route<{ id: string; photoId: string }>(async ({ user, d, params }) => ({ project: await removePhoto(d, user.userId, params.id, params.photoId) }));
