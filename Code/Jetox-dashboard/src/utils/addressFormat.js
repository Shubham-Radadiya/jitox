/** Default shape for structured address (camelCase — matches API). */
export const EMPTY_ADDRESS = {
  streetAddress: "",
  area: "",
  city: "",
  taluka: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",
};

export function trimPart(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePincodeInput(s) {
  return String(s ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

export function buildFullMultiline(a) {
  const v = { ...EMPTY_ADDRESS, ...a };
  const line1 = [trimPart(v.streetAddress), trimPart(v.area)].filter(Boolean).join(", ");
  const line2 = [trimPart(v.city), trimPart(v.taluka), trimPart(v.district)]
    .filter(Boolean)
    .join(", ");
  const state = trimPart(v.state);
  const pin = normalizePincodeInput(v.pincode);
  let line3 = "";
  if (state && pin) line3 = `${state} - ${pin}`;
  else line3 = [state, pin].filter(Boolean).join(" ");
  const line4 = trimPart(v.country);
  return [line1, line2, line3, line4].filter(Boolean).join("\n");
}

export function buildTableSummary(a) {
  const v = { ...EMPTY_ADDRESS, ...a };
  const bits = [
    trimPart(v.streetAddress),
    trimPart(v.city),
    normalizePincodeInput(v.pincode),
  ].filter(Boolean);
  return bits.join(", ") || "—";
}

/** Map API user / legacy `address` into structured fields for forms. */
export function addressFromUser(u) {
  if (!u) return { ...EMPTY_ADDRESS };
  const base = {
    streetAddress: trimPart(u.streetAddress) || trimPart(u.address),
    area: trimPart(u.area),
    city: trimPart(u.city),
    taluka: trimPart(u.taluka),
    district: trimPart(u.district),
    state: trimPart(u.state),
    country: trimPart(u.country) || "India",
    pincode: normalizePincodeInput(u.pincode),
  };
  if (!base.streetAddress && trimPart(u.address)) {
    return { ...base, streetAddress: trimPart(u.address) };
  }
  return base;
}
