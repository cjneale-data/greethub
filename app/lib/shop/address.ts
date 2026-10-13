import { AddressSchema, PRICING, type Address } from "@greethub/shared";

export type AddressErrors = Partial<Record<keyof Address, string>>;

const PO_BOX = /\b(p\.?\s*o\.?\s*box|post\s+office\s+box|postal\s+box)\b/i;
const US_ZIP = /^\d{5}(-\d{4})?$/;

/** Validates a ship-to address with the shared schema plus delivery rules (PO boxes, US postcodes, supported countries). */
export function validateAddress(input: unknown): { ok: true; address: Address } | { ok: false; errors: AddressErrors } {
  const base = AddressSchema.safeParse({ country: "US", ...(typeof input === "object" && input ? input : {}) });
  const errors: AddressErrors = {};
  if (!base.success) {
    for (const issue of base.error.issues) {
      const key = issue.path[0] as keyof Address | undefined;
      if (key && !errors[key]) errors[key] = key === "country" ? "Pick a country" : issue.message === "Required" ? "Required" : issue.message;
    }
    // Still run the format checks below on what we can read, so the user sees everything at once.
  }
  const raw = (typeof input === "object" && input ? input : {}) as Record<string, unknown>;
  const line1 = String(raw.line1 ?? "");
  const line2 = String(raw.line2 ?? "");
  const country = String(raw.country ?? "US").toUpperCase();
  const postal = String(raw.postalCode ?? "").trim();
  if (PO_BOX.test(line1) || PO_BOX.test(line2)) errors.line1 = "We can't ship to PO boxes. Use a street address.";
  if (country && !(PRICING.shipCountries as readonly string[]).includes(country) && !errors.country) {
    errors.country = "We ship to the US to start. More countries soon.";
  }
  if (country === "US" && postal && !US_ZIP.test(postal) && !errors.postalCode) {
    errors.postalCode = "We can't find that address. Check the ZIP code and street.";
  }
  if (country === "US" && raw.region && !/^[A-Za-z .'-]{2,}$/.test(String(raw.region)) && !errors.region) errors.region = "Check the state";
  if (Object.keys(errors).length > 0 || !base.success) return { ok: false, errors };
  return { ok: true, address: base.data };
}

export function formatAddressLine(a: Pick<Address, "name" | "line1" | "city" | "region">): string {
  return `${a.name}, ${a.line1}, ${a.city}, ${a.region}`;
}

/** Earliest allowed arrive-by date (YYYY-MM-DD) given today. */
export function earliestDeliveryDate(today: Date = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + PRICING.earliestDeliveryDays);
  return d.toISOString().slice(0, 10);
}
