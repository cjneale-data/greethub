import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { getBookStorage } from "../../lib/book/storage";
import {
  addSetPhoto, attachDesign, auditSetRetention, createPhotoSet, deleteUserPhotoSets, evaluateSetGate, exportUserPhotoSets, markOrderFinal,
  memorySetStore, photoCardConsentHash, placeOrderHold, purgeExpiredSets, readSetPhoto, recordSetConsent, registerDerivedFile,
  removeSetPhoto, setsExpiringSoon, withdrawSetConsent, MAX_PHOTOS_PER_SET, PHOTO_CARD_CONSENT_VERSION, SetError, type SetDeps,
} from "../../lib/photo-sets";
import { consentHash } from "../../lib/book/consent";
import { CONSENT_WORDING_VERSION } from "../../lib/book/constants";

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

function setup(now = new Date("2026-11-01T12:00:00Z")) {
  const root = mkdtempSync(path.join(os.tmpdir(), "gh-ps-test-"));
  dirs.push(root);
  const clock = { t: now };
  const d: SetDeps & { root: string } = { sets: memorySetStore(), storage: getBookStorage(root), mock: true, now: () => clock.t, root };
  return { d, root, clock };
}

const BOXES = { a: true, b: true };
const ctx = { ip: "1.2.3.4", userAgent: "test" };

/** A solid-colour JPEG, optionally with EXIF GPS and a moderation marker in a COM segment. */
async function jpeg(w = 900, h = 900, opts: { gps?: boolean; marker?: string } = {}): Promise<Buffer> {
  let img = sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 120, b: 80 } } });
  if (opts.gps) img = img.withExif({ IFD0: { Make: "TestCam" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "40/1 44/1 55/1", GPSLongitudeRef: "W", GPSLongitude: "73/1 59/1 9/1" } });
  const buf = await img.jpeg().toBuffer();
  if (!opts.marker) return buf;
  const body = Buffer.from(`GH_TEST_MODERATION:${opts.marker}`);
  const seg = Buffer.concat([Buffer.from([0xff, 0xfe, (body.length + 2) >> 8, (body.length + 2) & 255]), body]);
  return Buffer.concat([buf.subarray(0, 2), seg, buf.subarray(2)]);
}

async function readyset(d: SetDeps) {
  const s = await createPhotoSet(d, "u1");
  await recordSetConsent(d, "u1", s.id, { boxes: BOXES, ...ctx });
  return s.id;
}

const code = async (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof SetError ? e.code : String(e)));

describe("photo_sets consent first", () => {
  it("refuses uploads until A and B are ticked, and nothing is stored", async () => {
    const { d, root } = setup();
    const s = await createPhotoSet(d, "u1");
    expect(await code(addSetPhoto(d, "u1", s.id, await jpeg()))).toBe("consent_required");
    expect(await code(recordSetConsent(d, "u1", s.id, { boxes: { a: true, b: false }, ...ctx }))).toBe("consent_required");
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]);
  });

  it("uses its own wording version and hash, leaving the book hash alone", () => {
    expect(PHOTO_CARD_CONSENT_VERSION).toBe("2026-10-pc1");
    expect(photoCardConsentHash()).not.toBe(consentHash());
    expect(CONSENT_WORDING_VERSION).toBe("2026-10-v2");
  });

  it("logs the record and moves photos under a re-recorded consent", async () => {
    const { d } = setup();
    const id = await readyset(d);
    await addSetPhoto(d, "u1", id, await jpeg());
    await recordSetConsent(d, "u1", id, { boxes: { ...BOXES, bAi: true }, ...ctx });
    const row = (await d.sets.get(id))!;
    expect(row.consentHistory).toHaveLength(1);
    expect(row.photos[0].consentId).toBe(row.consent!.id);
    expect(row.consent!.variant).toBe("photo_card");
    expect(row.consent!.wordingHash).toBe(photoCardConsentHash());
  });
});

