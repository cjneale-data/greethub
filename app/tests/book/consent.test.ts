import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONSENT_TEXT, consentCovers, consentHash, consentValid, evaluateConsentGate } from "../../lib/book/consent";
import { cronAuthorized, photosExpiringSoon, purgeExpiredPhotos, deleteUserBookData } from "../../lib/book/privacy";
import { addPhoto, confirmPhotos, createProject, generateStory, recordConsent, withdrawConsent } from "../../lib/book/service";
import { fakeJpeg, makeDeps, USER, validBrief } from "./helpers";

const chars = validBrief().characters;
const [kid, grandpa] = chars;
const AB = { a: true, b: true, c: false, d: false };
const meta = { ip: "203.0.113.9", userAgent: "vitest" };

describe("consent gate (pure)", () => {
  it("uses the legal wording for A and B and fingerprints it", () => {
    expect(CONSENT_TEXT.a).toContain("at least 18 years old");
    expect(CONSENT_TEXT.b).toContain("OpenRouter, Google, Anthropic");
    expect(CONSENT_TEXT.b).toContain("deleted after 90 days");
    expect(consentHash()).toMatch(/^[0-9a-f]{8}$/);
  });

  it("blocks without A and B, whatever else is ticked", () => {
    const photos = [{ characterId: kid.id }, { characterId: grandpa.id }];
    expect(evaluateConsentGate({ characters: chars }, photos, { a: true, b: false }).ok).toBe(false);
    expect(evaluateConsentGate({ characters: chars }, photos, { a: false, b: true }).problems[0].code).toBe("no_consent");
    expect(evaluateConsentGate({ characters: chars }, photos, null).ok).toBe(false);
  });

  it("blocks when a human has no photo; pets need none", () => {
    const g = evaluateConsentGate({ characters: chars }, [{ characterId: kid.id }], { a: true, b: true });
    expect(g.problems.map((p) => p.code)).toEqual(["no_photo"]);
    const withPet = { characters: [...chars, { id: "c_pet", name: "Rex", ageBand: "pet", role: "dog", pronouns: "", isPet: true }] };
    expect(evaluateConsentGate(withPet, [{ characterId: kid.id }, { characterId: grandpa.id }], { a: true, b: true }).ok).toBe(true);
  });
});

describe("consent gate (server)", () => {
  async function setup() {
    const d = makeDeps();
    const created = await createProject(d, USER, validBrief());
    return { d, id: created.id };
  }

  it("refuses uploads until A and B are recorded", async () => {
    const { d, id } = await setup();
    await expect(addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) })).rejects.toMatchObject({ status: 403, code: "consent_required" });
    await expect(recordConsent(d, USER, id, { boxes: { a: true, b: false, c: false, d: false }, ...meta })).rejects.toMatchObject({ code: "consent_required" });
    expect((await d.projects.get(id))?.consent).toBeUndefined();
  });

  it("logs consent with ip, agent, wording hash and boxes, and stamps every upload with its id", async () => {
    const { d, id } = await setup();
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    await addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) });
    await addPhoto(d, USER, id, { characterId: grandpa.id, data: fakeJpeg(900, 900) });
    const p = (await d.projects.get(id))!;
    expect(p.consent).toMatchObject({ userId: USER, ip: "203.0.113.9", userAgent: "vitest", boxes: AB, wordingHash: consentHash() });
    expect(p.consent!.photoIds).toHaveLength(2);
    expect(p.photos.every((x) => x.consentId === p.consent!.id)).toBe(true);
    expect(consentCovers(p.consent, p.photos)).toBe(true);
    expect(new Date(p.photos[0].expiresAt).getTime() - new Date(p.photos[0].createdAt).getTime()).toBe(90 * 86_400_000);
  });

  it("continues only with a photo of every human, and the story waits for that", async () => {
    const { d, id } = await setup();
    await expect(generateStory(d, USER, id)).rejects.toMatchObject({ code: "consent_required" });
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    await addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) });
    await expect(confirmPhotos(d, USER, id)).rejects.toMatchObject({ code: "photos_required" });
    await addPhoto(d, USER, id, { characterId: grandpa.id, data: fakeJpeg(900, 900) });
    expect((await confirmPhotos(d, USER, id)).photosConfirmed).toBe(true);
    await addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) });
    expect((await d.projects.get(id))?.photosConfirmed).toBe(false); // new photo, confirm again
  });

  it("re-prompts when the wording version changes", async () => {
    const { d, id } = await setup();
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    const p = (await d.projects.get(id))!;
    expect(consentValid(p.consent)).toBe(true);
    expect(consentValid({ ...p.consent!, wordingVersion: "old" })).toBe(false);
  });

  it("withdrawal deletes the photos and stops further use", async () => {
    const { d, id } = await setup();
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    await addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) });
    const path = d.storage.localPath((await d.projects.get(id))!.photos[0].path);
    expect(existsSync(path)).toBe(true);
    await withdrawConsent(d, USER, id);
    expect(existsSync(path)).toBe(false);
    const p = (await d.projects.get(id))!;
    expect(p.photos).toHaveLength(0);
    expect(p.consent?.withdrawnAt).toBeTruthy();
    await expect(addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) })).rejects.toMatchObject({ code: "consent_required" });
  });

  it("validates photos from the bytes: type, size and the 600px floor", async () => {
    const { d, id } = await setup();
    await recordConsent(d, USER, id, { boxes: AB, ...meta });
    await expect(addPhoto(d, USER, id, { characterId: kid.id, data: new Uint8Array([1, 2, 3, 4, 5, 6]) })).rejects.toMatchObject({ code: "bad_type" });
    await expect(addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(500, 900) })).rejects.toMatchObject({ code: "too_small" });
    await expect(addPhoto(d, USER, id, { characterId: "c_nope", data: fakeJpeg(900, 900) })).rejects.toMatchObject({ code: "no_character" });
  });

  it("keeps one user's book away from another", async () => {
    const { d, id } = await setup();
    await expect(recordConsent(d, "someone-else", id, { boxes: AB, ...meta })).rejects.toMatchObject({ status: 404 });
  });
});

