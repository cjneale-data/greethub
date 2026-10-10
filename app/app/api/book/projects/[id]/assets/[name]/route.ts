import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { BookError, resolveAsset } from "@/lib/book/service";
import { route } from "../../../../_lib/handler";

/** Rendered model sheets and pages, owner only. File names carry a version, so a name never changes once written. */
export const GET = route<{ id: string; name: string }>(async ({ user, d, params }) => {
  const { file, contentType } = await resolveAsset(d, user.userId, params.id, params.name, d.root);
  const data = await readFile(file).catch(() => {
    throw new BookError(404, "not_found", "Not found.");
  });
  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" },
  });
});
