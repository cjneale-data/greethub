/**
 * Collage layout engine types. All geometry is in inches, measured from the top-left corner of the TRIM
 * (the finished card edge). Bleed sits outside the trim, so bleed coordinates are negative or past trim.w / trim.h.
 */

export type PrintSizeId = "flat_5x7" | "flat_4x6" | "flat_3_5x5";
export type Orientation = "portrait" | "landscape";

export type PrintSize = {
  id: PrintSizeId;
  label: string;
  orientation: Orientation;
  /** Finished card size in inches. */
  trim: { w: number; h: number };
  /** Extra image past each trim edge, inches (0.125 for every GreetHub flat card). */
  bleed: number;
  /** Keep text and faces this far inside the trim, inches. */
  safe: number;
};

export type Rect = { x: number; y: number; w: number; h: number };

type SlotBase = Rect & {
  id: string;
  /**
   * When true, any edge of the slot that sits on a trim edge (within 0.01 in) is pushed out to the page edge
   * so the image runs through the bleed. Lets template authors write full-bleed slots in trim coordinates.
   */
  bleed?: boolean;
  /** Degrees clockwise about `pivot` (trim inches; default the slot centre). Frame and photo share a pivot so they turn as one. */
  rotate?: number;
  pivot?: { x: number; y: number };
  /** Paint order. Slots without z paint at their array index, so z 1.5 sits between the second and third slot. */
  z?: number;
  /** May stay empty without blocking approval. */
  optional?: boolean;
};

/** Pixel thresholds per slot from the design spec, [w, h] at the slot's painted size. Informational; DPI drives levels. */
export type MinPixels = { warnBelow: [number, number]; blockBelow: [number, number]; ideal: [number, number] };

export type PhotoSlot = SlotBase & {
  kind: "photo";
  /** Lower fills first when photos are auto-placed. Defaults to largest-area-first. */
  priority?: number;
  /** Corner radius in inches (polaroid and rounded layouts). */
  radius?: number;
  /** "circle" clips the photo to the ellipse inscribed in the slot. */
  mask?: "circle";
  /** Where faces should land: "upper" keeps them in the top third (text bands sit below). Default "center". */
  faceZone?: "upper" | "center";
  hero?: boolean;
  minPixels?: MinPixels;
};

export type TextAlign = "left" | "center" | "right";

export type TextSlot = SlotBase & {
  kind: "text";
  /** Font key from the brand font list or a handwriting style id. Renderers map this to a family. */
  font: string;
  /** Size in points (1/72 in). Auto-fit shrinks from here down to `minPt`, never below. */
  sizePt: number;
  minPt?: number;
  /** Line height as a multiple of the size. Default 1.2. */
  lineHeight?: number;
  /** Text role from the design spec (headline, names, body...). The theme maps roles to text styles. */
  role?: string;
  /** Design text key shared across slots and sides (names_year, greeting...). `design.text[id]` wins over `[bind]`. */
  bind?: string;
  /** Overflow continues in this text slot (two-column letters). */
  flowTo?: string;
  maxWords?: number;
  /** Draw a tick box before the text (RSVP accept / decline lines). */
  checkbox?: boolean;
  color: string;
  align?: TextAlign;
  valign?: "top" | "middle" | "bottom";
  /** Shown in the editor and used when the design has no value for this slot. */
  placeholder?: string;
  maxLines?: number;
  weight?: "normal" | "bold" | number;
  /** Tracking in em (0.12 = +120/1000). */
  letterSpacing?: number;
  uppercase?: boolean;
};

export type ArtSlot = SlotBase & {
  kind: "art";
  /** Asset key (designed background, frame, ornament). The renderer is given the bytes. */
  asset?: string;
  /** Flat fill used when no asset bytes are supplied. */
  fill?: string;
  opacity?: number;
  /**
   * Design role: pattern, panel, scrim, polaroid_frame, border, rule, writein_rule, brand_mark, calendar, qr,
   * postage_clear, usps_barcode_clear_zone. Also the default asset key.
   */
  role?: string;
  /** "bottom-up": a scrim that is `maxOpacity` at the bottom fading to clear at the top. */
  gradient?: "bottom-up" | "top-down";
  maxOpacity?: number;
  /** Must stay free of ink (postage corner, USPS barcode zone). Never painted. */
  keepClear?: boolean;
  /** Outline colour for rules, frames and borders drawn without an asset. */
  stroke?: string;
  /** Label printed at the start of a write-in rule ("M" for Mr/Ms on RSVPs). */
  label?: string;
};

export type Slot = PhotoSlot | TextSlot | ArtSlot;

export type Template = {
  id: string;
  name: string;
  /** Size the slot geometry was authored for. `fitTemplate()` scales it to another size. */
  size: PrintSizeId;
  orientation: Orientation;
  background: string;
  /** Painting order is the array order: first is at the back. */
  slots: Slot[];
  tags?: string[];
  /** Which side of the card this layout is for. Default front. */
  side?: CardSide;
  products?: string[];
  /** Text sits on a photo here; the proof step must run the contrast check (design doc section 6). */
  requiresContrastCheck?: boolean;
  allowsOverlap?: boolean;
  /** Theme the template was resolved with, if any. */
  themeId?: string;
};

export type CardSide = "front" | "back";

/** Where the photo sits in its slot. All fields optional so a user override can set just one. */
export type Crop = {
  /** Point of the photo kept at the centre of the slot, 0..1 of the oriented photo. Clamped so the slot stays covered. */
  focusX: number;
  focusY: number;
  /** 1 = the largest crop that still covers the slot. 2 = half as wide (closer in). Min 1. */
  zoom: number;
};

/** Source pixel rectangle cut from the (EXIF-oriented) photo. */
export type PixelRect = { left: number; top: number; width: number; height: number };

export type PhotoInfo = {
  id: string;
  /** Oriented pixel size (after applying EXIF rotation). */
  width: number;
  height: number;
  /** Suggested focus, 0..1, from attention analysis or the centre fallback. */
  focusX: number;
  focusY: number;
  focusSource: "attention" | "center" | "given";
  /** Face boxes, 0..1 of the oriented photo, from a face detector when one runs. Auto-crop keeps them in frame. */
  faces?: Rect[];
};

export type PlacedPhoto = { slotId: string; photoId: string; crop: Crop };

export type Design = {
  templateId: string;
  size: PrintSizeId;
  photos: PlacedPhoto[];
  /** Text slot id to the customer's words. Missing means the slot's placeholder. */
  text: Record<string, string>;
};

/** What a user can change per slot. */
export type SlotOverride = { photoId?: string | null } & Partial<Crop>;

/**
 * Effective-DPI levels (design doc section 5): ok at 200+; low (amber) 150-199; too_low (red, the person must tick
 * "Print it anyway") 100-149; blocked under 100 (swap the photo or pick a smaller slot).
 */
export type QualityLevel = "ok" | "low" | "too_low" | "blocked";
export type SlotQuality = { slotId: string; photoId: string; dpi: number; level: QualityLevel; message?: string; upscale: number };

/** One side of a card: the layout and what the customer put in it. */
export type CardSideDesign = { template: Template; design: Pick<Design, "photos" | "text"> };
