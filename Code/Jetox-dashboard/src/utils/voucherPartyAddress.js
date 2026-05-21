/** Address text for a party from purchase/sales form-meta `partyAddresses`. */
export function partyAddressFromMap(partyAddresses, partyName) {
  const key = String(partyName || "").trim();
  if (!key || !partyAddresses || typeof partyAddresses !== "object") return "";
  return String(partyAddresses[key] || "").trim();
}

/** Resolve ship-to party name when loading a saved voucher. */
export function resolveShipToPartyNameFromDoc(doc, partyAddresses = {}) {
  const stored = String(doc?.shipToPartyName ?? "").trim();
  if (stored) return stored;
  const shipDifferent = Boolean(doc?.shipDifferent);
  if (!shipDifferent) return String(doc?.partyName ?? "").trim();
  return inferPartyNameFromAddress(
    partyAddresses,
    String(doc?.shipTo ?? doc?.shipToAndBillTo ?? "").trim()
  );
}

/** Guess party name when editing a voucher whose ship-to text matches a master address. */
export function inferPartyNameFromAddress(partyAddresses, addressText) {
  const target = String(addressText || "").trim();
  if (!target || !partyAddresses || typeof partyAddresses !== "object") {
    return "";
  }
  for (const [name, addr] of Object.entries(partyAddresses)) {
    if (String(addr || "").trim() === target) return name;
  }
  return "";
}
