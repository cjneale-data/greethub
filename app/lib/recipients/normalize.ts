/**
 * Cleaning and normalizing names and US addresses before validation, plus the dedupe key.
 * Pure functions, no I/O, no logging (these are third parties' addresses).
 */

const CONTROL = /[\u0000-\u001f\u007f]/g;

/** Trims, collapses whitespace and strips control characters. Caps length so a hostile file can't blow up memory. */
export function cleanText(v: unknown, cap = 500): string {
  if (v == null) return "";
  return String(v).replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, cap);
}

/* ---------- US states and territories ---------- */

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", VI: "Virgin Islands", GU: "Guam", AS: "American Samoa", MP: "Northern Mariana Islands",
  AA: "Armed Forces Americas", AE: "Armed Forces Europe", AP: "Armed Forces Pacific",
};
const STATE_BY_NAME: Record<string, string> = Object.fromEntries(Object.entries(US_STATES).map(([code, name]) => [name.toUpperCase(), code]));
STATE_BY_NAME["WASHINGTON DC"] = "DC";
STATE_BY_NAME["WASHINGTON D C"] = "DC";
STATE_BY_NAME["US VIRGIN ISLANDS"] = "VI";
const STATE_NAMES_LONGEST_FIRST = Object.entries(STATE_BY_NAME).sort((a, b) => b[0].length - a[0].length);

/** "new york", "N.Y.", "ny" -> "NY". Returns undefined when it isn't a US state or territory. */
export function usStateCode(region: string): string | undefined {
  const r = region.toUpperCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (r.length === 2 && US_STATES[r]) return r;
  return STATE_BY_NAME[r];
}

/* ---------- country ---------- */

const COUNTRY_ALIASES: Record<string, string> = {
  US: "US", USA: "US", "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US", AMERICA: "US",
  CANADA: "CA", UK: "GB", "UNITED KINGDOM": "GB", "GREAT BRITAIN": "GB", ENGLAND: "GB", MEXICO: "MX",
};

export const COUNTRY_NAMES: Record<string, string> = { US: "United States", CA: "Canada", GB: "United Kingdom", MX: "Mexico" };

/** Blank means US (we mail in the US to start). Known names become 2-letter codes; anything else is returned uppercased for validation to flag. */
export function normalizeCountry(country: string): string {
  const c = country.toUpperCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (!c) return "US";
  return COUNTRY_ALIASES[c] ?? c;
}

/* ---------- ZIP ---------- */

/**
 * Fixes what spreadsheets do to ZIP codes: Excel drops leading zeros ("2134" for 02134) and ZIP+4 loses its dash.
 * `fixed` is true when we padded, so the preview can ask the person to check.
 */
export function normalizeZip(zip: string, country: string): { value: string; fixed: boolean } {
  const z = zip.replace(/\s+/g, "");
  if (country !== "US") return { value: zip.trim(), fixed: false };
  // A bare 9-digit run is ZIP+4 without the dash. 6 to 8 digits is ambiguous: leave it for validation to flag.
  if (/^\d{9}$/.test(z)) return { value: `${z.slice(0, 5)}-${z.slice(5)}`, fixed: false };
  const m = z.match(/^(\d{3,5})(?:-(\d{4}))?$/);
  if (!m) return { value: z, fixed: false };
  const five = m[1].padStart(5, "0");
  return { value: m[2] ? `${five}-${m[2]}` : five, fixed: five !== m[1] };
}

/* ---------- abbreviations (USPS Publication 28 style) ---------- */

export const STREET_SUFFIX: Record<string, string> = {
  STREET: "ST", STR: "ST", AVENUE: "AVE", AV: "AVE", AVE: "AVE", ROAD: "RD", DRIVE: "DR", LANE: "LN", COURT: "CT",
  BOULEVARD: "BLVD", PLACE: "PL", TERRACE: "TER", CIRCLE: "CIR", PARKWAY: "PKWY", HIGHWAY: "HWY", TRAIL: "TRL",
  SQUARE: "SQ", PLAZA: "PLZ", POINT: "PT", CROSSING: "XING", EXPRESSWAY: "EXPY", FREEWAY: "FWY", ALLEY: "ALY",
};
const DIRECTIONAL: Record<string, string> = {
  NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W", NORTHEAST: "NE", NORTHWEST: "NW", SOUTHEAST: "SE", SOUTHWEST: "SW",
};
export const UNIT_DESIGNATOR: Record<string, string> = {
  APARTMENT: "APT", APT: "APT", SUITE: "STE", STE: "STE", UNIT: "UNIT", FLOOR: "FL", ROOM: "RM", BUILDING: "BLDG", "#": "#",
};

/* ---------- dedupe key ---------- */