describe("retention and delete-my-data", () => {
  async function withPhotos(boxes = AB) {
    const d = makeDeps();
    const { id } = await createProject(d, USER, validBrief());
    await recordConsent(d, USER, id, { boxes, ...meta });
    await addPhoto(d, USER, id, { characterId: kid.id, data: fakeJpeg(900, 900) });
    return { d, id };
  }
  const later = (days: number) => new Date(Date.now() + days * 86_400_000);

  it("purges photos after 90 days and not before", async () => {
    const { d, id } = await withPhotos();
    const path = d.storage.localPath((await d.projects.get(id))!.photos[0].path);
    expect(await purgeExpiredPhotos(d, later(89))).toEqual({ photosDeleted: 0, projectsTouched: 0 });
    expect(existsSync(path)).toBe(true);
    expect((await photosExpiringSoon(d, later(80))).map((x) => x.projectId)).toEqual([id]);
    expect(await purgeExpiredPhotos(d, later(91))).toEqual({ photosDeleted: 1, projectsTouched: 1 });
    expect(existsSync(path)).toBe(false);
    expect((await d.projects.get(id))!.photos).toHaveLength(0);
  });

  it("keeps photos when the user ticked 'keep my character' (box C)", async () => {
    const { d, id } = await withPhotos({ ...AB, c: true });
    expect((await purgeExpiredPhotos(d, later(400))).photosDeleted).toBe(0);
    expect((await d.projects.get(id))!.photos).toHaveLength(1);
  });

  it("delete-my-data removes every book and photo for the user only", async () => {
    const { d, id } = await withPhotos();
    const other = await createProject(d, "other-user", validBrief());
    const path = d.storage.localPath((await d.projects.get(id))!.photos[0].path);
    expect(await deleteUserBookData(d, USER)).toEqual({ projects: 1, photos: 1 });
    expect(await d.projects.get(id)).toBeNull();
    expect(existsSync(path)).toBe(false);
    expect(await d.projects.get(other.id)).not.toBeNull();
  });

  it("delete-my-data also removes the user's job documents (they hold names and story text)", async () => {
    const { d, id } = await withPhotos();
    await addPhoto(d, USER, id, { characterId: grandpa.id, data: fakeJpeg(900, 900) });
    await confirmPhotos(d, USER, id);
    await generateStory(d, USER, id);
    const jobIds = (await d.jobs.listByProject(id)).map((j) => j.id);
    expect(jobIds.length).toBeGreaterThan(0);
    await deleteUserBookData(d, USER);
    expect(await d.jobs.listByProject(id)).toEqual([]);
    for (const j of jobIds) expect(await d.jobs.get(j)).toBeNull();
  });

  it("lets the purge cron in only with the right secret", () => {
    const h = (o: Record<string, string>) => new Headers(o);
    const prod = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
    expect(cronAuthorized(h({}), prod)).toBe(false);
    expect(cronAuthorized(h({}), { NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(true);
    const vercel = { ...prod, CRON_SECRET: "s3cret-value" };
    expect(cronAuthorized(h({ authorization: "Bearer s3cret-value" }), vercel)).toBe(true);
    expect(cronAuthorized(h({ authorization: "Bearer wrong" }), vercel)).toBe(false);
    expect(cronAuthorized(h({}), vercel)).toBe(false);
    const own = { ...prod, GREETHUB_CRON_SECRET: "other-value" };
    expect(cronAuthorized(h({ "x-cron-secret": "other-value" }), own)).toBe(true);
    expect(cronAuthorized(h({ authorization: "Bearer other-value" }), own)).toBe(false);
  });
});
