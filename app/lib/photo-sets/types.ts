/**
 * photo_sets: shared photo intake for photo cards and events (docs/book/photo-intake-reuse.md section 3).
 * Additive: nothing in lib/book imports this yet. Browser-safe types only.
 */
export type StoredPhoto = {
  id: string;
  /** Private storage path of the cleaned original (JPEG, EXIF stripped, long edge capped). */
  path: string;
  /** 1200 px preview for the editor, same retention as the original. */
  previewPath: string;
  contentType: "image/jpeg";
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  /** The consent record this upload was made under (legal req 4). */
  consentId: string;
  /** Delete date if no order ever uses the photo (upload + 90 days). Orders move it, see purge.ts. */
  expiresAt: string;
  /** Auto-crop focus (sharp attention, not a face model). Goes with the photo when it is purged. */
  focus?: { x: number; y: number; source: "attention" | "center" };
};

/** A file built from the photos (proof JPEG, print PDF, event image). Purged together with the photos. */
export type DerivedFile = {
  id: string;
  kind: "proof" | "print_pdf" | "event_image" | "other";
  path: string;
  contentType: string;
  createdAt: string;
  designVersionId?: string;
};

/** An order that needs the photos. While `finalAt` is unset the photos are held (never purged). */
export type OrderHold = { orderId: string; placedAt: string; finalAt?: string };

/** `bAi` is true only when the customer turned on an AI feature. */
export type SetConsentBoxes = { a: boolean; b: boolean; bAi: boolean };

export type SetConsentRecord = {
  id: string;
  userId: string;
  recordedAt: string;
  ip: string;
  userAgent: string;
  variant: "photo_card";
  wordingVersion: string;
  wordingHash: string;
  boxes: SetConsentBoxes;
  photoIds: string[];
  withdrawnAt?: string;
};

export type PhotoSet = {
  id: string;
  userId: string;
  designIds: string[];
  photos: StoredPhoto[];
  derived: DerivedFile[];
  consent?: SetConsentRecord;
  consentHistory: SetConsentRecord[];
  holds: OrderHold[];
  createdAt: string;
  updatedAt: string;
};

/** What the browser sees: no storage paths, no IP or user agent. */
export type PhotoSetView = {
  id: string;
  designIds: string[];
  photos: { id: string; width: number; height: number; deleteBy: string; focus?: StoredPhoto["focus"] }[];
  consent?: { recordedAt: string; boxes: SetConsentBoxes; withdrawnAt?: string };
  consentOk: boolean;
  createdAt: string;
  updatedAt: string;
};

export class SetError extends Error {
  constructor(public status: number, public code: string, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}