describe("photo_sets ingest", () => {
  it("strips EXIF including GPS from original and preview, caps size, keeps files private", async () => {
    const { d } = setup();
    const id = await readyset(d);
    const raw = await jpeg(4000, 3000, { gps: true });
    expect((await sharp(raw).metadata()).exif).toBeTruthy();
    const v = await addSetPhoto(d, "u1", id, raw);
    expect(v.photos[0]).toMatchObject({ width: 3000, height: 2250 });
    for (const variant of ["original", "preview"] as const) {
      const { data } = await readSetPhoto(d, "u1", id, v.photos[0].id, variant);
      expect((await sharp(data).metadata()).exif).toBeUndefined();
      expect(data.toString("latin1")).not.toContain("TestCam");
    }
    expect(JSON.stringify(v)).not.toContain("photo-sets/");
    expect(await code(readSetPhoto(d, "other", id, v.photos[0].id))).toBe("not_found");
  });

  it("applies EXIF orientation", async () => {
    const { d } = setup();
    const id = await readyset(d);
    const raw = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#456" } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
    const v = await addSetPhoto(d, "u1", id, raw);
    expect(v.photos[0]).toMatchObject({ width: 900, height: 1200 });
  });

  it("checks size, type and floor before moderation and stores nothing on failure", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    expect(await code(addSetPhoto(d, "u1", id, Buffer.alloc(10 * 1024 * 1024 + 1)))).toBe("too_big");
    expect(await code(addSetPhoto(d, "u1", id, Buffer.from("not an image at all, just text")))).toBe("bad_type");
    expect(await code(addSetPhoto(d, "u1", id, await jpeg(500, 900)))).toBe("too_small");
    // an unreadable HEIC claim fails cleanly
    const fakeHeic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypheic"), Buffer.alloc(64)]);
    expect(["heic_unsupported", "unreadable"]).toContain(await code(addSetPhoto(d, "u1", id, fakeHeic)));
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]);
    expect((await d.sets.get(id))!.photos).toHaveLength(0);
  });

  it("blocks moderation markers in mock mode, including CSAM halt, and stores nothing", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    for (const m of ["sexual", "violence", "minor_sexual"]) expect(await code(addSetPhoto(d, "u1", id, await jpeg(900, 900, { marker: m })))).toBe("photo_blocked");
    expect(await code(addSetPhoto(d, "u1", id, await jpeg(900, 900, { marker: "logo" })))).toBe("ok");
    expect((await d.sets.get(id))!.photos).toHaveLength(1);
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]);
  });

  it("accepts 1 to 10 photos, rejects the 11th, and stays right under parallel uploads", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    expect(evaluateSetGate((await d.sets.get(id))!).problems.map((p) => p.code)).toEqual(["no_photo"]);
    const img = await jpeg();
    const results = await Promise.all(Array.from({ length: 12 }, () => code(addSetPhoto(d, "u1", id, img))));
    expect(results.filter((r) => r === "ok")).toHaveLength(MAX_PHOTOS_PER_SET);
    expect(results.filter((r) => r === "too_many")).toHaveLength(2);
    const row = (await d.sets.get(id))!;
    expect(row.photos).toHaveLength(10);
    expect(new Set(row.photos.map((p) => p.id)).size).toBe(10);
    expect(row.consent!.photoIds).toHaveLength(10);
    expect(evaluateSetGate(row).ok).toBe(true);
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]); // rejected uploads left no files
  });

  it("removes a photo with its files", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    const v = await addSetPhoto(d, "u1", id, await jpeg());
    await removeSetPhoto(d, "u1", id, v.photos[0].id);
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]);
    expect((await d.sets.get(id))!.photos).toHaveLength(0);
  });
});

