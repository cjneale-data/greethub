import { signatureImage } from "@/lib/writing/service";
import { png, writingRoute } from "../../../_lib";

/** The signature image, for its owner only (private, never cached by shared caches). */
export const GET = writingRoute<{ id: string }>(async ({ userId, params }) => png(await signatureImage(userId, params.id), 300));
