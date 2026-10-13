"use client";
import { TextField } from "@/components/brand";
import { PRICING, type Address } from "@greethub/shared";

export type AddressDraft = Partial<Record<keyof Address, string>>;
export const EMPTY_ADDRESS: AddressDraft = { name: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "US" };

const REQUIRED: (keyof Address)[] = ["name", "line1", "city", "region", "postalCode"];

/** Quick client-side check so people see problems before a round trip. The server re-validates everything. */
export function quickErrors(a: AddressDraft): Record<string, string> {
  const e: Record<string, string> = {};
  for (const k of REQUIRED) if (!a[k]?.trim()) e[k] = "Required";
  if (a.line1 && /\bp\.?\s*o\.?\s*box\b/i.test(a.line1)) e.line1 = "We can't ship to PO boxes. Use a street address.";
  if ((a.country || "US") === "US" && a.postalCode?.trim() && !/^\d{5}(-\d{4})?$/.test(a.postalCode.trim())) e.postalCode = "We can't find that address. Check the ZIP code and street.";
  return e;
}

export function AddressFields({ value, onChange, errors = {}, prefix }: { value: AddressDraft; onChange: (v: AddressDraft) => void; errors?: Record<string, string>; prefix: string }) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const f = (k: keyof Address, label: string, extra: Record<string, string> = {}) => (
    <TextField label={label} name={`${prefix}-${k}`} value={value[k] ?? ""} onChange={set(k)} error={errors[k]} {...extra} />
  );
  return (
    <div className="gs-form-grid">
      <div className="gs-span2">{f("name", "Name", { autoComplete: "name" })}</div>
      <div className="gs-span2">{f("line1", "Address line 1", { autoComplete: "address-line1" })}</div>
      <div className="gs-span2">{f("line2", "Address line 2 (optional)", { autoComplete: "address-line2" })}</div>
      {f("city", "City", { autoComplete: "address-level2" })}
      {f("region", "State", { autoComplete: "address-level1" })}
      {f("postalCode", "ZIP code", { autoComplete: "postal-code", inputMode: "numeric" })}
      <label className="gh-field">
        <span className="gh-field__label">Country</span>
        <select className="gs-select" value={value.country ?? "US"} onChange={set("country")} aria-invalid={!!errors.country}>
          {PRICING.shipCountries.map((c) => (
            <option key={c} value={c}>{c === "US" ? "United States" : c}</option>
          ))}
        </select>
        {errors.country && <span className="gh-field__hint gh-field__hint--error">{errors.country}</span>}
      </label>
    </div>
  );
}
