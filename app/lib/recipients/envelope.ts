import type { Address } from "@greethub/shared";
import { COUNTRY_NAMES, STREET_SUFFIX, UNIT_DESIGNATOR, usStateCode } from "./normalize";
import type { Recipient } from "./types";

/**
 * Address blocks for envelopes (recipient on the front, return address on the back flap) and for printer and
 * mailing-partner jobs.
 *
 * "standard": as the person typed it, with "City, ST 12345" on the last line. Looks right in a handwriting font.
 * "usps": USPS Publication 28 style for machine reading: uppercase, no punctuation, standard street-suffix and unit
 * abbreviations, unit on the delivery line when it fits, "CITY ST 12345-6789".
 */
export type EnvelopeStyle = "standard" | "usps";

export type EnvelopeOptions = {
  style?: EnvelopeStyle;
  /** "auto" prints the country only for addresses outside the sender's country (US). */
  country?: "auto" | "always" | "never";
  senderCountry?: string;
  /** Longest line that fits the envelope's address area in the chosen font. A7 at 11 pt is about 40 characters. */
  maxLineLength?: number;
  /** Most lines the address area holds. */
  maxLines?: number;
};

export type AddressBlock = { lines: string[]; warnings: string[] };

const DEFAULTS = { style: "standard" as EnvelopeStyle, country: "auto" as const, senderCountry: "US", maxLineLength: 40, maxLines: 6 };

/** Delivery-line cleanup for USPS style: uppercase, strip punctuation (keep # - / for units, ranges and fractions). */
function uspsLine(s: string): string {
  return s
    .toUpperCase()
    .replace(/[.,;:'"`!?()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The household line keeps & and apostrophes (O'BRIEN reads better than OBRIEN); only periods and commas go. */
function uspsNameLine(s: string): string {
  return s.toUpperCase().replace(/[.,;:"`!?()]/g, "").replace(/\s+/g, " ").trim();
}

function abbreviateStreet(line: string): string {
  const words = line.split(" ");
  const last = words[words.length - 1];
  if (words.length > 1 && STREET_SUFFIX[last]) words[words.length - 1] = STREET_SUFFIX[last];
  return words.join(" ");
}

function abbreviateUnit(line: string): string {
  const words = line.split(" ");
  if (UNIT_DESIGNATOR[words[0]] && words[0] !== "#") words[0] = UNIT_DESIGNATOR[words[0]];
  return words.join(" ").replace(/^#\s+/, "# ");
}

/** Lines for any address. The first line is `address.name` (the household line, or the sender's name). */
export function formatAddressBlock(address: Address, options: EnvelopeOptions = {}): AddressBlock {
  const o = { ...DEFAULTS, ...options };
  const usps = o.style === "usps";
  const country = address.country.toUpperCase();
  const domestic = country === o.senderCountry.toUpperCase();
  const lines: string[] = [];

  const name = address.name.trim();
  lines.push(usps ? uspsNameLine(name) : name);

  let line1 = address.line1.trim();
  let line2 = address.line2?.trim() ?? "";
  if (usps) {
    line1 = abbreviateStreet(uspsLine(line1));
    line2 = line2 ? abbreviateUnit(uspsLine(line2)) : "";
    // Pub 28: the unit goes at the end of the delivery line; if there's no room, on the line above it.
    if (line2 && `${line1} ${line2}`.length <= o.maxLineLength) lines.push(`${line1} ${line2}`);
    else if (line2) lines.push(line2, line1);
    else lines.push(line1);
  } else {
    lines.push(line1);
    if (line2) lines.push(line2);
  }

  const region = country === "US" ? (usStateCode(address.region) ?? address.region.trim()) : address.region.trim();
  const city = address.city.trim();
  const postal = address.postalCode.trim();
  lines.push(usps ? uspsLine(`${city} ${region} ${postal}`).replace(/\s+/g, " ") : `${city}, ${region} ${postal}`);

  const showCountry = o.country === "always" || (o.country === "auto" && !domestic);
  if (showCountry) {
    const label = COUNTRY_NAMES[country] ?? country;
    lines.push(usps ? label.toUpperCase() : label);
  }

  const warnings: string[] = [];
  lines.forEach((l, i) => {
    if (l.length > o.maxLineLength) warnings.push(`Line ${i + 1} is long and may wrap on the envelope.`);
  });
  if (lines.length > o.maxLines) warnings.push(`This address has ${lines.length} lines; the envelope fits ${o.maxLines}.`);
  return { lines, warnings };
}

/** The front of the envelope for one recipient: household line, then the address. */
export function formatEnvelope(r: Pick<Recipient, "householdName" | "address">, options: EnvelopeOptions = {}): AddressBlock {
  return formatAddressBlock({ ...r.address, name: r.householdName }, options);
}

/**
 * The back flap. `name` is what the sender wants printed ("The Nguyens"), defaulting to the address name.
 * The return address is always domestic for us, so the country never prints unless asked.
 */
export function formatReturnAddress(address: Address, options: EnvelopeOptions & { name?: string } = {}): AddressBlock {
  const { name, ...rest } = options;
  return formatAddressBlock({ ...address, name: name?.trim() || address.name }, { country: "never", ...rest });
}

/** One string with newlines, for PDFs and printer APIs that take a text block. */
export function blockText(b: AddressBlock): string {
  return b.lines.join("\n");
}
