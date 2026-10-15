import type { Address } from "@greethub/shared";
import { validateAddress } from "../shop/address";
import { cleanText, normalizeCountry, normalizeZip, suggestHouseholdName, usStateCode } from "./normalize";
import type { AddressCheck, AddressPurpose, Clock, Recipient, RecipientDraft, RecipientErrors, RecipientSource } from "./types";

export const MAX_NAMES_PER_HOUSEHOLD = 8;
export const MAX_TAGS = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** The shop's PO-box message (lib/shop/address.ts). Letters can go to PO boxes; parcels can't. */
const PO_BOX_ERROR = /PO box/i;

/** Trims and normalizes every field of a draft (country code, state code, ZIP padding). */
export function cleanDraft(d: RecipientDraft): { draft: RecipientDraft; warnings: string[] } {
  const warnings: string[] = [];
  const country = normalizeCountry(cleanText(d.country));
  let region = cleanText(d.region, 100);
  if (country === "US" && region) region = usStateCode(region) ?? region;
  const zip = normalizeZip(cleanText(d.postalCode, 20), country);
  if (zip.fixed) warnings.push("The ZIP code looked short, so we added a leading zero. Check it.");
  const names = (d.names ?? []).map((n) => cleanText(n, 120)).filter(Boolean);
  const draft: RecipientDraft = {
    householdName: cleanText(d.householdName, 200) || undefined,
    names,
    line1: cleanText(d.line1, 250),
    line2: cleanText(d.line2, 250) || undefined,
    city: cleanText(d.city, 120),
    region,
    postalCode: zip.value,
    country,
    email: cleanText(d.email, 254).toLowerCase() || undefined,
    tags: cleanTags(d.tags),
  };
  return { draft, warnings };
}

/** Lowercase, trimmed, deduped, at most MAX_TAGS of 30 characters each. */
export function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const t of tags) {
    const v = cleanText(t, 30).toLowerCase();
    if (v && !out.includes(v)) out.push(v);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export type RecipientValidation =
  | { ok: true; recipient: Recipient; warnings: string[] }
  | { ok: false; errors: RecipientErrors; warnings: string[]; draft: RecipientDraft };

/**
 * Validates one recipient with the shop's AddressSchema/validateAddress, plus:
 * - the household line is required (we print it), and falls back to the people's names;
 * - US states must be a real state or territory code;
 * - PO boxes are allowed when the card is mailed as a letter (purpose "mail"), not for parcels ("ship").
 */
export function validateRecipient(
  input: RecipientDraft,
  opts: Clock & { purpose?: AddressPurpose; source?: RecipientSource; id?: string; createdAt?: string; validation?: AddressCheck } = {},
): RecipientValidation {
  const { draft, warnings } = cleanDraft(input);
  const errors: RecipientErrors = {};
  const names = draft.names ?? [];
  if (names.length > MAX_NAMES_PER_HOUSEHOLD) errors.names = `Up to ${MAX_NAMES_PER_HOUSEHOLD} names per household`;
  if (names.some((n) => n.length > 80)) errors.names = "One of the names is too long";
  const household = draft.householdName || suggestHouseholdName(names);
  if (!household) errors.householdName = "Add a name for the envelope";

  const v = validateAddress({
    name: household || undefined,
    line1: draft.line1,
    line2: draft.line2,
    city: draft.city,
    region: draft.region,
    postalCode: draft.postalCode,
    country: draft.country,
  });
  let address: Address | undefined;
  if (v.ok) {
    address = v.address;
  } else {
    const ae = { ...v.errors };
    // zod's length messages are developer text; say it plainly.
    for (const k of Object.keys(ae) as (keyof typeof ae)[]) if (/too big|<=|too long/i.test(ae[k] ?? "")) ae[k] = "That's too long";
    if ((opts.purpose ?? "mail") === "mail" && ae.line1 && PO_BOX_ERROR.test(ae.line1)) delete ae.line1;
    if (ae.name) {
      if (!errors.householdName) errors.householdName = ae.name === "Required" ? "Add a name for the envelope" : ae.name;
      delete ae.name;
    }
    Object.assign(errors, ae);
  }
  if (draft.country === "US" && draft.region && !usStateCode(draft.region) && !errors.region) errors.region = "Check the state";
  if (draft.email && !EMAIL.test(draft.email)) errors.email = "Check the email address";

  if (Object.keys(errors).length > 0) return { ok: false, errors, warnings, draft };

  // validateAddress only failed on the PO box rule (allowed for mail): build the address from the clean draft.
  address ??= {
    name: household,
    line1: draft.line1!,
    line2: draft.line2,
    city: draft.city!,
    region: draft.region!,
    postalCode: draft.postalCode!,
    country: draft.country!,
  };
  const now = (opts.now ?? new Date()).toISOString();
  const recipient: Recipient = {
    id: opts.id ?? (opts.newId ?? defaultId)(),
    householdName: household,
    names,
    address: { ...address, name: household },
    email: draft.email,
    ...(opts.validation ? { validation: opts.validation } : {}),
    tags: draft.tags ?? [],
    source: opts.source ?? "manual",
    createdAt: opts.createdAt ?? now,
    updatedAt: now,
  };
  return { ok: true, recipient, warnings };
}

export function defaultId(): string {
  return "rc_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/** Back to an editable draft (for the edit form). */
export function toDraft(r: Recipient): RecipientDraft {
  const a = r.address;
  return { householdName: r.householdName, names: [...r.names], line1: a.line1, line2: a.line2, city: a.city, region: a.region, postalCode: a.postalCode, country: a.country, email: r.email, tags: [...(r.tags ?? [])] };
}