function keyTokens(s: string): string[] {
  return s
    .toUpperCase()
    .replace(/[.,'"`]/g, " ")
    .replace(/#/g, " # ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      if (UNIT_DESIGNATOR[t]) return "#"; // "Apt 4", "Unit 4", "#4" all mean the same box
      return STREET_SUFFIX[t] ?? DIRECTIONAL[t] ?? t;
    });
}

/**
 * The same mailbox, however it was typed: "12 Elm Street, Apt. 4" and "12 ELM ST #4" give the same key.
 * Uses street, unit, city, state, the 5-digit ZIP and country. Names are not part of it: one envelope per address.
 */
export function addressKey(a: { line1: string; line2?: string; city: string; region: string; postalCode: string; country: string }): string {
  const country = normalizeCountry(a.country);
  const region = country === "US" ? (usStateCode(a.region) ?? a.region.toUpperCase().trim()) : a.region.toUpperCase().trim();
  const zip = country === "US" ? a.postalCode.replace(/\s+/g, "").slice(0, 5) : a.postalCode.toUpperCase().replace(/\s+/g, "");
  const street = keyTokens(`${a.line1} ${a.line2 ?? ""}`).join(" ");
  const city = keyTokens(a.city).join(" ");
  return [street, city, region, zip, country].join("|");
}

/* ---------- names ---------- */

function lastName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
function firstNames(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] ?? "";
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "Rivera" -> "The Riveras", "Jones" -> "The Joneses". Surnames ending in y keep the y ("The Kennedys"). */
export function familyPlural(surname: string): string {
  const s = surname.trim();
  if (!s) return "";
  return /(s|x|z|ch|sh)$/i.test(s) ? `The ${s}es` : `The ${s}s`;
}

/**
 * A sensible envelope line from the people in a household:
 * one person -> "Ana Rivera"; two with one surname -> "Ana and Luis Rivera";
 * three or more with one surname -> "The Rivera Family"; different surnames -> "Ana Rivera and Sam Lee".
 */
export function suggestHouseholdName(names: string[]): string {
  const people = names.map((n) => cleanText(n, 120)).filter(Boolean);
  if (people.length === 0) return "";
  if (people.length === 1) return people[0];
  const surnames = people.map(lastName);
  const shared = surnames[0] && surnames.every((s) => s.toUpperCase() === surnames[0].toUpperCase()) ? surnames[0] : "";
  if (shared && people.length === 2) return `${firstNames(people[0])} and ${firstNames(people[1])} ${shared}`;
  if (shared) return `The ${shared} Family`;
  return joinAnd(people);
}

/** Splits a "names" cell: "Ana Rivera; Luis Rivera" or "Ana Rivera & Luis Rivera". */
export function splitNames(cell: string): string[] {
  return cell
    .split(/\s*[;&|]\s*/)
    .map((n) => cleanText(n, 120))
    .filter(Boolean);
}

/* ---------- one-line addresses ---------- */

export type ParsedAddress = { line1: string; line2?: string; city: string; region: string; postalCode: string; country?: string };

function splitStateFromCity(beforeZip: string): { city?: string; region: string } | undefined {
  const s = beforeZip.trim();
  if (usStateCode(s)) return { region: usStateCode(s)! };
  const two = s.match(/^(.*\S)\s+([A-Za-z]{2}|[A-Za-z]\.[A-Za-z]\.)$/);
  if (two && usStateCode(two[2])) return { city: two[1].replace(/,$/, "").trim(), region: usStateCode(two[2])! };
  const upper = s.toUpperCase();
  // Longest names first, so "Charleston West Virginia" is WV, not "Charleston West" in VA.
  for (const [name, code] of STATE_NAMES_LONGEST_FIRST) {
    if (upper.endsWith(" " + name)) return { city: s.slice(0, s.length - name.length).replace(/,\s*$/, "").trim(), region: code };
  }
  return undefined;
}

/**
 * Parses a US address typed on one line, as wedding spreadsheets often have it:
 * "12 Elm St, Apt 4, Springfield, IL 62704" or "12 Elm St\nSpringfield IL 62704 USA".
 * Returns undefined when it can't find a street, city, state and ZIP.
 */
export function parseOneLineAddress(raw: string): ParsedAddress | undefined {
  const parts = raw
    .replace(/\r?\n/g, ",")
    .split(",")
    .map((p) => cleanText(p))
    .filter(Boolean);
  let country: string | undefined;
  if (parts.length && normalizeCountry(parts[parts.length - 1]) === "US" && /[A-Za-z]/.test(parts[parts.length - 1]) && !usStateCode(parts[parts.length - 1])) {
    country = "US";
    parts.pop();
  }
  // "... IL 62704 USA" on the last part
  if (parts.length) {
    const tail = parts[parts.length - 1].match(/^(.*\d)\s+(USA|U\.S\.A\.?|US|United States)$/i);
    if (tail) {
      parts[parts.length - 1] = tail[1];
      country = "US";
    }
  }
  if (parts.length < 2) return undefined;
  let last = parts.pop()!;
  let zip: string;
  if (/^\d{3,5}(-?\d{4})?$/.test(last)) {
    zip = last;
    if (parts.length < 2) return undefined;
    last = parts.pop()!;
  } else {
    const m = last.match(/^(.*\S)\s+(\d{3,5}(?:-?\d{4})?)$/);
    if (!m) return undefined;
    zip = m[2];
    last = m[1];
  }
  const st = splitStateFromCity(last);
  if (!st) return undefined;
  let city = st.city;
  if (!city) {
    if (parts.length < 2) return undefined;
    city = parts.pop()!;
  }
  if (parts.length < 1 || !city) return undefined;
  const [line1, ...rest] = parts;
  return { line1, line2: rest.length ? rest.join(", ") : undefined, city, region: st.region, postalCode: zip, country };
}
