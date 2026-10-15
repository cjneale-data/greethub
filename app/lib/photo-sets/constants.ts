export const MAX_PHOTOS_PER_SET = 10;
export const MAX_SETS_PER_USER = 10;

export type IntakeLimits = {
  maxBytes: number;
  minShortEdge: number;
  maxPixels: number;
  maxEdge: number;
  previewEdge: number;
  jpegQuality: number;
};

export const PHOTO_CARD_LIMITS: IntakeLimits = {
  /** Cap on the uploaded file, same as books. */
  maxBytes: 10 * 1024 * 1024,
  /** Hard floor on the short edge (docs/book/photo-intake-reuse.md 4.1). */
  minShortEdge: 800,
  /** sharp refuses larger images before decoding (security review 2.4). */
  maxPixels: 50_000_000,
  /** 3000 px covers a full-bleed 5x7 at 300 DPI with room to zoom. */
  maxEdge: 3000,
  previewEdge: 1200,
  jpegQuality: 88,
};

/** Photos nobody ordered are deleted this long after upload. */
export const PHOTO_RETENTION_DAYS = 90;
/** Photos of an order are kept this long after the order is final. */
export const RETENTION_AFTER_FINAL_DAYS = 90;
export const PURGE_REMINDER_DAYS = 14;
export const SET_COLLECTION = "photo_sets";