describe("photo_sets withdrawal, purge, delete, export", () => {
  it("withdrawal deletes photos, previews and print files and blocks more uploads", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    await addSetPhoto(d, "u1", id, await jpeg());
    await d.storage.putPrivate("photo-sets/u1/" + id + "/derived/print.pdf", Buffer.from("%PDF"), "application/pdf");
    await registerDerivedFile(d, id, { kind: "print_pdf", path: "photo-sets/u1/" + id + "/derived/print.pdf", contentType: "application/pdf" });
    await withdrawSetConsent(d, "u1", id);
    const row = (await d.sets.get(id))!;
    expect(row.photos).toHaveLength(0);
    expect(row.derived).toHaveLength(0);
    expect(row.consent!.withdrawnAt).toBeTruthy();
    expect(() => readFileSync(path.join(root, "storage", "photo-sets", "u1", id, "derived", "print.pdf"))).toThrow();
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]);
    expect(await code(addSetPhoto(d, "u1", id, await jpeg()))).toBe("consent_required");
  });

  it("purges unordered photos at 90 days, with derived print files", async () => {
    const { d, root, clock } = setup();
    const id = await readyset(d);
    await addSetPhoto(d, "u1", id, await jpeg());
    const pdf = `photo-sets/u1/${id}/derived/proof.jpg`;
    await d.storage.putPrivate(pdf, Buffer.from("x"), "image/jpeg");
    await registerDerivedFile(d, id, { kind: "proof", path: pdf, contentType: "image/jpeg" });
    await registerDerivedFile(d, id, { kind: "proof", path: pdf, contentType: "image/jpeg" }); // idempotent
    expect((await d.sets.get(id))!.derived).toHaveLength(1);

    expect((await setsExpiringSoon(d, new Date("2026-11-01T13:00:00Z")))).toHaveLength(0);
    expect((await setsExpiringSoon(d, new Date("2027-01-20T00:00:00Z")))).toHaveLength(1);
    expect(await purgeExpiredSets({ ...d, root }, new Date("2026-12-30T00:00:00Z"))).toMatchObject({ photosDeleted: 0 });
    clock.t = new Date("2027-02-01T00:00:00Z");
    expect(await purgeExpiredSets({ ...d, root }, clock.t)).toEqual({ photosDeleted: 1, derivedDeleted: 1, setsTouched: 1 });
    const row = (await d.sets.get(id))!;
    expect(row.photos).toHaveLength(0);
    expect(row.derived).toHaveLength(0);
    expect(row.consent).toBeTruthy(); // consent row stays, no photos in it
    const audit = await auditSetRetention({ ...d, root }, clock.t);
    expect(audit.overdue).toEqual([]);
    expect(audit.orphanFiles).toEqual([]);
  });

  it("holds photos while an order is open, then keeps them 90 days after it is final", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    await addSetPhoto(d, "u1", id, await jpeg());
    await placeOrderHold(d, id, "o1");
    await placeOrderHold(d, id, "o1");
    expect((await d.sets.get(id))!.holds).toHaveLength(1);
    expect((await purgeExpiredSets({ ...d, root }, new Date("2027-06-01T00:00:00Z"))).photosDeleted).toBe(0);
    await markOrderFinal(d, id, "o1", new Date("2027-06-01T00:00:00Z"));
    expect((await purgeExpiredSets({ ...d, root }, new Date("2027-08-20T00:00:00Z"))).photosDeleted).toBe(0); // day 80
    expect((await purgeExpiredSets({ ...d, root }, new Date("2027-09-01T00:00:00Z"))).photosDeleted).toBe(1); // day 92
  });

  it("delete-my-data removes sets, files and rows; export lists metadata without paths", async () => {
    const { d, root } = setup();
    const id = await readyset(d);
    await attachDesign(d, "u1", id, "dg1");
    await attachDesign(d, "u1", id, "dg1");
    await addSetPhoto(d, "u1", id, await jpeg());
    const other = await createPhotoSet(d, "u2");
    const exp = await exportUserPhotoSets(d, "u1");
    expect(exp[0].designIds).toEqual(["dg1"]);
    expect(JSON.stringify(exp)).not.toContain("photo-sets/");
    expect(await deleteUserPhotoSets({ ...d, root }, "u1")).toEqual({ sets: 1, photos: 1, derived: 0 });
    expect(await d.sets.listByUser("u1")).toHaveLength(0);
    expect(await d.sets.get(other.id)).toBeTruthy();
    expect((await auditSetRetention({ ...d, root })).orphanFiles).toEqual([]);
  });
});
