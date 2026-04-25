import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";

/** Structured address (camelCase — matches API / Mongoose) */
export interface StructuredAddress {
  streetAddress?: string;
  area?: string;
  city?: string;
  taluka?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export function trimAddressPart(s: unknown): string {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Digits only, max length 10 (store as string) */
export function normalizePincodeInput(s: unknown): string {
  return String(s ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

export function validatePincodeDigits(pinRaw: string): string | null {
  const digits = normalizePincodeInput(pinRaw);
  if (digits.length < 5 || digits.length > 10) {
    return "Pincode must be 5–10 digits";
  }
  return null;
}

/**
 * Spec: comma-separated single line.
 * street + area + city + taluka + district + "state - pincode" + country
 */
export function buildFullAddressComma(a: StructuredAddress): string {
  const parts: string[] = [];
  const p = (x?: string) => {
    const t = trimAddressPart(x);
    if (t) parts.push(t);
  };
  p(a.streetAddress);
  p(a.area);
  p(a.city);
  p(a.taluka);
  p(a.district);
  const state = trimAddressPart(a.state);
  const pin = normalizePincodeInput(a.pincode);
  if (state && pin) parts.push(`${state} - ${pin}`);
  else {
    if (state) parts.push(state);
    if (pin) parts.push(pin);
  }
  p(a.country);
  return parts.join(", ");
}

/** Multi-line display (SaaS-style blocks) */
export function buildFullAddressMultiline(a: StructuredAddress): string {
  const line1 = [trimAddressPart(a.streetAddress), trimAddressPart(a.area)]
    .filter(Boolean)
    .join(", ");
  const line2 = [
    trimAddressPart(a.city),
    trimAddressPart(a.taluka),
    trimAddressPart(a.district),
  ]
    .filter(Boolean)
    .join(", ");
  const state = trimAddressPart(a.state);
  const pin = normalizePincodeInput(a.pincode);
  let line3 = "";
  if (state && pin) line3 = `${state} - ${pin}`;
  else line3 = [state, pin].filter(Boolean).join(" ");
  const line4 = trimAddressPart(a.country);
  return [line1, line2, line3, line4].filter(Boolean).join("\n");
}

/** Table cell: street + city + pincode */
export function buildAddressTableSummary(a: StructuredAddress): string {
  const bits = [
    trimAddressPart(a.streetAddress),
    trimAddressPart(a.city),
    normalizePincodeInput(a.pincode),
  ].filter(Boolean);
  return bits.join(", ") || "—";
}

export function assertRequiredAddressParts(a: StructuredAddress): void {
  if (!trimAddressPart(a.streetAddress)) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "streetAddress is required"
    );
  }
  if (!trimAddressPart(a.city)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "city is required");
  }
  if (!trimAddressPart(a.state)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "state is required");
  }
  const pin = trimAddressPart(a.pincode);
  if (!pin) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "pincode is required");
  }
  const err = validatePincodeDigits(pin);
  if (err) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, err);
  }
}

/** Normalize all string fields (trim); pincode digits only */
export function normalizeStructuredAddress(
  raw: Record<string, unknown>
): StructuredAddress {
  return {
    streetAddress: trimAddressPart(raw.streetAddress ?? raw.street_address),
    area: trimAddressPart(raw.area),
    city: trimAddressPart(raw.city),
    taluka: trimAddressPart(raw.taluka),
    district: trimAddressPart(raw.district),
    state: trimAddressPart(raw.state),
    country: trimAddressPart(raw.country),
    pincode: normalizePincodeInput(raw.pincode ?? raw.pinCode),
  };
}

/** Migrate legacy single-line `address` into backup + optional street seed */
export function seedFromLegacyAddress(
  legacy: unknown
): { fullAddressBackup: string; streetAddress?: string } {
  const s = trimAddressPart(legacy);
  if (!s) return { fullAddressBackup: "" };
  return { fullAddressBackup: s, streetAddress: s };
}
