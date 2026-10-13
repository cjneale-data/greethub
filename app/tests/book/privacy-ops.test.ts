import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { auditPhotoRetention, exportUserBookData, purgeExpiredPhotos } from "../../lib/book/privacy";
import { addPhoto, confirmPhotos, createProject, generateStory, getProject, recordConsent, withdrawConsent } from "../../lib/book/service";
import { fakeJpeg, makeDeps, USER, validBrief } from "./helpers";

const [kid, grandpa] = validBrief().characters;
const AB = { a: true, b: true, c: false, d: false };
const meta = { ip: "203.0.113.9", userAgent: "vitest" };
const later = (days: number) => new Date(Date.now() + days * 86_400_000);

async function bookWithPhoto(boxes = AB) {
  const d = makeDeps();
  const { id } = await createProject(d, USER, validBrief());
  await recordConsent(d, USER, id, { boxes, ...meta });
  await addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) });
  return { d, id };
}

describe("consent history", () => {
  it("keeps the withdrawn record when the customer consents again, and never sends it to the browser", async () => {
    const { d, id } = await bookWithPhoto();
    const first = (await d.projects.get(id))!.consent!;
    await withdrawConsent(d, USER, id);
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    const p = (await d.projects.get(id))!;
    expect(p.consent!.id).not.toBe(first.id);
    expect(p.consentHistory).toHaveLength(1);
    expect(p.consentHistory![0]).toMatchObject({ id: first.id, ip: meta.ip });
    expect(p.consentHistory![0].withdrawnAt).toBeTruthy();
    const view = (await getProject(d, USER, id)) as unknown as Record<string, unknown>;
    expect(view.consentHistory).toBeUndefined();
    expect(JSON.stringify(view)).not.toContain(meta.ip);
  });
});

describe("consent on jobs", () => {
  it("stamps every generation job with the consent record id", async () => {
    const { d, id } = await bookWithPhoto();
    await addPhoto(d, USER, id, { characterId: grandpa.id, data: fakeJpeg(900, 900) });
    await confirmPhotos(d, USER, id);
    await generateStory(d, USER, id);
    const consentId = (await d.projects.get(id))!.consent!.id;
    const jobs = await d.jobs.listByProject(id);
    expect(jobs.length).toBeGreaterThan(0);
    for (const j of jobs) expect(j.input.consentId).toBe(consentId);
  });
});

describe("export-my-data (book half)", () => {
  it("includes the book, photo details and every consent record, without storage paths", async () => {
    const { d, id } = await bookWithPhoto();
    await withdrawConsent(d, USER, id);
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    await createProject(d, "other-user", validBrief());
    const out = await exportUserBookData(d, USER);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id, brief: { recipientName: "Lee" } });
    expect(out[0].consentRecords).toHaveLength(2);
    expect(out[0].consentRecords[0].withdrawnAt).toBeTruthy();
    expect(JSON.stringify(out)).not.toContain("books/");
  });
});

describe("purge verification", () => {
  it("reports overdue photos before the purge and none after", async () => {
    const { d, id } = await bookWithPhoto();
    expect((await auditPhotoRetention(d, later(91))).overdue).toEqual([{ projectId: id, photoId: expect.any(String) }]);
    await purgeExpiredPhotos(d, later(91));
    expect(await auditPhotoRetention(d, later(91))).toEqual({ overdue: [], keptByBoxC: [], orphanFiles: [] });
  });

  it("lists box C holds separately and finds photo files no book points to", async () => {
    const { d, id } = await bookWithPhoto({ ...AB, c: true });
    const stray = path.join(d.root, "storage", "books", USER, "gone", "photos");
    mkdirSync(stray, { recursive: true });
    writeFileSync(path.join(stray, "ph_x.jpg"), "x");
    const a = await auditPhotoRetention(d, later(91));
    expect(a.overdue).toEqual([]);
    expect(a.keptByBoxC).toEqual([{ projectId: id, photos: 1 }]);
    expect(a.orphanFiles).toEqual([`${USER}/gone/photos/ph_x.jpg`]);
  });
});
