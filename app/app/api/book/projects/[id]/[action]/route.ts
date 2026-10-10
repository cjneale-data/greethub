import { z } from "zod";
import {
  approveProof,
  approveSheet,
  approveStory,
  BookError,
  cancelJob,
  confirmPhotos,
  generateSheet,
  generateStory,
  rerollPage,
  saveStory,
  startRender,
  withdrawConsent,
} from "@/lib/book/service";
import { ProofApproveSchema, StoryEditSchema } from "@/lib/book/schemas";
import { parseBody, readJson, route } from "../../../_lib/handler";

const SheetBody = z.object({ notes: z.record(z.string().max(60), z.string().max(300)).default({}) });
const Reroll = z.object({ pageId: z.string().regex(/^(cover|back|p\d{1,2})$/), note: z.string().max(300).optional() });

/** One endpoint per step decision. Every one is owner-checked and re-validated on the server. */
export const POST = route<{ id: string; action: string }>(async ({ req, user, d, params }) => {
  const body = async () => ((await req.clone().text()) ? await readJson(req) : {});
  const u = user.userId;
  const id = params.id;
  switch (params.action) {
    case "confirm-photos":
      return { project: await confirmPhotos(d, u, id) };
    case "withdraw-consent":
      return { project: await withdrawConsent(d, u, id) };
    case "generate-story":
      return { project: await generateStory(d, u, id) };
    case "save-story":
      return { project: await saveStory(d, u, id, parseBody(StoryEditSchema, await body())) };
    case "approve-story":
      return { project: await approveStory(d, u, id) };
    case "generate-sheet":
      return { project: await generateSheet(d, u, id) };
    case "redo-sheet":
      return { project: await generateSheet(d, u, id, { redo: true, notes: parseBody(SheetBody, await body()).notes }) };
    case "approve-sheet":
      return { project: await approveSheet(d, u, id) };
    case "start-render":
      return { project: await startRender(d, u, id) };
    case "reroll": {
      const b = parseBody(Reroll, await body());
      return { project: await rerollPage(d, u, id, b.pageId, b.note) };
    }
    case "cancel":
      return { project: await cancelJob(d, u, id) };
    case "approve-proof":
      return { project: await approveProof(d, u, id, parseBody(ProofApproveSchema, await body())) };
    default:
      throw new BookError(404, "not_found", "Not found.");
  }
});
